// Pasted-code source resolver: passthrough like text, plus a language tag the
// composer uses to fence the body so Oscar reads it as code (and the prompt
// hint tells him to explain it, not reproduce it). The hard per-source cap in
// the registry applies — code is pasted, so the user can always trim it.
async function resolve({ text, label, language }) {
  const lang = String(language || '').trim();
  return {
    title: label || (lang ? `Code (${lang})` : 'Code snippet'),
    text: String(text).trim(),
  };
}

module.exports = { resolve };
