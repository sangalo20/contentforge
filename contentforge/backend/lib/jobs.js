// Async pipeline jobs for the /api/v1 machine-facing surface. A generation is
// long (Odin can take minutes), so v1 submits return a job id immediately and
// the caller polls GET /api/v1/jobs/:id. Jobs are Firestore documents
// (content_pipeline_jobs) executed in-process: the deployment must keep CPU
// allocated while a job runs (see docs/configuration.md).
const { db, FieldValue, JOBS_COLLECTION } = require('./firebase');
const { runGenerationPipeline } = require('./generationPipeline');
const { SourceError } = require('./sources');
const { log: logger } = require('../logger');

// Generations are expensive (multi-minute Odin calls); cap how many this
// instance runs at once. Submits beyond the cap are rejected with a retryable
// error rather than queued, so a stuck client can't pile up silent work.
const MAX_ACTIVE_JOBS = Number(process.env.V1_MAX_ACTIVE_JOBS || 3);
let activeJobs = 0;

class JobsBusyError extends Error {
  constructor() {
    super(`Too many generations are already running (limit ${MAX_ACTIVE_JOBS}). Retry when one finishes.`);
  }
}

// Create and start a generation job for an already-validated request.
// Returns { id, status: 'queued' } as soon as the job document exists.
async function createGenerationJob({ user, workspace, inputs, brief }) {
  if (activeJobs >= MAX_ACTIVE_JOBS) throw new JobsBusyError();

  const ref = await db.collection(JOBS_COLLECTION).add({
    type: 'generation',
    workspaceId: workspace.id,
    requestedBy: user.uid,
    apiKeyId: user.apiKey?.id || null,
    status: 'queued',
    stages: [],
    request: { sources: inputs, ...(brief ? { brief } : {}) },
    result: null,
    error: null,
    createdAt: FieldValue.serverTimestamp(),
    startedAt: null,
    finishedAt: null,
  });

  activeJobs++;
  setImmediate(() => {
    executeGenerationJob(ref, { user, workspace, inputs, brief })
      .catch((err) => console.error(`[v1 jobs] Job ${ref.id} executor crashed:`, err))
      .finally(() => { activeJobs--; });
  });

  return { id: ref.id, status: 'queued' };
}

async function executeGenerationJob(ref, { user, workspace, inputs, brief }) {
  // Stage writes are chained so they land in order; each failure is swallowed
  // (a progress write must never kill the pipeline).
  const stages = [];
  let writeChain = Promise.resolve();
  const onStage = (message, level) => {
    stages.push({ at: Date.now(), level, message });
    const snapshot = [...stages];
    writeChain = writeChain
      .then(() => ref.update({ stages: snapshot }))
      .catch((err) => console.error(`[v1 jobs] Failed to record stage on ${ref.id}:`, err.message));
  };

  await ref.update({ status: 'running', startedAt: FieldValue.serverTimestamp() });
  logger.event('v1.job.started', { jobId: ref.id, workspaceId: workspace.id, requestedBy: user.uid });

  try {
    const result = await runGenerationPipeline({ user, workspace, inputs, brief, onStage });
    await writeChain;
    await ref.update({
      status: 'succeeded',
      result: { itemId: result.itemId, existing: result.existing },
      finishedAt: FieldValue.serverTimestamp(),
    });
    logger.event('v1.job.succeeded', { jobId: ref.id, workspaceId: workspace.id, itemId: result.itemId, existing: result.existing });
  } catch (error) {
    await writeChain;
    await ref.update({
      status: 'failed',
      error: error.message || 'The content pipeline failed.',
      // source errors are the caller's to fix (bad URL, over budget);
      // internal errors are ours.
      errorKind: error instanceof SourceError ? 'source' : 'internal',
      finishedAt: FieldValue.serverTimestamp(),
    });
    logger.event('v1.job.failed', { jobId: ref.id, workspaceId: workspace.id, error: error.message });
  }
}

module.exports = { createGenerationJob, JobsBusyError, MAX_ACTIVE_JOBS };
