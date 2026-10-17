import { describe, it, expect, vi } from 'vitest';
import { isPrivateIp, fetchRemoteImage } from '../lib/ssrf.js';

// A lookup that resolves every hostname to the given addresses, and a fetch
// that returns a well-formed image response — so tests exercise only the
// guard logic, never the network.
const lookupTo = (...addresses) => async () => addresses.map(address => ({ address, family: 4 }));
const imageResponse = (overrides = {}) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'image/png' },
  arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  ...overrides,
});

describe('isPrivateIp', () => {
  it('blocks the classic private IPv4 ranges', () => {
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.31.255.255')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);
  });

  it('blocks loopback, unspecified, link-local/metadata, and CGNAT', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('0.0.0.0')).toBe(true);
    expect(isPrivateIp('169.254.169.254')).toBe(true); // GCP metadata server
    expect(isPrivateIp('100.64.0.1')).toBe(true);
    expect(isPrivateIp('100.127.255.255')).toBe(true);
  });

  it('allows public IPv4', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('172.15.0.1')).toBe(false);  // just outside 172.16/12
    expect(isPrivateIp('172.32.0.1')).toBe(false);
    expect(isPrivateIp('100.63.0.1')).toBe(false);  // just outside CGNAT
    expect(isPrivateIp('100.128.0.1')).toBe(false);
    expect(isPrivateIp('169.253.1.1')).toBe(false);
  });

  it('blocks internal IPv6 (loopback, ULA, link-local, v4-mapped)', () => {
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('::')).toBe(true);
    expect(isPrivateIp('fc00::1')).toBe(true);
    expect(isPrivateIp('fd12:3456::1')).toBe(true);
    expect(isPrivateIp('fe80::1')).toBe(true);
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateIp('FD00::1')).toBe(true); // case-insensitive
  });

  it('allows public IPv6', () => {
    expect(isPrivateIp('2607:f8b0::1')).toBe(false);
  });
});

describe('fetchRemoteImage — URL validation', () => {
  it('rejects malformed URLs', async () => {
    await expect(fetchRemoteImage('not a url')).rejects.toThrow('Invalid image URL');
  });

  it('rejects non-https schemes', async () => {
    await expect(fetchRemoteImage('http://example.com/a.png')).rejects.toThrow('must be https');
    await expect(fetchRemoteImage('file:///etc/passwd')).rejects.toThrow('must be https');
    await expect(fetchRemoteImage('ftp://example.com/a.png')).rejects.toThrow('must be https');
  });

  it('rejects non-443 ports', async () => {
    await expect(fetchRemoteImage('https://example.com:8080/a.png')).rejects.toThrow('Unexpected port');
  });

  it('accepts an explicit :443', async () => {
    const res = await fetchRemoteImage('https://example.com:443/a.png', {
      lookup: lookupTo('93.184.216.34'),
      fetchImpl: async () => imageResponse(),
    });
    expect(res.contentType).toBe('image/png');
  });
});

describe('fetchRemoteImage — private-target blocking', () => {
  it('blocks literal internal IPs without touching DNS or the network', async () => {
    const lookup = vi.fn();
    const fetchImpl = vi.fn();
    for (const host of ['127.0.0.1', '169.254.169.254', '10.1.2.3', '192.168.0.10', '[::1]']) {
      await expect(fetchRemoteImage(`https://${host}/a.png`, { lookup, fetchImpl }))
        .rejects.toThrow('disallowed address');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('blocks hostnames that RESOLVE to internal IPs (DNS rebinding)', async () => {
    const fetchImpl = vi.fn();
    await expect(fetchRemoteImage('https://evil.example.com/a.png', {
      lookup: lookupTo('169.254.169.254'),
      fetchImpl,
    })).rejects.toThrow('disallowed address');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('blocks a host with mixed public+private A records', async () => {
    await expect(fetchRemoteImage('https://evil.example.com/a.png', {
      lookup: lookupTo('93.184.216.34', '10.0.0.1'),
      fetchImpl: vi.fn(),
    })).rejects.toThrow('disallowed address');
  });
});

describe('fetchRemoteImage — response handling', () => {
  const publicDeps = (fetchImpl) => ({ lookup: lookupTo('93.184.216.34'), fetchImpl });

  it('fetches with redirects disabled (no redirect-to-internal)', async () => {
    const fetchImpl = vi.fn(async () => imageResponse());
    await fetchRemoteImage('https://example.com/a.png', publicDeps(fetchImpl));
    expect(fetchImpl).toHaveBeenCalledWith(expect.anything(), { redirect: 'error' });
  });

  it('rejects non-2xx responses', async () => {
    await expect(fetchRemoteImage('https://example.com/a.png',
      publicDeps(async () => imageResponse({ ok: false, status: 404 }))
    )).rejects.toThrow('status 404');
  });

  it('rejects non-image content types', async () => {
    await expect(fetchRemoteImage('https://example.com/a.png',
      publicDeps(async () => imageResponse({ headers: { get: () => 'text/html' } }))
    )).rejects.toThrow('did not return an image');
  });

  it('returns the buffer and content type for a good image', async () => {
    const res = await fetchRemoteImage('https://example.com/a.png',
      publicDeps(async () => imageResponse()));
    expect(res.contentType).toBe('image/png');
    expect(Buffer.isBuffer(res.buffer)).toBe(true);
    expect([...res.buffer]).toEqual([1, 2, 3]);
  });
});
