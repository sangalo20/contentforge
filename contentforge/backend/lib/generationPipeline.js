// The unified generation pipeline, extracted from routes/generate.js so every
// caller shape shares ONE implementation: the SSE route renders stages as
// events, the blocking route ignores them, and the /api/v1 job executor
// appends them to the job document. Sources -> resolved text -> Odin (Oscar
// writes, Heimdall reviews) -> library draft.
const axios = require('axios');
const { db, FieldValue } = require('./firebase');
const { odinRequestHeaders } = require('./odinClient');
const { sanityConnectionFor, articleUrlFor } = require('./sanityConnections');
const athena = require('./athena');
const { createNotification } = require('./notifications');
const {
  normalizeSourceInputs,
  resolveSources,
  composeSourceText,
  sourceSignature,
  SourceError,
} = require('./sources');
const { getGithubToken } = require('./integrations');
const { getWorkspaces } = require('./workspacesStore');
const { canAccessWorkspace } = require('./authz');
const { recordUsage } = require('./vault');
const { log: logger } = require('../logger');

// A validation/authorization failure the caller maps to an HTTP status (the
// message is user-safe, like SourceError).
class GenerationRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Shared request validation for every entry point: source parsing (new shape +
// legacy youtubeUrls alias), workspace access, existence, and archived state.
// Returns { workspace, inputs, brief } or throws GenerationRequestError.
function validateGenerationRequest(user, body = {}) {
  const { workspaceId } = body;
  const parsed = normalizeSourceInputs(body);
  if (parsed.error || !workspaceId) {
    throw new GenerationRequestError(400, parsed.error || 'workspaceId is required');
  }
  if (!canAccessWorkspace(user, workspaceId)) {
    throw new GenerationRequestError(403, 'You do not have access to this workspace');
  }
  const workspace = getWorkspaces().find((w) => w.id === workspaceId);
  if (!workspace) {
    throw new GenerationRequestError(404, 'Workspace not found');
  }
  if (workspace.archived || workspace.deletedAt) {
    throw new GenerationRequestError(403, 'This workspace is archived. Reopen it in Config to generate new content.');
  }
  return { workspace, inputs: parsed.inputs, brief: normalizeBrief(body.brief) };
}

// The scout's editorial direction, when a proposal was accepted: a working
// title + angle that steer Oscar. Optional, length-capped, strings only.
function normalizeBrief(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const angle = String(raw.angle || '').trim().slice(0, 300);
  const workingTitle = String(raw.workingTitle || '').trim().slice(0, 300);
  if (!angle && !workingTitle) return null;
  return { ...(angle ? { angle } : {}), ...(workingTitle ? { workingTitle } : {}) };
}

// Exact-duplicate detection across the workspace: new items carry a
// sourceSignature; legacy items are matched by their sorted youtubeUrls when
// the incoming stack is all-YouTube (the only shape legacy items can have).
function findExistingItem(docs, inputs) {
  const sig = sourceSignature(inputs);
  const allYoutube = inputs.every((s) => s.type === 'youtube');
  const urls = allYoutube ? JSON.stringify(inputs.map((s) => s.url).sort()) : null;
  return docs.find((doc) => {
    const data = doc.data();
    if (data.sourceSignature) return data.sourceSignature === sig;
    if (!urls) return false;
    const existing = data.youtubeUrls || (data.youtubeUrl ? [data.youtubeUrl] : []);
    return existing.length > 0 && JSON.stringify([...existing].sort()) === urls;
  });
}

// The library-item fields shared by every entry point. Legacy fields
// (youtubeUrls/titles/transcript) are still written so every existing reader
// keeps working until the TECH_DEBT #1 migration retires them.
function itemFieldsFor(workspaceId, inputs, sources, combinedText, brief) {
  return {
    workspaceId,
    sources,
    ...(brief ? { brief } : {}),
    sourceSignature: sourceSignature(inputs),
    youtubeUrls: sources.filter((s) => s.type === 'youtube').map((s) => s.url),
    titles: sources.map((s) => s.title),
    transcript: combinedText,
  };
}

// After an item is saved, append usage records to every vault entry that fed
// it — the automatic version of "move the row to the Used table". Best-effort:
// the ledger must never break the pipeline.
async function recordVaultUsage(sources, itemId, workspaceId, draft) {
  const fed = sources.filter((s) => s.vaultId);
  if (!fed.length) return;
  const title = draftTitleOf(draft) || 'Untitled draft';
  const date = new Date().toISOString().slice(0, 10);
  await Promise.all(fed.map((s) =>
    recordUsage(s.vaultId, { itemId, workspaceId, title, kind: 'article', date }).catch(() => {})
  ));
}

const draftTitleOf = (draft) =>
  draft?.match(/^(?:#+)\s+(.+?)(?:\n|$)/m)?.[1]?.replace(/(\*\*|\*)/g, '').trim() || null;

// Notifications identify a person's bell; machine callers (API keys) have no
// bell to ring, so their pipeline runs skip notifications entirely.
const notify = (user, payload) =>
  user.apiKey ? Promise.resolve() : createNotification(user.uid, payload).catch(() => {});

const ODIN_STAGE_MESSAGES = {
  oscar_start: ['Odin → Oscar: writing the draft...', 'info'],
  oscar_done: ['Oscar → Odin: draft delivered.', 'success'],
  huginn_start: ['Odin → Huginn: researching citations and related articles...', 'info'],
  huginn_done: ['Huginn → Odin: verified links woven in.', 'success'],
  huginn_none: ['Huginn → Odin: nothing worth linking this time.', 'info'],
  huginn_skipped: ['Citation research was skipped; keeping the draft as-is.', 'warn'],
  heimdall_start: ['Odin → Heimdall: reviewing accuracy, tone and polish...', 'info'],
  heimdall_done: ['Heimdall → Odin: draft approved.', 'success'],
  heimdall_skipped: ['The quality review was skipped; keeping the draft as-is.', 'warn'],
};

// Call Odin's streaming campaign endpoint, mapping its NDJSON stage events to
// the caller's stage callback; fall back to the blocking endpoint when the
// deployed Odin predates the streaming route (404).
async function runOdinCampaign(odinApiUrl, payload, headers, stage) {
  try {
    const streamResponse = await axios.post(
      `${odinApiUrl}/api/v1/tasks/generate-campaign/stream`,
      payload,
      { headers, responseType: 'stream', timeout: 540000 }
    );

    return await new Promise((resolve, reject) => {
      let buffer = '';
      let finalResult = null;
      const handleLine = (line) => {
        if (!line.trim()) return;
        let event;
        try { event = JSON.parse(line); } catch { return; }
        if (event.type === 'stage' && ODIN_STAGE_MESSAGES[event.event]) {
          const [message, level] = ODIN_STAGE_MESSAGES[event.event];
          stage(message, level);
        } else if (event.type === 'result') {
          finalResult = event.data;
        } else if (event.type === 'error') {
          reject(new Error(event.detail || 'Odin returned an error'));
        }
      };
      streamResponse.data.on('data', (chunk) => {
        buffer += chunk.toString();
        let idx;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          handleLine(buffer.slice(0, idx));
          buffer = buffer.slice(idx + 1);
        }
      });
      streamResponse.data.on('end', () => {
        if (buffer.trim()) handleLine(buffer);
        if (finalResult) resolve(finalResult);
        else reject(new Error('Odin stream ended without a result.'));
      });
      streamResponse.data.on('error', reject);
    });
  } catch (streamErr) {
    // 404 means the deployed Odin predates the streaming route — fall back.
    if (!streamErr.response || streamErr.response.status !== 404) throw streamErr;
    console.warn('[Pipeline] Odin streaming route unavailable; falling back to blocking call.');
    const response = await axios.post(
      `${odinApiUrl}/api/v1/tasks/generate-campaign`,
      payload,
      { headers, timeout: 540000 }
    );
    if (!response.data || response.data.status !== 'success') {
      throw new Error(response.data?.detail || 'Odin returned an error');
    }
    stage('Oscar → Odin: draft delivered.', 'success');
    if (response.data.data.qaReport) {
      stage('Heimdall → Odin: draft reviewed and polished.', 'success');
    }
    return response.data.data;
  }
}

// Run the full pipeline for an already-validated request. `onStage` receives
// (message, level) for every user-visible step; every stage is also a
// structured log line so a generation can be replayed from Logs Explorer.
// Returns { existing: true, itemId } when the exact source combination was
// already generated, else { existing: false, itemId, draft, imagePrompt,
// qaReport }. Throws SourceError for user-fixable source failures.
async function runGenerationPipeline({ user, workspace, inputs, brief, onStage }) {
  const workspaceId = workspace.id;
  const pipelineStartedAt = Date.now();
  const stage = (message, level = 'info') => {
    if (onStage) onStage(message, level);
    logger.event('pipeline.stage', {
      message,
      level,
      workspaceId,
      elapsedMs: Date.now() - pipelineStartedAt,
    });
  };

  try {
    stage(`Starting pipeline for "${workspace.name}".`);

    // 1. Exact duplicate check for the current workspace.
    stage('Checking library for an existing draft from these sources...');
    const existingQuery = await db.collection('content_pipeline_library')
      .where('workspaceId', '==', workspaceId)
      .get();

    const exactMatch = findExistingItem(existingQuery.docs, inputs);
    if (exactMatch) {
      stage('This exact combination already exists in your library.', 'success');
      return { existing: true, itemId: exactMatch.id };
    }

    // 2. Resolve every source (transcripts, article extraction, passthrough)
    // and enforce the context budget. GitHub sources ingest as the generating
    // user (their personal token; API keys have none -> public repos only).
    let sources;
    try {
      const token = inputs.some((s) => s.type === 'github') ? await getGithubToken(user.uid) : null;
      sources = await resolveSources(inputs, { db, stage, deps: { token } });
    } catch (err) {
      if (err instanceof SourceError) {
        await notify(user, {
          type: 'error',
          title: 'Source fetch failed',
          message: err.message,
          workspaceId,
        });
      }
      throw err;
    }
    const combinedTranscript = composeSourceText(sources);

    // 3. Build the persona / system prompt.
    stage(`Applying the "${workspace.name}" AI persona...`);
    let finalSystemPrompt = workspace.wordCount
      ? `${workspace.systemPrompt}\n\nTARGET WORD COUNT: Exactly ${workspace.wordCount} words.`
      : workspace.systemPrompt;

    if (workspace.id === 'the-moguls-medium-blogs') {
      finalSystemPrompt += `\n\nIMPORTANT:
1. You MUST use Markdown headings (## Heading 2, ### Heading 3) to structure the blog post properly.
2. The very first line of your response MUST be an H1 Markdown heading (# Blog Title) representing a catchy, article-appropriate headline.
3. At the very end of your response, you MUST include a line formatted exactly like this:\nCategories: [Category 1], [Category 2], [Category 3]\nChoose exactly 3 relevant categories from this list: Boat & RV Storage, Market Analysis, Investing, Operations, Growth, Beginner, Revenue, Tenant Management, Underwriting, Acquisitions.`;
    }

    // 4. Generate the draft via the Odin Agent, with internal-link candidates
    // for Huginn: this workspace's published articles that have a public URL
    // (the connection needs a confirmed articleUrlPattern; otherwise internal
    // linking simply skips).
    stage(`Generating content with ${workspace.aiProvider || 'AI'} (${workspace.aiModel || 'default model'})...`);
    const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
    const connection = sanityConnectionFor(workspace, workspaceId);
    const internalLinks = existingQuery.docs
      .map((doc) => doc.data())
      .filter((d) => d.status === 'published')
      .map((d) => {
        const title = draftTitleOf(d.draft);
        return { title, url: articleUrlFor(connection, title) };
      })
      .filter((l) => l.title && l.url)
      .slice(0, 30);

    const campaignPayload = {
      transcript: combinedTranscript,
      systemPrompt: finalSystemPrompt,
      description: workspace.description || '',
      wordCount: workspace.wordCount || '',
      aiProvider: workspace.aiProvider || '',
      aiModel: workspace.aiModel || '',
      sourceCount: sources.length,
      sourceTypes: sources.map((s) => s.type),
      ...(brief ? { brief } : {}),
      ...(internalLinks.length ? { internalLinks } : {})
    };
    const odinHeaders = await odinRequestHeaders(odinApiUrl, user, { workspaceId });
    const campaignResult = await runOdinCampaign(odinApiUrl, campaignPayload, odinHeaders, stage);

    const generatedDraft = campaignResult.draft || '';
    const imagePrompt = campaignResult.imagePrompt || '';
    const qaReport = campaignResult.qaReport || null;
    const genUsage = campaignResult.usage || null;

    // 5. Save to the Firestore library.
    stage(`Saving draft to library for ${workspace.destination}...`);
    const docRef = await db.collection('content_pipeline_library').add({
      ...itemFieldsFor(workspaceId, inputs, sources, combinedTranscript, brief),
      draft: generatedDraft,
      imagePrompt: imagePrompt,
      qaReport: qaReport || null,
      genUsage: genUsage || null,
      status: 'draft',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    await recordVaultUsage(sources, docRef.id, workspaceId, generatedDraft);

    // Typed memory: the pipeline's output becomes an action event, so future
    // scouting sessions can recall what was made, from what, and when.
    const draftTitle = draftTitleOf(generatedDraft);
    athena.storeEvent(workspaceId, user.uid, {
      type: 'action',
      content: `Generated article "${draftTitle || 'untitled'}" from ${sources.length} source(s): ${sources.map((s) => s.title || s.type).join('; ').slice(0, 300)}`,
      metadata: { itemId: docRef.id },
      payloadText: generatedDraft,
      mimeType: 'text/markdown',
    });
    // ...and the deliberate judgments become thought events: the accepted
    // editorial angle (the scout's reasoning, ratified by the operator) and
    // Heimdall's critique (recurring findings are learnable preferences).
    if (brief?.angle || brief?.workingTitle) {
      athena.storeEvent(workspaceId, user.uid, {
        type: 'thought',
        content: `Editorial direction chosen for "${draftTitle || brief.workingTitle || 'untitled'}": angle — ${brief.angle || 'n/a'}; working title — ${brief.workingTitle || 'n/a'}`,
        metadata: { itemId: docRef.id, source: 'scout-brief' },
      });
    }
    if (qaReport && !/^no changes needed\.?$/i.test(qaReport.trim())) {
      athena.storeEvent(workspaceId, user.uid, {
        type: 'thought',
        content: `Quality review of "${draftTitle || 'untitled'}" found: ${qaReport.trim().slice(0, 1800)}`,
        metadata: { itemId: docRef.id, source: 'heimdall-qa' },
        ...(qaReport.length > 1800 ? { payloadText: qaReport, mimeType: 'text/markdown' } : {}),
      });
    }

    logger.event('generation.completed', {
      workspaceId,
      itemId: docRef.id,
      sources: sources.length,
      sourceTypes: sources.map((s) => s.type),
      draftChars: generatedDraft.length,
      heimdallReviewed: !!qaReport,
      totalMs: Date.now() - pipelineStartedAt,
    });
    await notify(user, {
      type: 'success',
      title: 'Content generated',
      message: `Your draft for "${workspace.name}" is ready to review.`,
      workspaceId,
      link: `/workspace/${workspaceId}/library/item/${docRef.id}`,
    });

    return { existing: false, itemId: docRef.id, draft: generatedDraft, imagePrompt, qaReport };
  } catch (error) {
    if (!(error instanceof SourceError)) {
      await notify(user, {
        type: 'error',
        title: 'Generation failed',
        message: error.message || 'The content pipeline failed.',
        workspaceId,
      });
    }
    throw error;
  }
}

module.exports = {
  GenerationRequestError,
  validateGenerationRequest,
  runGenerationPipeline,
  draftTitleOf,
};
