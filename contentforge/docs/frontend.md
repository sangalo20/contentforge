# Frontend

**Audience:** Engineers.  
**Purpose:** Component map, routing structure, state conventions, and UI design language.

---

## Stack

| Library | Version | Role |
| --- | --- | --- |
| React | 19 | UI framework |
| Vite | 6 | Build tool and dev server |
| Tailwind CSS | v4 | Styling (via `@tailwindcss/vite`) |
| `@tailwindcss/typography` | 0.5 | `prose` classes for rendered Markdown |
| React Router DOM | v7 | Client-side routing |
| react-hot-toast | 2 | Toast notifications |
| react-markdown + remark-gfm | 10 / 4 | Markdown rendering in chat |
| lucide-react | 1 | Icon set |
| `@uiw/react-md-editor` | 4 | Draft editor (LibraryItemViewer) |

---

## Routing

All routes are defined in `src/App.jsx`:

```
/                                   WorkspacesDashboard
/workspace/new                      WorkspaceEditor (create)
/workspace/:id                      WorkspaceLayout (shell)
  /                                   WorkspaceDashboard (workspace home)
  /pipeline                           PipelineTrigger (The Forge)
  /library                            WorkspaceLibrary (cards grid)
  /social-library                     SocialLibrary (flattened social pieces)
  /library/item/:itemId               LibraryItemViewer (detail)
  /library/item/:itemId/social/:ch?   SocialMediaSyndication (social studio)
  /social/:channel?                   SocialMediaSyndication (original-idea lane)
  /settings                           WorkspaceEditor (edit)
/brand-studio                       BrandStudio (full-bleed design studio, lazy-loaded)
/brand-studio/kit                   BrandKitSheet (merch line sheet, scrolling page)
/settings                           UserManagement (Settings: Team / Trash / Usage / API Keys / Integrations tabs)
/login · /accept-invite             Login, AcceptInvite (public)
```

`WorkspaceLayout` renders the sidebar navigation and the page header, then delegates the body via `<Outlet>`.

---

## Component map

| Component | File | Responsibility |
| --- | --- | --- |
| `App` | `App.jsx` | Router setup, `<Toaster>`, auth-protected route tree |
| `WorkspacesDashboard` | `WorkspacesDashboard.jsx` | Home screen; lists all workspaces + attention strip |
| `WorkspaceDashboard` | `WorkspaceDashboard.jsx` | A workspace's home tab (stats, recent items) |
| `WorkspaceLayout` | `WorkspaceLayout.jsx` | Sidebar nav, breadcrumb header; fetches workspace config |
| `PipelineTrigger` | `PipelineTrigger.jsx` | The Forge: Source Composer (youtube/url/text/github/code/vault), SSE progress |
| `WorkspaceLibrary` | `WorkspaceLibrary.jsx` | Library grid; card per item, cover image as thumbnail |
| `SocialLibrary` | `SocialLibrary.jsx` | Flattened social pieces (posts/carousels/posters) with delete/archive |
| `LibraryItemViewer` | `LibraryItemViewer.jsx` | Full item view: Markdown editor, finalize, review, publish, cover |
| `SocialMediaSyndication` | `pages/SocialMediaSyndication.jsx` | Social studio: generate/revise/approve per channel; original-idea lane |
| `StudioChat` / `VaultScoutChat` | `StudioChat.jsx`, `VaultScoutChat.jsx` | SSE chats with Odin (Loki studio; Mimir vault scout) |
| `ImageChatModal` | `ImageChatModal.jsx` | SSE chat with Odin for cover image ideation + generation |
| `SourceVault` | `SourceVault.jsx` | Banked transcripts: staging, channel sync, usage ledger |
| `CommentThread` / `SubmitReviewModal` / `NotificationBell` | — | Comments + @mentions, review submission, bell feed |
| `WorkspaceEditor` | `WorkspaceEditor.jsx` | Create/edit workspace (Config & Persona screen) |
| `UserManagement` | `UserManagement.jsx` | Settings page shell: Team, Workspace Trash, AI Usage, **API Keys**, Integrations tabs |
| `ApiKeysPanel` | `ApiKeysPanel.jsx` | Mint/list/revoke `cfk_` API keys (one-time token reveal, workspace scoping) |
| `IntegrationsPanel` / `UsageCost` | — | Per-user GitHub PAT; AI usage & cost dashboard |
| `GlobalHeader` | `GlobalHeader.jsx` | Top nav bar (non-workspace pages only) |
| `Sidebar` | `Sidebar.jsx` | Left nav within a workspace |
| `ui/*` | `components/ui/` | Shared primitives: Button, Card, Badge, Input, Label, Select, Textarea |
| `BrandStudio` | `brand-studio/BrandStudio.jsx` | On-brand graphics studio: brand picker, ~25 templates in 7 groups (150+ designs via per-template Design pickers), PNG/SVG/WebM output — see [`brand-studio.md`](brand-studio.md) |

### Brand Studio (`src/brand-studio/`)

A self-contained module (ported from a borrowed Prescott-built design studio, fully re-branded) mounted at `/brand-studio`. Full subsystem doc: [`brand-studio.md`](brand-studio.md). Structure:

