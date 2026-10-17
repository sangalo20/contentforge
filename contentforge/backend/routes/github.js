// GitHub integration surface: per-user connections (Settings → Integrations)
// and the Source Composer's repo picker. Every user connects their OWN GitHub
// (personal or work account); the forge acts as them. Tokens are held
// server-side — endpoints return repo metadata and masked status only.
const express = require('express');
// Module-object calls (not destructured) so the token-validation seam is
// stubbable in tests.
const githubRepos = require('../lib/githubRepos');
const { getGithubToken, githubStatus, setGithubToken, clearGithubToken } = require('../lib/integrations');
const { log: logger } = require('../logger');

const router = express.Router();

// List the repositories the CALLING USER's GitHub connection can see, for the
// composer's picker. { configured: false } when they haven't connected — the
// UI shows setup instructions and public-URL mode keeps working.
router.get('/api/github/repos', async (req, res) => {
  try {
    const token = await getGithubToken(req.user.uid);
    res.json(await githubRepos.listRepos(token));
  } catch (error) {
    console.error('Failed to list GitHub repos:', error.message);
    res.status(502).json({ error: error.message });
  }
});

// Masked status of the calling user's own connection.
router.get('/api/integrations/github', async (req, res) => {
  try {
    res.json(await githubStatus(req.user.uid));
  } catch (error) {
    console.error('Failed to read GitHub integration status:', error.message);
    res.status(500).json({ error: 'Failed to read the GitHub connection status' });
  }
});

// Connect: validate the pasted token against GitHub, then store it on the
// caller's user record. Live immediately — no env edit, no redeploy.
router.put('/api/integrations/github', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (!token) return res.status(400).json({ error: 'A token is required.' });
  try {
    const { login } = await githubRepos.validateToken(token);
    await setGithubToken(req.user.uid, token, login);
    githubRepos.clearCache(); // the picker must reflect the new credential immediately
    logger.event('integration.github.connected', { by: req.user.uid, login });
    res.json({ status: 'success', login, ...(await githubStatus(req.user.uid)) });
  } catch (error) {
    console.error('GitHub token validation failed:', error.message);
    res.status(422).json({ error: error.message });
  }
});

// Disconnect the caller's own connection.
router.delete('/api/integrations/github', async (req, res) => {
  try {
    await clearGithubToken(req.user.uid);
    githubRepos.clearCache();
    logger.event('integration.github.disconnected', { by: req.user.uid });
    res.json({ status: 'success', ...(await githubStatus(req.user.uid)) });
  } catch (error) {
    console.error('Failed to disconnect GitHub:', error.message);
    res.status(500).json({ error: 'Failed to disconnect GitHub' });
  }
});

module.exports = router;
