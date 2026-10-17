// One-time import of the legacy content-pipeline transcript corpus into the
// Source Vault, preserving history:
//
//   1. Transcript files -> vault entries (Storage 100 grouped by course
//      section, Successful Idiots episodes as their own group).
//   2. transcript_usage_log.md's Used table -> external usage records on the
//      matching entries (title, kind, issue, date, slug — the pre-ContentForge
//      content that consumed each transcript).
//   3. Existing ContentForge library items -> usage records, matched by
//      normalized title overlap between the item's source titles and vault
//      entry titles (the dry run prints every proposed match — eyeball them).
//   4. ContentForge-only sources (YouTube videos generated from in the app
//      that are NOT part of the corpus) -> their own vault entries, marked
//      used by their item, with the stored per-source text where available.
//
// Usage:
//   node scripts/import-source-vault.js                 # DRY RUN (default)
//   node scripts/import-source-vault.js --apply         # write to Firestore
//   node scripts/import-source-vault.js --dir /path     # corpus root override
//   node scripts/import-source-vault.js --workspaces a,b  # assign entries to
//     these workspace ids (default: every active workspace — the corpus
//     historically fed all the storage properties)
//
// Idempotent: entries that already exist (same title) are skipped; usage
// records dedup by content title. The corpus directory is never modified.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db, FieldValue } = require('../lib/firebase');
const { VAULT_COLLECTION, sha256, videoIdOf, titlesMatch } = require('../lib/vault');

const DEFAULT_DIR = '/Users/sangalo/Development/belrose/content-pipeline/transcripts';

// Storage 100 course sections by day number (from the usage log's own grouping).
const SECTIONS = [
  [1, 15, 'Section 1: Foundations & Why Self Storage'],
  [16, 34, 'Section 2: Market Analysis'],
  [35, 48, 'Section 3: Sourcing & Deal Making'],
  [49, 62, 'Section 4: Underwriting & Financials'],
  [63, 76, 'Section 5: Financing'],
  [77, 90, 'Section 6: Transitioning & Managing'],
  [91, 104, 'Section 7: Tenants & Revenue'],
  [105, 106, 'Section 8: Finale'],
];

function groupOfDay(day) {
  const s = SECTIONS.find(([lo, hi]) => day >= lo && day <= hi);
  return `Storage 100 — ${s ? s[2] : 'Ungrouped'}`;
}

