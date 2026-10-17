// The Source Vault: the org-wide ledger of reusable source material
// (transcripts, staged videos, channel uploads) and where each piece was used.
// Replaces the hand-maintained transcript_usage_log.md: entries carry their
// full text (compose without re-fetching) and a usedIn list that the
// generation pipeline appends to automatically.
//
// Collection: content_pipeline_vault/{id}
// {
//   title, group,               // "Storage 100 — Section 2: Market Analysis"
//   workspaceIds: [ids],        // which workspaces this source belongs to
//   type: 'youtube' | 'text',
//   videoId?, url?,             // youtube identity
//   textHash,                   // sha256 of text (identity for text entries)
//   text, chars,
//   origin: 'import' | 'staged' | 'channel-sync',
//   addedAt, addedBy?,
//   usedIn: [{ itemId?, workspaceId?, title, kind, date?, slug?, external? }]
// }
// Channel config + sync state live in content_pipeline_config/vault.
const crypto = require('crypto');
const axios = require('axios');
const { db, FieldValue } = require('./firebase');
// Module-object require (not destructured) so tests can stub the fetchers.
const yt = require('./sources/youtube');

const VAULT_COLLECTION = 'content_pipeline_vault';
const CONFIG_DOC = () => db.collection('content_pipeline_config').doc('vault');
const SYNC_STALE_MS = 7 * 24 * 60 * 60 * 1000; // auto-sync when older than a week
const MIN_VIDEO_SECONDS = 120;   // shorts and teasers are not source material
const MAX_INGESTS_PER_SYNC = 10; // bound each run; repeated syncs drain the backlog

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// --- Title matching (shared with scripts/import-source-vault.js) -----------
// "Day 085 - ..." files, "Day 85: ..." channel retitles, and "| Channel"
// suffixes must resolve to the same source. Series number equality is
// necessary but not sufficient (channel numbering drifts from the course
// files), so a body-token overlap is demanded on top.
const normalizeTitle = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const stripTitleNoise = (s) =>
  normalizeTitle(String(s).replace(/^(day|ep)\s*\d+\s*[-–:]\s*/i, '').replace(/\|[^|]*$/, ''));
const seriesKeyOf = (s) => {
  const m = String(s).match(/^\s*(day|ep)\s*0*(\d+)\b/i);
  return m ? `${m[1].toLowerCase()}${Number(m[2])}` : null;
};
function titleTokenOverlap(a, b) {
  const ta = new Set(stripTitleNoise(a).split(' ').filter(Boolean));
  const tb = new Set(stripTitleNoise(b).split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.min(ta.size, tb.size);
}
function titlesMatch(a, b) {
  const ka = seriesKeyOf(a);
  const kb = seriesKeyOf(b);
  if (ka && kb) return ka === kb && titleTokenOverlap(a, b) >= 0.5;
  const na = stripTitleNoise(a);
  const nb = stripTitleNoise(b);
  if (!na || !nb || na.length < 12 || nb.length < 12) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ca = na.replace(/ /g, '');
  const cb = nb.replace(/ /g, '');
  return ca.includes(cb) || cb.includes(ca);
}

// Normalize any YouTube URL to its video id (identity for dedup + used-checks).
function videoIdOf(url) {
  try {
    const u = new URL(url);
    if (/(^|\.)youtu\.be$/.test(u.hostname)) return u.pathname.split('/').filter(Boolean)[0] || null;
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const parts = u.pathname.split('/').filter(Boolean);
      if (['shorts', 'live', 'embed'].includes(parts[0]) && parts[1]) return parts[1];
    }
  } catch { /* not a url */ }
  return null;
}

// List one workspace's entries without their full text (the ledger view);
// text loads on demand. Filtered in memory: vault sizes are small and the
// in-memory filter keeps the fake-Firestore test seam simple.
async function listEntries(workspaceId) {
  const snap = await db.collection(VAULT_COLLECTION).get();
  const entries = [];
  snap.forEach((doc) => {
    const d = doc.data();
    if (!(d.workspaceIds || []).includes(workspaceId)) return;
    entries.push({
      id: doc.id,
      title: d.title,
      group: d.group || 'Ungrouped',
      type: d.type,
      url: d.url || null,
      videoId: d.videoId || null,
      chars: d.chars || 0,
      origin: d.origin || 'staged',
      addedAt: d.addedAt || null,
      usedIn: d.usedIn || [],
    });
  });
  entries.sort((a, b) => (a.group + a.title).localeCompare(b.group + b.title));
  return entries;
}

