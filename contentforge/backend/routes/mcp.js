// --- EXTERNAL API v1 (MCP surface) ---
// A remote MCP endpoint at /api/v1/mcp (Streamable HTTP, stateless JSON mode):
// agentic workbenches (Claude Code, Claude Desktop via mcp-remote, any MCP
// client) connect with a cfk_ API key as the bearer credential and see the
// pipeline as native tools. Every tool is a 1:1 wrapper over
// lib/v1Operations.js — the same functions the REST surface runs, so the two
// can never drift, and every key safeguard (workspace scoping, no deletes, no
// credential minting) applies identically.
//
// Stateless: each POST builds a fresh McpServer bound to req.user and tears it
// down after the response — no sessions to track, safe across Cloud Run
// instances. GET/DELETE (SSE resumption, session teardown) are meaningless in
// this mode and get 405 from the transport.
const express = require('express');
const { z } = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const ops = require('../lib/v1Operations');
const { V1Error, ITEM_STATUSES, SOCIAL_CHANNELS, SOCIAL_REVIEW_KINDS } = require('../lib/v1Operations');
const { log: logger } = require('../logger');

const router = express.Router();

// Tool results are the operation's JSON, pretty-printed for the model.
const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const fail = (err) => ({
  isError: true,
  content: [{
    type: 'text',
    text: err instanceof V1Error
      ? `Error (${err.code}): ${err.message}`
      : 'Error (internal): The operation failed unexpectedly.',
  }],
});

const run = (user, toolName, op) => async (args) => {
  try {
    const result = await op(args || {});
    logger.event('v1.mcp.tool', { tool: toolName, apiKeyId: user.apiKey?.id || null, ok: true });
    return ok(result);
  } catch (err) {
    if (!(err instanceof V1Error)) console.error(`[mcp] ${toolName} failed:`, err);
    logger.event('v1.mcp.tool', { tool: toolName, apiKeyId: user.apiKey?.id || null, ok: false });
    return fail(err);
  }
};

// The source input shape POST /api/v1/generations accepts (lib/sources).
const SOURCE_SCHEMA = z.object({
  type: z.enum(['youtube', 'url', 'text', 'github', 'code', 'vault']),
  url: z.string().optional().describe('For youtube/url/github sources'),
  text: z.string().optional().describe('For text/code sources: the pasted content'),
  label: z.string().optional(),
  vaultId: z.string().optional().describe('For vault sources: the Source Vault entry id'),
  paths: z.array(z.string()).optional().describe('For github sources: up to 10 repo-relative file paths'),
});

const PEOPLE_DESC = 'Uids or member emails — emails are resolved to members; an unknown email is an error, never a silent drop.';

