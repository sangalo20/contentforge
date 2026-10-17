// A minimal in-memory Firestore fake covering exactly the surface the route
// modules touch: collection().doc().get/update/set, collection().where().get(),
// collection().add(), and batches. Seed it with plain objects; reads return
// Firestore-shaped snapshots ({ exists, id, data(), ref }).
//
// Usage:
//   const store = { content_pipeline_library: { item1: { workspaceId: 'ws1' } } };
//   const db = makeFakeDb(store);
export function makeFakeDb(store) {
  const snapshotOf = (name, id) => {
    const data = store[name]?.[id];
    return {
      exists: data !== undefined,
      id,
      data: () => data,
      ref: makeDocRef(name, id),
    };
  };

  const makeDocRef = (name, id) => ({
    id,
    onSnapshot: () => {},
    get: async () => snapshotOf(name, id),
    // Real Firestore update() semantics: keys are dotted FIELD PATHS (not
    // literal keys), and a FieldValue.delete() sentinel removes the field.
    update: async (patch) => {
      if (!store[name]?.[id]) throw new Error(`update on missing doc ${name}/${id}`);
      for (const [path, value] of Object.entries(patch)) {
        const parts = path.split('.');
        let target = store[name][id];
        for (const part of parts.slice(0, -1)) {
          if (typeof target[part] !== 'object' || target[part] === null) target[part] = {};
          target = target[part];
        }
        const leaf = parts[parts.length - 1];
        if (value && value._fake === 'delete') delete target[leaf];
        else target[leaf] = value;
      }
    },
    set: async (data, opts = {}) => {
      store[name] = store[name] || {};
      store[name][id] = opts.merge ? { ...(store[name][id] || {}), ...data } : { ...data };
    },
    delete: async () => {
      if (store[name]) delete store[name][id];
    },
  });

  const matches = (doc, filters) => filters.every(([field, op, value]) => {
    const actual = doc[field];
    switch (op) {
      case '==': return actual === value;
      case '>=': return actual >= value;
      case '<=': return actual <= value;
      default: throw new Error(`fakeFirestore: unsupported operator ${op}`);
    }
  });

  const makeQuery = (name, filters = []) => ({
    where: (field, op, value) => makeQuery(name, [...filters, [field, op, value]]),
    limit: () => makeQuery(name, filters),
    orderBy: () => makeQuery(name, filters),
    get: async () => {
      const entries = Object.entries(store[name] || {})
        .filter(([, doc]) => matches(doc, filters));
      const docs = entries.map(([id]) => snapshotOf(name, id));
      return {
        empty: docs.length === 0,
        size: docs.length,
        docs,
        forEach: (fn) => docs.forEach(fn),
      };
    },
  });

  let autoId = 0;
  return {
    collection: (name) => ({
      doc: (id = `auto-${++autoId}`) => makeDocRef(name, id),
      add: async (data) => {
        const id = `auto-${++autoId}`;
        store[name] = store[name] || {};
        store[name][id] = { ...data };
        return makeDocRef(name, id);
      },
      ...makeQuery(name),
    }),
    batch: () => {
      const ops = [];
      return {
        set: (ref, data) => ops.push(() => ref.set(data)),
        update: (ref, patch) => ops.push(() => ref.update(patch)),
        delete: (ref) => ops.push(() => ref.delete()),
        commit: async () => { for (const op of ops.splice(0)) await op(); },
      };
    },
    settings: () => {},
  };
}

// Install an in-memory replacement for lib/firebase.js via its documented
// test seam (global.__CONTENTFORGE_TEST_FIREBASE__). Must run BEFORE any
// route/lib module is imported — vi.mock cannot intercept the native CJS
// require chain, this global can. Returns the store for seeding/assertions.
export function installFakeFirebase(store, extras = {}) {
  global.__CONTENTFORGE_TEST_FIREBASE__ = {
    db: makeFakeDb(store),
    FieldValue: {
      serverTimestamp: () => ({ _fake: 'serverTimestamp' }),
      delete: () => ({ _fake: 'delete' }),
    },
    getAuth: () => ({ listUsers: async () => ({ users: [] }), getUser: async () => ({ email: null }) }),
    getStorage: () => ({ bucket: () => ({ file: () => ({ delete: async () => {}, save: async () => {}, download: async () => [Buffer.from('fake-image-bytes')] }) }) }),
    STORAGE_BUCKET: 'test-bucket',
    USERS_COLLECTION: 'content_pipeline_users',
    NOTIFICATIONS_COLLECTION: 'content_pipeline_notifications',
    COMMENTS_COLLECTION: 'content_pipeline_comments',
    INVITES_COLLECTION: 'content_pipeline_invites',
    API_KEYS_COLLECTION: 'content_pipeline_api_keys',
    JOBS_COLLECTION: 'content_pipeline_jobs',
    DESIGNS_COLLECTION: 'content_pipeline_designs',
    ...extras,
  };
  return store;
}
