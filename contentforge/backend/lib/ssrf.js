// SSRF-safe fetch for user-supplied image URLs (cover images downloaded from
// the temporary xAI/Grok CDN). Even though callers are authenticated, the URL
// is attacker-controllable, so a naive fetch() would let a user probe the
// Cloud Run metadata server or internal services. We require https, resolve
// the host, and refuse private / loopback / link-local / metadata targets.
const dns = require('dns').promises;
const net = require('net');

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||           // link-local + GCP metadata (169.254.169.254)
      (a === 100 && b >= 64 && b <= 127)    // carrier-grade NAT
    );
  }
  const lower = ip.toLowerCase();
  return lower === '::1' || lower === '::' || lower.startsWith('fc') ||
    lower.startsWith('fd') || lower.startsWith('fe80') || lower.startsWith('::ffff:');
}

// deps (injectable for tests): lookup — dns.promises.lookup-compatible,
// fetchImpl — global fetch-compatible.
async function fetchRemoteImage(rawUrl, deps = {}) {
  const { lookup = dns.lookup, fetchImpl = fetch } = deps;
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid image URL');
  }
  if (url.protocol !== 'https:') throw new Error('Image URL must be https');
  if (url.port && url.port !== '443') throw new Error('Unexpected port on image URL');
  // Block hostnames that are already literal internal IPs, then block anything
  // that RESOLVES to an internal IP (defends against a hostname pointing inward).
  // WHATWG URLs keep the brackets on IPv6 hosts ('[::1]'), which net.isIP()
  // does not recognize — strip them or literal IPv6 bypasses this check.
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error('Image URL resolves to a disallowed address');
  }
  const resolved = await lookup(hostname, { all: true });
  if (resolved.some(r => isPrivateIp(r.address))) {
    throw new Error('Image URL resolves to a disallowed address');
  }
  const res = await fetchImpl(url, { redirect: 'error' }); // no redirect-to-internal
  if (!res.ok) throw new Error(`Failed to download image (status ${res.status})`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error('URL did not return an image');
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType };
}

module.exports = { isPrivateIp, fetchRemoteImage };
