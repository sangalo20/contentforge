// The v1 contract check (TECH_DEBT #1b): docs/openapi.v1.json and the actual
// routers must agree exactly — every documented path+method is registered,
// and every registered v1 route is documented. A route added or removed
// without touching the spec fails CI, which is the point: v1's shape is a
// compatibility promise to external callers.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);
installFakeFirebase({});

const spec = JSON.parse(readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../docs/openapi.v1.json'), 'utf8'
));

// Express route path -> OpenAPI path template (:id -> {id}).
const toSpecPath = (p) => p.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

// Every method+path a router registers, as "METHOD /path".
const registeredIn = (router) => {
  const out = [];
  for (const layer of router.stack) {
    if (!layer.route) continue;
    for (const method of Object.keys(layer.route.methods)) {
      if (method === '_all') continue;
      out.push(`${method.toUpperCase()} ${toSpecPath(layer.route.path)}`);
    }
  }
  return out;
};

const documented = [];
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const method of Object.keys(methods)) {
    documented.push(`${method.toUpperCase()} ${path}`);
  }
}

describe('openapi.v1.json <-> router contract', () => {
  it('documents exactly the routes the v1 router registers', () => {
    const v1Routes = registeredIn(require('../routes/v1'));
    // The MCP endpoint is registered with router.all(); it is documented as
    // POST (the only verb that matters to callers).
    const mcpDocumented = documented.filter((d) => d.endsWith('/api/v1/mcp'));
    expect(mcpDocumented).toEqual(['POST /api/v1/mcp']);

    const restDocumented = documented.filter((d) => !d.endsWith('/api/v1/mcp')).sort();
    expect(restDocumented).toEqual([...v1Routes].sort());
  });

  it('the MCP router actually serves /api/v1/mcp', () => {
    const mcpRouter = require('../routes/mcp');
    const paths = mcpRouter.stack.filter((l) => l.route).map((l) => l.route.path);
    expect(paths).toContain('/api/v1/mcp');
  });

  it('every error response in the spec uses the frozen envelope', () => {
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        for (const [status, resp] of Object.entries(op.responses || {})) {
          if (Number(status) < 400) continue;
          const schema = resp.content?.['application/json']?.schema;
          expect(schema?.$ref, `${method} ${path} ${status}`).toBe('#/components/schemas/Error');
        }
      }
    }
  });
});