async function getEntry(id) {
  const snap = await db.collection(VAULT_COLLECTION).doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

// Find an entry by YouTube video id (used-URL warnings, sync dedup).
async function findByVideoId(videoId) {
  const snap = await db.collection(VAULT_COLLECTION).where('videoId', '==', videoId).limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function addEntry({ title, group, workspaceIds, type, url, videoId, text, origin, addedBy, usedIn }) {
  const doc = {
    title: title || 'Untitled source',
    group: group || 'Ungrouped',
    workspaceIds: workspaceIds || [],
    type: type || 'text',
    ...(url ? { url } : {}),
    ...(videoId ? { videoId } : {}),
    textHash: sha256(text || ''),
    text: text || '',
    chars: (text || '').length,
    origin: origin || 'staged',
    addedAt: FieldValue.serverTimestamp(),
    ...(addedBy ? { addedBy } : {}),
    usedIn: usedIn || [],
  };
  const ref = await db.collection(VAULT_COLLECTION).add(doc);
  return { id: ref.id, ...doc };
}

// Append usage records (read-modify-write keeps the fake-Firestore seam happy
// and volumes are tiny). Dedup by itemId so regenerations don't double-log.
async function recordUsage(vaultId, usage) {
  const entry = await getEntry(vaultId);
  if (!entry) return;
  const usedIn = entry.usedIn || [];
  if (usage.itemId && usedIn.some((u) => u.itemId === usage.itemId)) return;
  await db.collection(VAULT_COLLECTION).doc(vaultId).update({ usedIn: [...usedIn, usage] });
}

// Stage one YouTube URL into the vault (fetch title + transcript now, so
// composing later is instant). Returns the entry, or the existing one.
async function stageYoutubeUrl(url, { workspaceId, group, addedBy, user } = {}) {
  const videoId = videoIdOf(url);
  if (!videoId) throw new Error(`Not a recognizable YouTube URL: ${url}`);
  const existing = await findByVideoId(videoId);
  if (existing) {
    // Already in the vault: staging from another workspace just shares it
    // there (one transcript, one usage ledger, several workspaces).
    if (workspaceId && !(existing.workspaceIds || []).includes(workspaceId)) {
      await db.collection(VAULT_COLLECTION).doc(existing.id).update({
        workspaceIds: [...(existing.workspaceIds || []), workspaceId],
      });
      return { entry: existing, existed: true, shared: true };
    }
    return { entry: existing, existed: true };
  }
  const [title, text] = await Promise.all([yt.fetchVideoTitle(url), yt.fetchYoutubeTranscript(url)]);
  const entry = await addEntry({
    title: title || 'Unknown Video',
    group: group || 'Staged',
    workspaceIds: workspaceId ? [workspaceId] : [],
    type: 'youtube',
    url,
    videoId,
    text,
    origin: 'staged',
    addedBy,
  });
  await tryGistEntry(entry.id, entry.title, text, user, workspaceId);
  return { entry, existed: false };
}

// --- Gists -------------------------------------------------------------------
// A gist is a 2-3 sentence substance summary (+ topic tags) distilled by Odin
// at ingest time. It replaces the dumb first-N-chars excerpt in the scouting
// digest: transcripts open with greetings, so raw excerpts carry no signal.
// Best-effort everywhere — an entry without a gist just falls back.
async function tryGistEntry(entryId, title, text, user, workspaceId) {
  if (process.env.VITEST) return; // network call; tests exercise gisting on the Odin side
  try {
    const { odinRequestHeaders } = require('./odinClient');
    const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
    const res = await axios.post(`${odinApiUrl}/api/v1/vault/gist`, {
      entries: [{ id: entryId, title, text: (text || '').slice(0, 5000) }],
    }, { headers: await odinRequestHeaders(odinApiUrl, user, workspaceId ? { workspaceId } : {}), timeout: 60_000 });
    const gist = (res.data?.gists || []).find((g) => g.id === entryId);
    if (gist) {
      await db.collection(VAULT_COLLECTION).doc(entryId).update({ gist: gist.gist, topics: gist.topics || [] });
    }
  } catch (err) {
    console.warn(`Vault gist skipped for ${entryId}: ${err.message}`);
  }
}

// --- Channel sync -----------------------------------------------------------

async function vaultConfig() {
  const snap = await CONFIG_DOC().get();
  return snap.exists ? snap.data() : {};
}

async function setChannels(channels) {
  await CONFIG_DOC().set({ channels }, { merge: true });
}

function syncIsStale(config) {
  const last = config.lastSyncAt;
  const ms = last?.toDate ? last.toDate().getTime() : (last?._seconds ? last._seconds * 1000 : 0);
  return Date.now() - ms > SYNC_STALE_MS;
}

// Pull new uploads from every watched channel into the vault as unused
// entries. Supadata lists the channel's video ids (no extra credential);
// transcripts are fetched per new video. deps injectable for tests: { http }.
// One video's metadata (title + duration in seconds) — used to skip shorts
// before paying for a transcript. Fail-open: null keeps the video eligible.
async function fetchVideoMeta(videoId, apiKey, http) {
  try {
    const res = await http.get('https://api.supadata.ai/v1/youtube/video', {
      params: { id: videoId },
      headers: { 'x-api-key': apiKey },
      validateStatus: () => true,
      timeout: 15_000,
    });
    return res.status === 200 ? res.data : null;
  } catch {
    return null;
  }
}

// New uploads have no course-section map (channel day numbering drifts from
// the corpus files), but titles that carry a series name ("Boat & RV 100",
// "Storage 100") get a per-series group under the channel — everything else
// files under the channel label.
function groupForVideo(channelLabel, title) {
  // Series follow the "<Name> 100" convention (Storage 100, Boat & RV 100);
  // "Day 100"/"EP 100" are episode numbers, not series names.
  const m = String(title || '').match(/\b([A-Za-z][A-Za-z&'. ]{1,30}?\s+100)\b/);
  const series = m && !/^(day|ep|episode)\b/i.test(m[1]) ? m[1].trim() : null;
  return series ? `${channelLabel} — ${series}` : channelLabel;
}

async function syncChannels({ addedBy, user, deps = {} } = {}) {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error('SUPADATA_API_KEY is not configured on the server.');
  const http = deps.http || axios;
  const config = await vaultConfig();
  const channels = config.channels || [];
  const report = { channels: channels.length, added: [], failed: [], skippedExisting: 0, matchedExisting: 0, skippedShorts: 0, remaining: 0 };
  let ingests = 0;

  for (const channel of channels) {
    const res = await http.get('https://api.supadata.ai/v1/youtube/channel/videos', {
      params: { id: channel.id, limit: 50, type: 'video' },
      headers: { 'x-api-key': apiKey },
      validateStatus: () => true,
      timeout: 30_000,
    });
    if (res.status !== 200) {
      report.failed.push({ channel: channel.label || channel.id, error: `Channel listing failed (HTTP ${res.status}).` });
      continue;
    }
    const videoIds = res.data?.videoIds || [];
    for (const videoId of videoIds) {
      const existing = await findByVideoId(videoId);
      if (existing) {
        // Share into the channel's workspace if it isn't there yet.
        if (channel.workspaceId && !(existing.workspaceIds || []).includes(channel.workspaceId)) {
          await db.collection(VAULT_COLLECTION).doc(existing.id).update({
            workspaceIds: [...(existing.workspaceIds || []), channel.workspaceId],
          });
        }
        report.skippedExisting++;
        continue;
      }
      // Bound the expensive part of each run: transcripts are fetched for at
      // most MAX_INGESTS_PER_SYNC new videos; the rest are reported as
      // remaining and picked up by the next sync (button or auto).
      if (ingests >= MAX_INGESTS_PER_SYNC) { report.remaining++; continue; }
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      try {
        // Metadata first: duration filters shorts/teasers before any
        // transcript spend, and the title powers the retitled-upload check.
        const meta = await fetchVideoMeta(videoId, apiKey, http);
        if (meta && typeof meta.duration === 'number' && meta.duration < MIN_VIDEO_SECONDS) {
          report.skippedShorts++;
          continue;
        }
        const title = meta?.title || await yt.fetchVideoTitle(url, deps);
        // If this video is a retitled upload of something already vaulted
        // (e.g. a corpus transcript), attach the video identity to the
        // existing entry instead of duplicating it — no transcript fetch.
        if (title) {
          const allSnap = await db.collection(VAULT_COLLECTION).get();
          let similar = null;
          allSnap.forEach((d) => { if (!similar && titlesMatch(d.data().title, title)) similar = { id: d.id, ...d.data() }; });
          if (similar) {
            const update = {};
            if (!similar.videoId) { update.videoId = videoId; update.url = url; }
            if (channel.workspaceId && !(similar.workspaceIds || []).includes(channel.workspaceId)) {
              update.workspaceIds = [...(similar.workspaceIds || []), channel.workspaceId];
            }
            if (Object.keys(update).length) await db.collection(VAULT_COLLECTION).doc(similar.id).update(update);
            report.matchedExisting++;
            continue;
          }
        }
        const text = await yt.fetchYoutubeTranscript(url);
        ingests++;
        const created = await addEntry({
          title: title || 'Unknown Video',
          group: groupForVideo(channel.label || channel.id, title),
          workspaceIds: channel.workspaceId ? [channel.workspaceId] : [],
          type: 'youtube',
          url,
          videoId,
          text,
          origin: 'channel-sync',
          addedBy,
        });
        await tryGistEntry(created.id, created.title, text, user, channel.workspaceId);
        report.added.push({ channel: channel.label || channel.id, title: title || videoId });
      } catch (err) {
        report.failed.push({ channel: channel.label || channel.id, video: videoId, error: err.message });
      }
    }
  }

  await CONFIG_DOC().set({ lastSyncAt: FieldValue.serverTimestamp() }, { merge: true });
  return report;
}

// The scout digest Mimir converses over: this workspace's entries with
// titles, groups, per-workspace usage states, and short excerpts — never the
// full transcripts (the whole vault would drown the context window).
const EXCERPT_CHARS = 400;

async function scoutDigest(workspaceId) {
  const snap = await db.collection(VAULT_COLLECTION).get();
  const digest = [];
  snap.forEach((doc) => {
    const e = doc.data();
    if (!(e.workspaceIds || []).includes(workspaceId)) return;
    const label = (u) => `\u201c${u.title}\u201d${u.kind ? ` (${u.kind}${u.date ? `, ${u.date}` : ''})` : ''}`;
    const usedHere = (e.usedIn || []).filter((u) => u.workspaceId === workspaceId).map(label);
    const usedElsewhere = (e.usedIn || []).filter((u) => u.workspaceId && u.workspaceId !== workspaceId).map(label);
    digest.push({
      id: doc.id,
      title: e.title,
      group: e.group || 'Ungrouped',
      chars: e.chars || 0,
      excerpt: e.gist
        ? `${e.gist}${(e.topics || []).length ? ` [topics: ${(e.topics || []).join(', ')}]` : ''}`
        : ((e.text || '').slice(600, 600 + EXCERPT_CHARS) || (e.text || '').slice(0, EXCERPT_CHARS)),
      ...(usedHere.length ? { usedHere } : {}),
      ...(usedElsewhere.length ? { usedElsewhere } : {}),
    });
  });
  digest.sort((a, b) => (a.group + a.title).localeCompare(b.group + b.title));
  return digest;
}

module.exports = {
  VAULT_COLLECTION,
  videoIdOf,
  sha256,
  titlesMatch,
  listEntries,
  getEntry,
  findByVideoId,
  addEntry,
  recordUsage,
  stageYoutubeUrl,
  vaultConfig,
  setChannels,
  syncIsStale,
  syncChannels,
  scoutDigest,
  tryGistEntry,
};
