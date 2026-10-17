// YouTube source resolver: oEmbed title + transcript via Supadata (YouTube
// blocks transcript scraping from datacenter IPs, so Supadata handles the
// proxying/anti-bot work and falls back to Whisper transcription when a video
// has no captions). Moved verbatim from routes/generate.js when the source
// registry was introduced; the legacy single-URL transcript cache is kept.
const axios = require('axios');

const SUPADATA_BASE_URL = 'https://api.supadata.ai/v1';

function normalizeTranscriptContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(chunk => chunk.text).join(' ');
  return '';
}

async function pollTranscriptJob(jobId, apiKey) {
  const maxAttempts = 30; // ~60s at 2s intervals
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const res = await axios.get(`${SUPADATA_BASE_URL}/transcript/${jobId}`, {
      headers: { 'x-api-key': apiKey },
      validateStatus: () => true,
    });
    const job = res.data || {};
    if (job.status === 'completed') {
      return normalizeTranscriptContent(job.content);
    }
    if (job.status === 'failed') {
      throw new Error(job.error?.message || 'Transcript job failed.');
    }
  }
  throw new Error('Transcript job timed out.');
}

async function fetchYoutubeTranscript(url) {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new Error('SUPADATA_API_KEY is not configured on the server.');
  }

  const res = await axios.get(`${SUPADATA_BASE_URL}/transcript`, {
    params: { url, text: true },
    headers: { 'x-api-key': apiKey },
    validateStatus: () => true,
  });
  const data = res.data || {};

  if (data.error) {
    throw new Error(data.message || data.details || data.error);
  }
  if (data.jobId) {
    return await pollTranscriptJob(data.jobId, apiKey);
  }
  if (data.content !== undefined && data.content !== null) {
    return normalizeTranscriptContent(data.content);
  }
  throw new Error(`Unexpected transcript service response (HTTP ${res.status}).`);
}

// oEmbed title lookup, shared by the resolver and the composer's live title
// check. Best-effort: returns null rather than throwing (private/region-locked
// videos still generate — with "Unknown Video" as the title).
async function fetchVideoTitle(url, deps = {}) {
  const http = deps.http || axios;
  try {
    const res = await http.get(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { timeout: 8000, validateStatus: () => true }
    );
    return (res.status === 200 && res.data && res.data.title) ? res.data.title : null;
  } catch {
    return null;
  }
}

// ctx: { db, stage, position } — db required (transcript cache lookup).
async function resolve({ url }, ctx) {
  const stage = ctx.stage || (() => {});
  const n = ctx.position || '';

  stage(`Fetching video title${n}...`);
  const fetched = await fetchVideoTitle(url, ctx.deps || {});
  const title = fetched || 'Unknown Video';
  if (fetched) stage(`Source${n}: "${title}"`);
  else stage(`Could not fetch title for video${n}; continuing.`, 'warn');

  // Legacy single-URL global cache: items created before multi-URL support
  // stored `youtubeUrl` + `transcript`; reuse their transcripts for free.
  const cached = await ctx.db.collection('content_pipeline_library')
    .where('youtubeUrl', '==', url)
    .limit(1)
    .get();
  if (!cached.empty) {
    stage(`Found cached transcript for video${n}.`, 'success');
    return { title, text: cached.docs[0].data().transcript || '' };
  }

  stage(`Extracting transcript for video${n}...`);
  const text = await fetchYoutubeTranscript(url);
  stage(`Transcript extracted (${text.length.toLocaleString('en-US')} characters).`, 'success');
  return { title, text };
}

module.exports = { resolve, fetchYoutubeTranscript, fetchVideoTitle };
