// Bump VERSION whenever you ship changes users should know about.
// The app compares this to localStorage so the modal shows exactly once per version.
// Format: YYYY.MM.DD or a semver string — just needs to be lexicographically comparable.
export const VERSION = '2026.07.16.1';

// Add a new object to the TOP of this array for each release.
// 'tag' is one of: 'new' | 'improved' | 'fixed'
export const CHANGELOG = [
  {
    version: '2026.07.16.1',
    title: 'AI usage & cost tracking',
    date: 'July 16, 2026',
    items: [
      { tag: 'new', text: 'AI Usage & Cost panel in the Admin area: estimated spend across Anthropic, Gemini, and xAI — by agent, workspace, model, and day.' },
      { tag: 'new', text: 'Every article now shows what it cost to produce (hover for the per-agent split).' },
    ],
  },
  {
    version: '2026.07.15.3',
    title: 'Meet Heimdall — the quality gate',
    date: 'July 15, 2026',
    items: [
      { tag: 'new', text: 'Heimdall joins the crew: after Oscar writes a draft, Heimdall checks every claim against the source video, tightens the tone, and polishes the prose before it reaches your library.' },
      { tag: 'new', text: '"Heimdall reviewed this draft" panel on new articles — expand it to see exactly what he changed.' },
      { tag: 'new', text: 'The Forge now narrates the crew live: watch Oscar write and Heimdall review as the pipeline runs.' },
      { tag: 'improved', text: 'Oscar\'s writing brain upgraded — strict source fidelity (no invented facts or stats), stronger structure, and a de-AI style pass.' },
      { tag: 'fixed', text: 'Transcript failures now report the real cause instead of always blaming the video URL.' },
    ],
  },
  {
    version: '2026.07.15.2',
    title: 'The review workflow',
    date: 'July 15, 2026',
    items: [
      { tag: 'new', text: 'Finalize, then submit for review: creators mark work done ("Approve" is now "Finalize"), tag reviewers, and reviewers get a bell + email. Creators are never blocked while a review is open.' },
      { tag: 'new', text: 'Articles and social pieces share one lifecycle: draft → finalized → in review → approved → published.' },
      { tag: 'new', text: 'Reviewers can Approve or Request changes — the note lands in the item\'s comment thread and the piece returns to draft.' },
      { tag: 'new', text: 'Manage an active review: add or swap reviewers (only new ones are notified) or withdraw it entirely.' },
      { tag: 'new', text: 'Reviewer access is granted per workspace from Users → "Reviews In" — it\'s independent of the Admin/Creator role.' },
      { tag: 'new', text: 'Per-workspace "Require review" toggle: publishing to the website waits for reviewer approval.' },
      { tag: 'new', text: '"Needs your attention" — the home page and each workspace Overview queue up reviews waiting on you, changes requested back to you, and approved work ready to publish.' },
    ],
  },
  {
    version: '2026.07.15.1',
    title: 'Loki Studio, workspace Overview & housekeeping',
    date: 'July 15, 2026',
    items: [
      { tag: 'new', text: 'Loki Studio: a full-screen canvas for carousels, posters AND text posts — chat with Loki on the left while you edit the pages on the right.' },
      { tag: 'new', text: 'X threads in the studio: add, remove, and reorder posts, with a per-post re-roll.' },
      { tag: 'new', text: 'Per-post cover images by Hermes for LinkedIn and X posts — downloadable for manual posting.' },
      { tag: 'new', text: 'Workspace Overview: entering a workspace now shows a lifecycle funnel, your attention queue, and recent work. The generator lives under "The Forge" in the sidebar.' },
      { tag: 'new', text: 'Owner role (above Admin), workspace archive, and delete-with-safety-net: deleted workspaces sit in a 60-day trash in Global Settings before being purged, and can be restored.' },
      { tag: 'improved', text: 'Publishing destinations are now named Sanity connections (storagemoguls.ai / joedowns.ai) selectable per workspace — no more hardcoded config.' },
    ],
  },
  {
    version: '2026.07.14.1',
    title: 'Social syndication & the Social Library',
    date: 'July 14, 2026',
    items: [
      { tag: 'new', text: 'Turn any approved article into platform-native social content from the new "Social Media" section.' },
      { tag: 'new', text: 'Generate LinkedIn posts, plus X single posts or full threads — pick the format per channel.' },
      { tag: 'new', text: 'Branded carousel PDFs and single-image posters (PNG), rendered on-brand and ready to download.' },
      { tag: 'new', text: 'Brand Social Profiles — Joe Downs (personal) and Storage Moguls voices baked in, selectable per post.' },
      { tag: 'new', text: 'Social Library — browse every piece of generated content in one place and filter it by channel.' },
      { tag: 'improved', text: 'Generated social content is saved and restored per item, so nothing is lost when you revisit.' },
    ],
  },
  {
    version: '2026.07.02.1',
    title: 'Getting Started tour',
    date: 'July 2, 2026',
    items: [
      { tag: 'new', text: 'A guided "Getting Started" walkthrough explains every feature — where to go and how each thing works.' },
      { tag: 'new', text: 'Reopen the tour anytime from the "?" Help button in the header.' },
    ],
  },
  {
    version: '2026.07.02',
    title: 'Comments, @mentions & notification bell',
    date: 'July 2, 2026',
    items: [
      { tag: 'new', text: 'Comment threads on every library item — leave notes and feedback directly on drafts.' },
      { tag: 'new', text: '@mention teammates in comments — they receive a real-time bell notification (and email once configured).' },
      { tag: 'new', text: 'Notification bell in the header — unread badge, mark-read, admin announcements.' },
      { tag: 'improved', text: 'Draft viewer redesign — editor stays full height; cover image and comments no longer squeeze the draft.' },
      { tag: 'new', text: 'Users link moved to the sidebar bottom in workspace view.' },
    ],
  },
  {
    version: '2026.07.01',
    title: 'Transcript fix & Odin chat',
    date: 'July 1, 2026',
    items: [
      { tag: 'fixed', text: 'Transcript collection now uses Supadata API — no more YouTube IP-block errors.' },
      { tag: 'fixed', text: 'Odin image chat CORS issue resolved; chat responses working again.' },
    ],
  },
];
