// Per-key rate limiting for machine callers. The external API shares the
// app's infrastructure (CPU, Firestore quotas, Odin capacity), so a runaway
// agent or script must not be able to degrade the app for people. Policy:
// every request authenticated by an API key (req.user.apiKey) passes a
// token-bucket limiter keyed by key id; human sessions are never limited.
//
// Token bucket: capacity = API_KEY_RATE_LIMIT requests, refilled continuously
// at that rate per minute — bursts up to the cap are fine, sustained traffic
// converges on the limit. State is per instance (like V1_MAX_ACTIVE_JOBS):
// with N Cloud Run instances the effective ceiling is up to N× the limit,
// which is acceptable — the point is bounding runaways, not exact quotas.
const buckets = new Map();

// Read at call time so tests (and ops) can tune without a restart.
const limitPerMinute = () => Number(process.env.API_KEY_RATE_LIMIT ?? 120);

const apiKeyRateLimit = (req, res, next) => {
  const keyId = req.user?.apiKey?.id;
  if (!keyId) return next();
  const limit = limitPerMinute();
  if (!(limit > 0)) return next(); // 0 or invalid disables the limiter

  const now = Date.now();
  let bucket = buckets.get(keyId);
  if (!bucket) {
    bucket = { tokens: limit, at: now };
    buckets.set(keyId, bucket);
  }
  bucket.tokens = Math.min(limit, bucket.tokens + ((now - bucket.at) / 60_000) * limit);
  bucket.at = now;

  if (bucket.tokens < 1) {
    const retryAfterSec = Math.max(1, Math.ceil((1 - bucket.tokens) * (60 / limit)));
    res.set('Retry-After', String(retryAfterSec));
    // The v1 envelope — every rate-limited caller is a machine.
    return res.status(429).json({
      error: {
        code: 'rate_limited',
        message: `Rate limit exceeded (${limit} requests/min per API key). Retry in ~${retryAfterSec}s.`,
      },
    });
  }
  bucket.tokens -= 1;

  // Bound the map: sweep buckets idle >10 min once it grows past 1000 keys.
  if (buckets.size > 1000) {
    for (const [k, v] of buckets) {
      if (now - v.at > 10 * 60_000) buckets.delete(k);
    }
  }
  next();
};

module.exports = { apiKeyRateLimit };
