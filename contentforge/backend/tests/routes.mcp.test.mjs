// The MCP surface at /api/v1/mcp: real JSON-RPC over the stateless Streamable
// HTTP transport, with tools running the same lib/v1Operations.js functions as
// the REST surface. Real route + lib code over the in-memory fake.
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: {
      workspaces: [
        { id: 'ws1', name: 'Workspace One', destination: 'Markdown' },
        { id: 'ws-private', name: 'Private' },
      ],
    },
  },
});
const { initWorkspacesStore } = require('../lib/workspacesStore');
await initWorkspacesStore();
const mcpRouter = require('../routes/mcp');

function appAs(user) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(mcpRouter);
  return app;
}

const KEY_USER = {
  uid: 'apikey:k1', email: null, role: 'creator', workspaceAccess: ['ws1'],
  reviewerWorkspaces: [], apiKey: { id: 'k1', name: 'workbench' },
};

// One JSON-RPC call over the stateless transport (fresh server per request).
let rpcId = 0;
async function rpc(user, method, params) {
  const res = await request(appAs(user))
    .post('/api/v1/mcp')
    .set('Accept', 'application/json, text/event-stream')
    .send({ jsonrpc: '2.0', id: ++rpcId, method, ...(params ? { params } : {}) });
  return res;
}
const callTool = (user, name, args) => rpc(user, 'tools/call', { name, arguments: args });
// Tool results carry the operation's JSON as text content.
const toolJson = (res) => JSON.parse(res.body.result.content[0].text);

beforeEach(() => {
  store.content_pipeline_library = {};
  store.content_pipeline_jobs = {};
  store.content_pipeline_notifications = {};
});

describe('POST /api/v1/mcp', () => {
  it('answers initialize with server info', async () => {
    const res = await rpc(KEY_USER, 'initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'test', version: '0.0.0' },
    });
    expect(res.status).toBe(200);
    expect(res.body.result.serverInfo.name).toBe('contentforge');
  });

  it('lists the full toolbox with schemas', async () => {
    const res = await rpc(KEY_USER, 'tools/list');
    expect(res.status).toBe(200);
    const tools = res.body.result.tools;
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'finalize_item', 'generate_social', 'get_item', 'get_job', 'get_social',
      'import_article', 'list_comments', 'list_items', 'list_reviewers',
      'list_socials', 'list_workspaces', 'post_comment', 'publish_item',
      'submit_generation', 'submit_review',
    ]);
    const submit = tools.find((t) => t.name === 'submit_generation');
    expect(submit.inputSchema.required).toContain('workspaceId');
    expect(submit.inputSchema.required).toContain('sources');
    // No deletion tool exists — deletion is human-only by construction.
    expect(names.join(' ')).not.toMatch(/delete/);
  });

  it('runs tools as the authenticated credential, workspace scoping applied', async () => {
    const res = await callTool(KEY_USER, 'list_workspaces');
    expect(res.status).toBe(200);
    const { workspaces } = toolJson(res);
    expect(workspaces.map((w) => w.id)).toEqual(['ws1']); // ws-private is out of scope
  });

  it('runs a real verb end to end and maps V1Errors to tool errors', async () => {
    store.content_pipeline_library.d1 = { workspaceId: 'ws1', status: 'draft', draft: '# One' };

    const finalized = await callTool(KEY_USER, 'finalize_item', { itemId: 'd1', draft: '# One (edited)' });
    expect(finalized.body.result.isError).toBeFalsy();
    expect(toolJson(finalized).item.status).toBe('finalized');
    expect(store.content_pipeline_library.d1.draft).toBe('# One (edited)');

    // Publishing without the admin role fails as a tool error, not a crash.
    const denied = await callTool(KEY_USER, 'publish_item', { itemId: 'd1' });
    expect(denied.status).toBe(200);
    expect(denied.body.result.isError).toBe(true);
    expect(denied.body.result.content[0].text).toMatch(/forbidden.*Admin privileges/is);

    // Items outside the key's workspaces are invisible.
    store.content_pipeline_library.hidden = { workspaceId: 'ws-private', status: 'draft', draft: '# X' };
    const hidden = await callTool(KEY_USER, 'get_item', { itemId: 'hidden' });
    expect(hidden.body.result.isError).toBe(true);
    expect(hidden.body.result.content[0].text).toMatch(/forbidden/i);
  });

  it('normalizes legacy shapes through tools exactly like the REST surface', async () => {
    store.content_pipeline_library.legacy = {
      workspaceId: 'ws1', status: 'pending_approval', draft: '# Old\n\nText.',
      youtubeUrls: ['https://youtu.be/abc'], titles: ['Old Video'], transcript: 't',
      socials: { linkedin: { copy: { post: 'Nested legacy post', cta: 'Go' } } },
    };
    const items = toolJson(await callTool(KEY_USER, 'list_items', { workspaceId: 'ws1' }));
    expect(items.items[0].status).toBe('draft'); // pending_approval normalized
    expect(items.items[0].sources).toEqual([{ type: 'youtube', url: 'https://youtu.be/abc', title: 'Old Video' }]);

    const social = toolJson(await callTool(KEY_USER, 'get_social', { itemId: 'legacy', channel: 'linkedin' }));
    expect(social.social.post).toBe('Nested legacy post');
  });

  it('rejects bad tool arguments at the schema layer', async () => {
    const res = await callTool(KEY_USER, 'submit_generation', { workspaceId: 'ws1' }); // missing sources
    expect(res.status).toBe(200);
    // The SDK surfaces schema failures as tool errors before our code runs.
    expect(res.body.result?.isError ?? !!res.body.error).toBe(true);
  });
});
