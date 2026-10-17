// One-time backfill for the three legacy data generations in
// content_pipeline_library (tech debt register #6):
//
//   1. Articles with status 'pending_approval'  -> 'draft'   (legacy name)
//   2. Articles with NO status                  -> 'approved' (pre-review-gate;
//      readers have always treated absent as approved). Original-idea items
//      (sourceType 'original') are social-only and keep no article status.
//   3. Social entries with the nested `copy` shape -> flattened post/thread/cta
//      (pre-flattening), and social entries with NO status -> 'approved'.
//   4. Items with youtubeUrls but NO sources[] -> backfilled sources array
//      (pre-multi-source; the transcript stays the combined blob — per-source
//      text is not recoverable for multi-video items, so sources[] carries
//      url/title/type only for them; single-video items keep their full text).
//
// Usage:
//   node scripts/migrate-legacy-statuses.js            # DRY RUN (default)
//   node scripts/migrate-legacy-statuses.js --apply    # write the changes
//
// The dry run prints every document that would change and why; nothing is
// written. Run against the same env/credentials as the server (.env + ADC).
require('dotenv').config();
const { db, FieldValue } = require('../lib/firebase');
const { sourceSignature } = require('../lib/sources');

const socialKindOf = (key) =>
  key.endsWith('_carousel') ? 'carousel' : key.endsWith('_poster') ? 'poster' : 'text';

async function main() {
  const apply = process.argv.includes('--apply');
  const snap = await db.collection('content_pipeline_library').get();
  const changes = [];

  snap.forEach((doc) => {
    const d = doc.data();
    const update = {};
    const notes = [];

    // 1 + 2: the article-status generations.
    if (d.status === 'pending_approval') {
      update.status = 'draft';
      notes.push("article: 'pending_approval' -> 'draft'");
    } else if (d.status === undefined && d.sourceType !== 'original') {
      update.status = 'approved';
      notes.push("article: missing status -> 'approved' (pre-review-gate)");
    }

    // 3: per-channel social entries.
    for (const [key, val] of Object.entries(d.socials || {})) {
      if (!val || typeof val !== 'object') continue;
      if (socialKindOf(key) === 'text' && val.copy && val.post == null && !Array.isArray(val.thread)) {
        const copy = typeof val.copy === 'object' ? val.copy : {};
        update[`socials.${key}.post`] = typeof copy.post === 'string' ? copy.post : null;
        update[`socials.${key}.thread`] = Array.isArray(copy.thread) ? copy.thread.map(String) : null;
        update[`socials.${key}.cta`] = copy.cta ?? null;
        update[`socials.${key}.copy`] = FieldValue.delete();
        notes.push(`socials.${key}: flattened legacy nested copy`);
      }
      if (val.status === undefined) {
        update[`socials.${key}.status`] = 'approved';
        notes.push(`socials.${key}: missing status -> 'approved'`);
      }
    }

    // 4: backfill sources[] on pre-multi-source items.
    const legacyUrls = d.youtubeUrls || (d.youtubeUrl ? [d.youtubeUrl] : []);
    if (!d.sources && legacyUrls.length > 0) {
      const single = legacyUrls.length === 1;
      update.sources = legacyUrls.map((url, i) => ({
        type: 'youtube',
        url,
        title: (d.titles && d.titles[i]) || 'Unknown Video',
        // The combined transcript is only attributable to one video when there
        // is one video; blends keep their text in the legacy transcript field.
        ...(single && d.transcript ? { text: d.transcript, chars: d.transcript.length } : {}),
      }));
      update.sourceSignature = sourceSignature(legacyUrls.map((url) => ({ type: 'youtube', url })));
      notes.push(`sources: backfilled ${legacyUrls.length} youtube source(s) from youtubeUrls`);
    }

    if (Object.keys(update).length) changes.push({ id: doc.id, notes, update });
  });

  console.log(`Scanned ${snap.size} library documents; ${changes.length} need migration.\n`);
  for (const c of changes) {
    console.log(`- ${c.id}`);
    for (const n of c.notes) console.log(`    ${n}`);
  }

  if (!apply) {
    console.log('\nDRY RUN — nothing written. Re-run with --apply to migrate.');
    return;
  }

  let batch = db.batch();
  let pending = 0;
  for (const c of changes) {
    batch.update(db.collection('content_pipeline_library').doc(c.id), c.update);
    if (++pending >= 400) { await batch.commit(); batch = db.batch(); pending = 0; }
  }
  if (pending > 0) await batch.commit();
  console.log(`\nAPPLIED: ${changes.length} documents migrated.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
