// Backfill scouting gists for vault entries that predate gisting (the seeded
// corpus). Batches of 8 through Odin's /api/v1/vault/gist distiller; entries
// that already have a gist are skipped, so re-running is safe and failures
// just leave entries on the excerpt fallback.
//
// Usage:
//   node scripts/backfill-vault-gists.js            # DRY RUN (counts only)
//   node scripts/backfill-vault-gists.js --apply    # distill + write
//
// Requires Odin reachable at ODIN_API_URL (local dev: http://localhost:8000).
require('dotenv').config();
const axios = require('axios');
const { db } = require('../lib/firebase');
const { VAULT_COLLECTION } = require('../lib/vault');
const { odinRequestHeaders } = require('../lib/odinClient');

const BATCH = 8;
const SCRIPT_USER = { uid: 'backfill-vault-gists', email: 'ops@script' };

async function main() {
  const apply = process.argv.includes('--apply');
  const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';

  const snap = await db.collection(VAULT_COLLECTION).get();
  const pending = [];
  snap.forEach((d) => {
    const e = d.data();
    if (!e.gist && (e.text || '').trim()) pending.push({ id: d.id, title: e.title, text: e.text });
  });
  console.log(`${snap.size} vault entries; ${pending.length} need gists.`);
  if (!apply) {
    console.log('\nDRY RUN — nothing distilled. Re-run with --apply.');
    return;
  }

  const distill = async (entries) => {
    const res = await axios.post(`${odinApiUrl}/api/v1/vault/gist`, {
      entries: entries.map((e) => ({ id: e.id, title: e.title, text: e.text.slice(0, 5000) })),
    }, { headers: await odinRequestHeaders(odinApiUrl, SCRIPT_USER), timeout: 120_000 });
    const gists = res.data?.gists || [];
    for (const g of gists) {
      await db.collection(VAULT_COLLECTION).doc(g.id).update({ gist: g.gist, topics: g.topics || [] });
    }
    return new Set(gists.map((g) => g.id));
  };

  let written = 0;
  let failed = 0;
  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    let missed = batch;
    try {
      const got = await distill(batch);
      missed = batch.filter((e) => !got.has(e.id));
      written += got.size;
    } catch (err) {
      console.error(`batch ${1 + i / BATCH} failed: ${err.response?.data?.detail || err.message}`);
    }
    // Some batches derail the model (AI-topic transcripts talk over the
    // format); the same entries distill fine one at a time.
    for (const e of missed) {
      try {
        const got = await distill([e]);
        if (got.size) written++;
        else failed++;
      } catch {
        failed++;
      }
    }
    console.log(`batch ${1 + i / BATCH}/${Math.ceil(pending.length / BATCH)}: ${batch.length - missed.length} gists${missed.length ? `, ${missed.length} retried solo` : ''}`);
  }
  console.log(`\nAPPLIED: ${written} gists written, ${failed} entries left on the excerpt fallback (re-run to retry).`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