const titleOfFile = (filename) => filename.replace(/\.(txt|md)$/i, '');
const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Parse the Used Transcripts markdown table into { transcriptTitle -> [usage] }.
function parseUsageLog(md) {
  const usage = new Map();
  for (const line of md.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    // | Transcript | Content Title | Type | Issue # | Date Published | Slug |
    if (cells.length < 7 || !cells[1] || cells[1] === 'Transcript' || cells[1].startsWith(':---') || cells[1].startsWith('---')) continue;
    const [, transcript, contentTitle, type, issue, date, slug] = cells;
    if (!contentTitle || !type) continue;
    const record = {
      title: contentTitle,
      kind: type,
      ...(issue && issue !== '—' ? { issue } : {}),
      ...(date ? { date } : {}),
      ...(slug ? { slug: slug.replace(/`/g, '') } : {}),
      external: true,
    };
    if (!usage.has(transcript)) usage.set(transcript, []);
    usage.get(transcript).push(record);
  }
  return usage;
}

// Collect corpus files: [{ title, group, file }].
function collectCorpus(root) {
  const out = [];
  const s100 = path.join(root, 'Storage 100 Transcripts');
  if (fs.existsSync(s100)) {
    for (const f of fs.readdirSync(s100).filter((f) => /\.(txt|md)$/i.test(f))) {
      const title = titleOfFile(f);
      const day = Number(title.match(/^Day\s+0*(\d+)/i)?.[1] || 0);
      out.push({ title, group: day ? groupOfDay(day) : 'Storage 100 — Ungrouped', file: path.join(s100, f) });
    }
  }
  const idiots = path.join(root, 'idiots-transcripts');
  if (fs.existsSync(idiots)) {
    for (const f of fs.readdirSync(idiots).filter((f) => /\.(txt|md)$/i.test(f))) {
      out.push({ title: titleOfFile(f), group: 'Successful Idiots', file: path.join(idiots, f) });
    }
  }
  return out;
}

// Loose title match between an item's source title and a vault title:
// strip course prefixes ("Day 009 - ", "EP05 - ") and channel suffixes
// ("... | Storage 100") first, then normalized containment either way.
const stripNoise = (s) =>
  normalize(String(s).replace(/^(day|ep)\s*\d+\s*[-–:]\s*/i, '').replace(/\|[^|]*$/, ''));

async function main() {
  const apply = process.argv.includes('--apply');
  const dirFlag = process.argv.indexOf('--dir');
  const root = dirFlag !== -1 ? process.argv[dirFlag + 1] : DEFAULT_DIR;

  // Workspace assignment: explicit --workspaces, else every active workspace.
  const wsFlag = process.argv.indexOf('--workspaces');
  let workspaceIds;
  if (wsFlag !== -1) {
    workspaceIds = process.argv[wsFlag + 1].split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    const wsDoc = await db.collection('content_pipeline_config').doc('workspaces').get();
    workspaceIds = ((wsDoc.exists && wsDoc.data().workspaces) || [])
      .filter((w) => !w.deletedAt)
      .map((w) => w.id);
  }
  console.log(`Assigning imported entries to workspaces: ${workspaceIds.join(', ') || '(none!)'}\n`);

  const corpus = collectCorpus(root);
  if (!corpus.length) {
    console.error(`No transcript files found under ${root}`);
    process.exit(1);
  }
  const logPath = path.join(root, 'transcript_usage_log.md');
  const usageByTranscript = fs.existsSync(logPath) ? parseUsageLog(fs.readFileSync(logPath, 'utf8')) : new Map();

  // Existing vault titles + video ids (idempotency).
  const vaultSnap = await db.collection(VAULT_COLLECTION).get();
  const existingTitles = new Set();
  const existingVideoIds = new Set();
  vaultSnap.forEach((d) => {
    existingTitles.add(d.data().title);
    if (d.data().videoId) existingVideoIds.add(d.data().videoId);
  });

  // Existing library items for the ContentForge backfill.
  const librarySnap = await db.collection('content_pipeline_library').get();
  const items = [];
  librarySnap.forEach((d) => {
    const data = d.data();
    const sourceTitles = (data.sources || []).map((s) => s.title).concat(data.titles || []);
    const articleTitle = data.draft?.match(/^(?:#+)\s+(.+?)(?:\n|$)/m)?.[1]?.replace(/(\*\*|\*)/g, '').trim() || data.title || 'Untitled';
    // The item's YouTube sources, normalized across generations: new items
    // carry sources[] (per-source text); legacy items carry youtubeUrls (+
    // the combined transcript, attributable only when single-video).
    let videoSources;
    if (Array.isArray(data.sources) && data.sources.length) {
      videoSources = data.sources
        .filter((s) => s.type === 'youtube' && s.url)
        .map((s) => ({ url: s.url, title: s.title || 'Unknown Video', text: s.text || '' }));
    } else {
      const urls = data.youtubeUrls || (data.youtubeUrl ? [data.youtubeUrl] : []);
      videoSources = urls.map((url, i) => ({
        url,
        title: (data.titles && data.titles[i]) || 'Unknown Video',
        text: urls.length === 1 ? (data.transcript || '') : '',
      }));
    }
    items.push({ id: d.id, workspaceId: data.workspaceId || null, sourceTitles, articleTitle, videoSources });
  });

  let toCreate = 0;
  let usedFromLog = 0;
  let usedFromLibrary = 0;

  for (const entry of corpus) {
    const skip = existingTitles.has(entry.title);
    const text = fs.readFileSync(entry.file, 'utf8');
    // Exact filename match first; fuzzy fallback for rows where the log used
    // a descriptive title but the file is slug-named (the podcast EPs).
    let logUsage = usageByTranscript.get(entry.title) || [];
    if (!logUsage.length) {
      const fuzzyKey = [...usageByTranscript.keys()].find((k) => titlesMatch(k, entry.title));
      if (fuzzyKey) logUsage = usageByTranscript.get(fuzzyKey);
    }
    const libraryUsage = items
      .filter((it) => it.sourceTitles.some((t) => titlesMatch(t, entry.title)))
      .map((it) => ({ itemId: it.id, workspaceId: it.workspaceId, title: it.articleTitle, kind: 'article' }));
    // Dedup: an item already covered by the markdown log keeps one record.
    const seenTitles = new Set(logUsage.map((u) => normalize(u.title)));
    const mergedUsage = [...logUsage, ...libraryUsage.filter((u) => !seenTitles.has(normalize(u.title)))];

    usedFromLog += logUsage.length;
    usedFromLibrary += mergedUsage.length - logUsage.length;

    const usageNote = mergedUsage.length
      ? ` USED×${mergedUsage.length}: ${mergedUsage.map((u) => `"${u.title}"${u.external ? ' (log)' : ' (library)'}`).join('; ')}`
      : ' unused';
    console.log(`${skip ? 'SKIP (exists)' : 'CREATE'} [${entry.group}] ${entry.title} — ${text.length.toLocaleString()} chars —${usageNote}`);
    if (skip) continue;
    toCreate++;

    if (apply) {
      await db.collection(VAULT_COLLECTION).add({
        title: entry.title,
        group: entry.group,
        workspaceIds,
        type: 'text',
        textHash: sha256(text),
        text,
        chars: text.length,
        origin: 'import',
        addedAt: FieldValue.serverTimestamp(),
        usedIn: mergedUsage,
      });
    }
  }

  // 4. ContentForge-only sources: videos the app generated from that the
  // corpus does not cover become their own (used) vault entries.
  let appEntries = 0;
  const corpusTitles = corpus.map((e) => e.title);
  const seenThisRun = new Set();
  for (const item of items) {
    for (const vsrc of item.videoSources) {
      const videoId = videoIdOf(vsrc.url);
      if (!videoId || existingVideoIds.has(videoId) || seenThisRun.has(videoId)) continue;
      if (corpusTitles.some((t) => titlesMatch(t, vsrc.title))) continue; // covered by the corpus entry
      seenThisRun.add(videoId);
      appEntries++;
      console.log(`CREATE [Imported from ContentForge] ${vsrc.title} — ${vsrc.text.length.toLocaleString()} chars — USED×1: "${item.articleTitle}" (library)`);
      if (apply) {
        await db.collection(VAULT_COLLECTION).add({
          title: vsrc.title,
          group: 'Imported from ContentForge',
          workspaceIds: item.workspaceId ? [item.workspaceId] : workspaceIds,
          type: 'youtube',
          url: vsrc.url,
          videoId,
          textHash: sha256(vsrc.text),
          text: vsrc.text,
          chars: vsrc.text.length,
          origin: 'import',
          addedAt: FieldValue.serverTimestamp(),
          usedIn: [{ itemId: item.id, workspaceId: item.workspaceId, title: item.articleTitle, kind: 'article' }],
        });
      }
    }
  }

  console.log(`\n${corpus.length} corpus files; ${toCreate} to create; ${appEntries} ContentForge-only video sources to create; usage records — from log: ${usedFromLog}, from ContentForge library: ${usedFromLibrary}.`);
  if (!apply) console.log('\nDRY RUN — nothing written. Re-run with --apply to import.');
  else console.log('\nAPPLIED.');
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
}

module.exports = { parseUsageLog, groupOfDay, titlesMatch, collectCorpus };
