// ── Workspace config store ──────────────────────────────────────────────
// Workspaces used to live in data/workspaces.json — a per-instance flat file
// that diverged across Cloud Run instances and vanished on redeploy. The
// source of truth is now a single Firestore doc, mirrored into an in-memory
// cache so every existing call site stays synchronous. A snapshot listener
// keeps each instance's cache in sync within seconds of a write elsewhere.
//
// Workspace TRASH also lives here: deleting a workspace moves it to trash
// (hidden app-wide, content untouched) for WORKSPACE_TRASH_DAYS. Owners can
// restore it or purge early; anything past retention is purged by an
// opportunistic sweep. Only the purge cascades.
const fs = require('fs');
const path = require('path');
const {
  db,
  FieldValue,
  getStorage,
  STORAGE_BUCKET,
  USERS_COLLECTION,
  COMMENTS_COLLECTION,
} = require('./firebase');

const WORKSPACES_FILE = path.join(__dirname, '..', 'data', 'workspaces.json');
const WORKSPACES_DOC = db.collection('content_pipeline_config').doc('workspaces');
let _workspacesCache = [];
let _workspacesWriteChain = Promise.resolve();

// Deep copy so a handler that mutates the array but never saves (or errors
// mid-way) can't pollute the cache — matching the old read-from-disk semantics.
const getWorkspaces = () => JSON.parse(JSON.stringify(_workspacesCache));

const saveWorkspaces = (workspaces) => {
  _workspacesCache = JSON.parse(JSON.stringify(workspaces));
  const snapshot = _workspacesCache;
  // Chain writes so an earlier save can never land after (and clobber) a later one.
  _workspacesWriteChain = _workspacesWriteChain
    .then(() => WORKSPACES_DOC.set({ workspaces: snapshot, updatedAt: FieldValue.serverTimestamp() }))
    .catch(err => console.error('FAILED to persist workspaces to Firestore:', err));
};

async function initWorkspacesStore() {
  const snap = await WORKSPACES_DOC.get();
  if (snap.exists && Array.isArray(snap.data().workspaces)) {
    _workspacesCache = snap.data().workspaces;
  } else if (fs.existsSync(WORKSPACES_FILE)) {
    // One-time migration from the legacy flat file.
    _workspacesCache = JSON.parse(fs.readFileSync(WORKSPACES_FILE, 'utf8'));
    await WORKSPACES_DOC.set({ workspaces: _workspacesCache, updatedAt: FieldValue.serverTimestamp() });
    console.log(`Migrated ${_workspacesCache.length} workspaces from workspaces.json to Firestore.`);
  }
  // Follow writes made by other instances.
  WORKSPACES_DOC.onSnapshot(
    doc => {
      if (doc.exists && Array.isArray(doc.data().workspaces)) {
        _workspacesCache = doc.data().workspaces;
      }
    },
    err => console.error('Workspaces snapshot listener error:', err)
  );
}

// For the readiness probe: touch the backing doc / report the cache size.
const pingWorkspacesStore = () => WORKSPACES_DOC.get();
const workspacesCount = () => _workspacesCache.length;

// --- WORKSPACE TRASH ----------------------------------------------------------
const WORKSPACE_TRASH_DAYS = parseInt(process.env.WORKSPACE_TRASH_DAYS || '60', 10);
const trashPurgeAt = (deletedAt) => new Date(new Date(deletedAt).getTime() + WORKSPACE_TRASH_DAYS * 86400000);

// The permanent cascade: removes the workspace config, every library item in it
// (with comments and stored cover/social images, best-effort on storage), and
// scrubs the workspace id from users' access and reviewer grants.
async function purgeWorkspace(wid) {
  const snap = await db.collection('content_pipeline_library').where('workspaceId', '==', wid).get();
  let deletedItems = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    // Stored images: article cover + any per-channel social images.
    const paths = [];
    if (d.coverImage?.storagePath) paths.push(d.coverImage.storagePath);
    for (const val of Object.values(d.socials || {})) {
      if (val?.image?.storagePath) paths.push(val.image.storagePath);
    }
    await Promise.all(paths.map(p =>
      getStorage().bucket(STORAGE_BUCKET).file(p).delete().catch(() => {})
    ));
    // Comments on the item.
    const cSnap = await db.collection(COMMENTS_COLLECTION).where('itemId', '==', doc.id).get();
    if (!cSnap.empty) {
      let batch = db.batch();
      let pending = 0;
      for (const c of cSnap.docs) {
        batch.delete(c.ref);
        if (++pending >= 450) { await batch.commit(); batch = db.batch(); pending = 0; }
      }
      if (pending > 0) await batch.commit();
    }
    await doc.ref.delete();
    deletedItems++;
  }

  // Scrub the workspace id from users' scoped access/reviewer arrays.
  const uSnap = await db.collection(USERS_COLLECTION).get();
  await Promise.all(uSnap.docs.map(u => {
    const data = u.data();
    const upd = {};
    if (Array.isArray(data.workspaceAccess) && data.workspaceAccess.includes(wid)) {
      upd.workspaceAccess = data.workspaceAccess.filter(x => x !== wid);
    }
    if (Array.isArray(data.reviewerWorkspaces) && data.reviewerWorkspaces.includes(wid)) {
      upd.reviewerWorkspaces = data.reviewerWorkspaces.filter(x => x !== wid);
    }
    return Object.keys(upd).length ? u.ref.set(upd, { merge: true }) : null;
  }));

  const workspaces = getWorkspaces();
  const index = workspaces.findIndex(w => w.id === wid);
  if (index !== -1) {
    workspaces.splice(index, 1);
    saveWorkspaces(workspaces);
  }
  return deletedItems;
}

// Purge trash entries whose retention has lapsed. Fire-and-forget, throttled to
// once an hour; triggered on startup and when workspaces are listed.
let lastTrashSweep = 0;
function sweepWorkspaceTrash() {
  if (Date.now() - lastTrashSweep < 60 * 60 * 1000) return;
  lastTrashSweep = Date.now();
  (async () => {
    const expired = getWorkspaces().filter(w => w.deletedAt && trashPurgeAt(w.deletedAt) <= new Date());
    for (const w of expired) {
      try {
        const n = await purgeWorkspace(w.id);
        console.log(`[Workspace Trash] "${w.id}" retention lapsed — purged (${n} items removed)`);
      } catch (err) {
        console.error(`[Workspace Trash] failed to purge "${w.id}":`, err.message);
      }
    }
  })().catch(err => console.error('[Workspace Trash] sweep failed:', err.message));
}

module.exports = {
  getWorkspaces,
  saveWorkspaces,
  initWorkspacesStore,
  pingWorkspacesStore,
  workspacesCount,
  WORKSPACE_TRASH_DAYS,
  trashPurgeAt,
  purgeWorkspace,
  sweepWorkspaceTrash,
};
