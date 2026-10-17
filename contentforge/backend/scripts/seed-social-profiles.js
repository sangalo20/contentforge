/**
 * Seed brand-accurate social profiles into workspaces.
 *
 * Reads the profiles in data/social-profiles.seed.json (distilled from the
 * Joe Downs Skill Pack in social-media-skills/) and upserts them into each
 * workspace's `socialPersonas` array in data/workspaces.json.
 *
 * Idempotent: profiles are matched by `id`, so re-running updates in place
 * instead of creating duplicates. Existing (non-seed) personas are left alone.
 *
 * Usage:
 *   node scripts/seed-social-profiles.js               # seed ALL workspaces
 *   node scripts/seed-social-profiles.js <workspaceId> # seed one workspace
 *   node scripts/seed-social-profiles.js --prune        # also REMOVE any persona not in the seed set
 *   node scripts/seed-social-profiles.js --list        # list workspaces and exit
 *   node scripts/seed-social-profiles.js --dry-run     # show changes, don't write
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const WORKSPACES_FILE = path.join(DATA_DIR, 'workspaces.json');
const SEED_FILE = path.join(DATA_DIR, 'social-profiles.seed.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listOnly = args.includes('--list');
const prune = args.includes('--prune');
const workspaceId = args.find((a) => !a.startsWith('--'));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const workspaces = readJson(WORKSPACES_FILE);
const { profiles } = readJson(SEED_FILE);

if (!Array.isArray(profiles) || profiles.length === 0) {
  console.error(`No profiles found in ${SEED_FILE}`);
  process.exit(1);
}

if (listOnly) {
  console.log('Workspaces:');
  workspaces.forEach((w) => console.log(`  ${w.id}  (${w.name})`));
  process.exit(0);
}

const targets = workspaceId
  ? workspaces.filter((w) => w.id === workspaceId)
  : workspaces;

if (workspaceId && targets.length === 0) {
  console.error(`Workspace not found: ${workspaceId}`);
  console.error('Run with --list to see available workspace ids.');
  process.exit(1);
}

let added = 0;
let updated = 0;
let removed = 0;
const seedIds = new Set(profiles.map((p) => p.id));

for (const ws of targets) {
  if (!Array.isArray(ws.socialPersonas)) ws.socialPersonas = [];
  for (const profile of profiles) {
    const seed = {
      id: profile.id,
      name: profile.name,
      prompt: profile.prompt,
      channels: profile.channels,
    };
    const idx = ws.socialPersonas.findIndex((p) => p.id === seed.id);
    if (idx === -1) {
      ws.socialPersonas.push(seed);
      added += 1;
      console.log(`  + ${ws.id}: added "${seed.name}"`);
    } else {
      ws.socialPersonas[idx] = { ...ws.socialPersonas[idx], ...seed };
      updated += 1;
      console.log(`  ~ ${ws.id}: updated "${seed.name}"`);
    }
  }
  if (prune) {
    const keep = ws.socialPersonas.filter((p) => seedIds.has(p.id));
    for (const p of ws.socialPersonas) {
      if (!seedIds.has(p.id)) {
        removed += 1;
        console.log(`  - ${ws.id}: removed "${p.name}"`);
      }
    }
    ws.socialPersonas = keep;
  }
}

console.log(`\n${added} added, ${updated} updated, ${removed} removed across ${targets.length} workspace(s).`);

if (dryRun) {
  console.log('Dry run — no changes written.');
  process.exit(0);
}

fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(workspaces, null, 2));
console.log(`Wrote ${WORKSPACES_FILE}`);