// Build a per-request server whose tools act as `user`.
function buildServer(user) {
  const server = new McpServer({ name: 'contentforge', version: '1.0.0' });

  server.registerTool('list_workspaces', {
    title: 'List workspaces',
    description: 'The ContentForge workspaces (content channels: persona, destination, review policy) this credential can generate into. Start here to find workspace ids.',
  }, run(user, 'list_workspaces', () => ops.listWorkspaces(user)));

  server.registerTool('submit_generation', {
    title: 'Generate an article',
    description: 'Submit sources (YouTube links, web articles, pasted text/code, GitHub repos, Source Vault entries) to the content pipeline. The workspace\'s AI persona and brand voice apply automatically. Returns a job to poll with get_job — generation takes minutes. Resubmitting the same source combination succeeds with existing=true instead of duplicating.',
    inputSchema: {
      workspaceId: z.string(),
      sources: z.array(SOURCE_SCHEMA).min(1).max(10),
      brief: z.object({
        angle: z.string().optional(),
        workingTitle: z.string().optional(),
      }).optional().describe('Optional editorial direction for the writer'),
    },
  }, run(user, 'submit_generation', (a) => ops.submitGeneration(user, a)));

  server.registerTool('get_job', {
    title: 'Poll a generation job',
    description: 'Status of an async generation job (queued | running | succeeded | failed) with its pipeline progress stages. On success, result.itemId is the library item. On failure, errorKind "source" means the inputs are fixable by the caller; "internal" means the pipeline failed.',
    inputSchema: { jobId: z.string() },
  }, run(user, 'get_job', (a) => ops.getJob(user, a.jobId)));

  server.registerTool('list_items', {
    title: 'List library items',
    description: 'Article items in a workspace, newest first, with title/status/sources summaries. Statuses: draft -> finalized -> in_review -> approved -> published.',
    inputSchema: {
      workspaceId: z.string(),
      status: z.enum(ITEM_STATUSES).optional(),
      limit: z.number().int().min(1).max(100).optional(),
      cursor: z.string().optional().describe('The previous page\'s nextCursor'),
    },
  }, run(user, 'list_items', (a) => ops.listItems(user, a.workspaceId, a)));

  server.registerTool('get_item', {
    title: 'Get a library item',
    description: 'One library item with its full draft (markdown), image prompt, and QA report.',
    inputSchema: { itemId: z.string() },
  }, run(user, 'get_item', (a) => ops.getItem(user, a.itemId)));

  server.registerTool('import_article', {
    title: 'Import a finished article',
    description: 'Import an article written outside ContentForge (e.g. drafted right here in the workbench) into a workspace\'s library AS-IS — no AI rewriting. Lands as a normal draft; then finalize_item → submit_review / publish_item as usual. The draft\'s H1 heading becomes the title (pass `title` if the draft has no H1).',
    inputSchema: {
      workspaceId: z.string(),
      draft: z.string().describe('The full article markdown, ideally starting with an H1 (# Title)'),
      title: z.string().optional().describe('Title fallback when the draft has no H1 heading'),
    },
  }, run(user, 'import_article', (a) => ops.importArticle(user, a)));

  server.registerTool('finalize_item', {
    title: 'Finalize a draft',
    description: 'Mark a draft as done editing (status -> finalized), optionally replacing the draft markdown. Finalizing is required before submitting for review or publishing in review-gated workspaces. Refuses items that are in review, approved, or published.',
    inputSchema: {
      itemId: z.string(),
      draft: z.string().optional().describe('Replacement draft markdown; omitted, the stored draft is kept'),
    },
  }, run(user, 'finalize_item', (a) => ops.finalizeItem(user, a.itemId, a.draft)));

  server.registerTool('publish_item', {
    title: 'Publish an article',
    description: 'Publish a library item to its workspace\'s Sanity site (the live blog/newsletter). Requires the admin role. Where the workspace requires review, only reviewer-approved items pass — submit_review first and wait for a human decision.',
    inputSchema: { itemId: z.string() },
  }, run(user, 'publish_item', (a) => ops.publishItem(user, a.itemId)));

  server.registerTool('list_reviewers', {
    title: 'List eligible reviewers',
    description: 'The people holding a reviewer grant for a workspace ({uid, email}) — the only valid targets for submit_review. Use this to resolve a person\'s name to their email/uid before tagging them.',
    inputSchema: { workspaceId: z.string() },
  }, run(user, 'list_reviewers', (a) => ops.listReviewers(user, a.workspaceId)));

  server.registerTool('submit_review', {
    title: 'Submit for human review',
    description: `Send finalized content to human reviewers — they get bell and email notifications, and the piece moves to in_review. The approve/request-changes decision is made by a human in the app, never by this API. Content must be finalized first. ${PEOPLE_DESC}`,
    inputSchema: {
      itemId: z.string(),
      reviewers: z.array(z.string()).min(1).describe(PEOPLE_DESC),
      note: z.string().optional().describe('A note for the reviewers'),
      kind: z.enum(['article', ...SOCIAL_REVIEW_KINDS]).optional().describe('Default article; social kinds need a channel'),
      channel: z.enum(SOCIAL_CHANNELS).optional(),
    },
  }, run(user, 'submit_review', (a) => ops.submitItemReview(user, a.itemId, a)));

  server.registerTool('list_comments', {
    title: 'List comments',
    description: 'The comment thread on a library item, oldest first.',
    inputSchema: { itemId: z.string() },
  }, run(user, 'list_comments', (a) => ops.listComments(user, a.itemId)));

  server.registerTool('post_comment', {
    title: 'Comment / tag someone',
    description: `Post a comment on a library item. Mentioned members get bell and email notifications — this is how to tag a person on an article. ${PEOPLE_DESC}`,
    inputSchema: {
      itemId: z.string(),
      text: z.string().max(5000),
      mentions: z.array(z.string()).optional().describe(PEOPLE_DESC),
    },
  }, run(user, 'post_comment', (a) => ops.postItemComment(user, a.itemId, a)));

  server.registerTool('list_socials', {
    title: 'List social content',
    description: 'A workspace\'s generated social pieces (LinkedIn/X text posts, carousels, posters), newest first, with previews. Use get_social for full content.',
    inputSchema: { workspaceId: z.string() },
  }, run(user, 'list_socials', (a) => ops.listSocials(user, a.workspaceId)));

  server.registerTool('get_social', {
    title: 'Get one social piece',
    description: 'Full content of one social piece on an item: text posts return post/thread/cta; carousels return slides; posters return headline/stat/cta.',
    inputSchema: {
      itemId: z.string(),
      channel: z.enum(SOCIAL_CHANNELS),
      format: z.enum(SOCIAL_REVIEW_KINDS).optional().describe('Default text'),
    },
  }, run(user, 'get_social', (a) => ops.getSocial(user, a.itemId, a.channel, a.format)));

  server.registerTool('generate_social', {
    title: 'Generate social content',
    description: 'Turn a library item into platform-native social content (LinkedIn post, X thread, carousel, or poster). The workspace\'s social personas and branding apply automatically. Blocking — returns the reviewable draft directly (may take a minute).',
    inputSchema: {
      itemId: z.string(),
      channel: z.enum(SOCIAL_CHANNELS),
      function: z.string().optional().describe('The content function, e.g. teach (default)'),
      format: z.string().optional().describe('text (default) | carousel | poster'),
      personaId: z.string().optional().describe('A workspace social persona id'),
      template: z.string().optional().describe('Carousel/poster design template id'),
    },
  }, run(user, 'generate_social', (a) => ops.generateSocial(user, a.itemId, a)));

  return server;
}

// All verbs on one path, per the Streamable HTTP spec. Stateless: a fresh
// server + transport per request (express.json has already parsed the body).
router.all('/api/v1/mcp', async (req, res) => {
  try {
    const server = buildServer(req.user);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[mcp] Request handling failed:', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

module.exports = router;
