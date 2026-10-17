// Vault source resolver: compose from a Source Vault entry's stored text —
// no fetching, instant, and the generation pipeline records the usage back
// onto the entry afterwards (see routes/generate.js). Transcripts share the
// youtube cap exemption: they were ingested whole and stay whole.
async function resolve({ vaultId }, ctx = {}) {
  const { getEntry } = require('../vault');
  const entry = await getEntry(vaultId);
  if (!entry) {
    throw new Error('This vault entry no longer exists. Remove it from the stack and pick another.');
  }
  const stage = ctx.stage || (() => {});
  stage(`From vault: "${entry.title}" (${(entry.chars || 0).toLocaleString('en-US')} characters).`, 'success');
  return { title: entry.title, text: entry.text || '' };
}

module.exports = { resolve };
