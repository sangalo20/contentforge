// --- ODIN SERVICE-TO-SERVICE AUTH ---
// Odin is a backend-only service. In production it requires authenticated
// invocation (Cloud Run IAM), so calls carry a Google-signed ID token minted
// for the Odin audience. Locally (http://localhost) no token is needed. The
// end-user's identity is forwarded to Odin for logging/context.
const { GoogleAuth } = require('google-auth-library');
const googleAuth = new GoogleAuth();
const _odinIdTokenClients = {};

async function odinRequestHeaders(odinUrl, user, attribution = {}) {
  const headers = {
    'X-User-Id': user?.uid || '',
    'X-User-Email': user?.email || '',
  };
  // Attribution for Odin's AI usage/cost ledger (content_pipeline_usage).
  if (attribution.workspaceId) headers['X-Workspace-Id'] = attribution.workspaceId;
  if (attribution.itemId) headers['X-Item-Id'] = attribution.itemId;
  if (/^https:\/\//i.test(odinUrl)) {
    try {
      if (!_odinIdTokenClients[odinUrl]) {
        _odinIdTokenClients[odinUrl] = await googleAuth.getIdTokenClient(odinUrl);
      }
      // Mint the raw ID token directly. (Note: getRequestHeaders() returns a Web
      // Headers object in google-auth-library v10+, which does not spread via
      // Object.assign — fetching the token string avoids that pitfall.)
      const token = await _odinIdTokenClients[odinUrl].idTokenProvider.fetchIdToken(odinUrl);
      headers['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.error('Failed to mint Odin ID token:', err.message);
    }
  }
  return headers;
}

module.exports = { odinRequestHeaders };
