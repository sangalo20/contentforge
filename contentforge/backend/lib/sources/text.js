// Pasted-text source resolver: pure passthrough. Validation and the hard
// per-source cap live in the registry (index.js) — pasted text is the one
// source kind the user can always trim themselves, so it never truncates.
function firstLineTitle(text) {
  const first = String(text || '').trim().split('\n')[0].trim();
  if (!first) return 'Pasted text';
  return first.length > 80 ? `${first.slice(0, 77)}...` : first;
}

async function resolve({ text, label }) {
  return { title: label || firstLineTitle(text), text: String(text).trim() };
}

module.exports = { resolve };