- `brands.js` — the **brand registry**: one record per Belrose brand (Storage Moguls first/default, then Successful Idiots, Joe Downs, StorPro, Belrose Group) carrying palettes, font stacks, wordmark, URL, tagline, and per-template default copy (`buildDefaults`). Every brand fact templates render flows from here.
- `registry.js` — template registry; each row carries its React component (or a `motion` kind), group, and an optional forced canvas resolution.
- `templates.jsx` — the static templates (~23, plus 2 motion). Pure functions of `{ d, brand }`; per-template Design pickers (`VARIANT_SETS`) multiply them into 150+ distinct designs.
- `MotionCanvas.jsx` — canvas animation engine (animated lower third, logo sting); exports WebM via `MediaRecorder` and 30 fps alpha PNG sequences via jszip.
- `swag.jsx` — the Brand Kit: original flat garment/product SVG illustrations (tee, hoodie, cap, mug, notebook, bottle) with per-product print windows carrying the identity (mark/lockup/seal/tagline/slats), auto-inked for contrast against the colorway.
- `atoms.jsx` / `helpers.js` — form controls, `LogoImg` (falls back to a typographic wordmark until logo files exist in `public/logos/<brandId>/`), portrait stylizer, `@imgly/background-removal` cutouts (model fetched from CDN on first use).
- `brand-studio.css` — self-hosted brand fonts (`public/fonts/*.woff2`) and studio chrome utilities.

Exports are client-side (`html-to-image`); AI backgrounds come from `POST /api/brand-studio/generate-image` (Vertex Imagen, per-brand style prompts — see the API reference).

**Deep-link prefill (forge → studio bridge):** `/brand-studio` accepts query params — `template` (registry id), `brand` (registry id; coming-soon brands are refused), `variant`, and any content field (`title`, `subtitle`, `body`, `metric`, `author`, `role`, `date`, `url`, `features`, `partnerName`, `ctaUrl`, `dataJson`). Params overlay the brand's copy seeds and a deep-linked visit lands on the Content tab. `LibraryItemViewer` uses this via the palette-icon "Create Visual" menu (Blog Cover / Quote Card / Big Number / Announcement prefilled from the article title), opening the studio in a new tab.

---

## Key data flows

### Library loading
`WorkspaceLibrary` fetches `GET /api/library/:workspaceId` on mount and stores all items in local state. Cover images display if `item.coverImage?.url` is set — the URL points to the backend proxy route.

### Item viewer
`LibraryItemViewer` fetches the single item via `GET /api/library/item/:itemId`. `draftContent` (full Markdown) is passed down to both the editor and `ImageChatModal` so Odin can read the full blog when proposing cover concepts.

### ImageChatModal SSE
The modal opens a `fetch` POST to the backend proxy `POST /api/odin/chat/stream` (the browser never calls Odin directly — Odin is Cloud Run IAM-locked). It reads the SSE body via `response.body.getReader()` and buffers `data:` lines. Events:
- `text` — appends tokens to the last assistant bubble
- `status` — shows a spinner pill ("Delegating to Hermes…")
- `image` — sets `imageUrl` on the assistant bubble, showing the preview + Approve button
- `error` — appends an error note to the bubble

On approve, `handleApproveImage(url)` calls `PUT /api/library/:id/cover`. Toast notifications (`react-hot-toast`) report loading/success/error.

### Workspace save (Config & Persona)
`WorkspaceEditor.handleSubmit` calls `PUT /api/workspaces/:id`. On success when editing, it stays on the page with a `toast.success`. On creation, it navigates to `/`.

---

## UI design language

| Token | Value | Usage |
| --- | --- | --- |
| Background | `slate-50` | Page background |
| Surface | `white` with `border-slate-200` | Cards, modals, inputs |
| Primary accent | `blue-600` | Buttons, active states, user chat bubbles |
| Secondary text | `slate-500` | Labels, hints |
| Success | `green-*` | Approved badge, success toast |
| Error | `rose-*` | Error badge, error toast |

**Chat bubbles** (ImageChatModal, mirroring OdinChatDrawer):
- Agent bubble: `bg-white border-slate-200 rounded-tl-none` with `prose prose-sm prose-slate`
- User bubble: `bg-blue-600 text-white rounded-tr-none` with `prose prose-sm prose-invert`
- Typing indicator: 3 bouncing dots while `isLoading` and no streamed assistant bubble yet
- Status pill: `bg-blue-50 text-blue-600` with spinning loader icon

**Library card thumbnail**: `h-32` header area — cover image as `object-cover` when `item.coverImage?.url` is set, falling back to a deterministic mesh-gradient (`mesh-bg-1` through `mesh-bg-4` based on item ID hash).

---

## Adding a new page / route

1. Create `src/components/MyPage.jsx`.
2. Add a `<Route>` in `src/App.jsx` (inside the workspace `<Route>` if it belongs there).
3. If it needs a sidebar link, add it to `WorkspaceLayout.jsx`'s nav section.
4. Data fetching: use plain `fetch` to `http://localhost:3005/api/...`, handle loading/error state locally.
5. Notifications: import `toast` from `react-hot-toast`.
