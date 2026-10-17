import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Clock, ChevronRight, UserCheck, Undo2, Rocket,
  Loader2, Type, LayoutGrid, Image as ImageIcon, CheckCircle2, Globe, ShieldCheck,
} from 'lucide-react';
import { Button } from './ui/button';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';

// Lifecycle stages shown as the funnel strip. Counts are hero numbers in ink;
// the stage's status color appears only as a small accent (dataviz: text wears
// text tokens, status colors are reserved and never carry the number itself).
const STAGES = [
  { key: 'draft', label: 'Drafts', accent: 'bg-slate-400' },
  { key: 'finalized', label: 'Finalized', accent: 'bg-sky-500' },
  { key: 'in_review', label: 'In Review', accent: 'bg-amber-500' },
  { key: 'approved', label: 'Approved', accent: 'bg-emerald-500' },
  { key: 'published', label: 'Published', accent: 'bg-indigo-500' },
];

const STATUS_CHIP = {
  draft: 'text-slate-600 bg-slate-100 border-slate-200',
  finalized: 'text-sky-700 bg-sky-50 border-sky-200',
  in_review: 'text-amber-700 bg-amber-50 border-amber-200',
  approved: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  published: 'text-indigo-700 bg-indigo-50 border-indigo-200',
};

const KIND_META = {
  article: { label: 'Article', Icon: FileText },
  text: { label: 'Post', Icon: Type },
  carousel: { label: 'Carousel', Icon: LayoutGrid },
  poster: { label: 'Poster', Icon: ImageIcon },
};

const pieceLabel = (e) =>
  e.kind === 'article'
    ? 'Article'
    : `${e.channel === 'x' ? 'X' : 'LinkedIn'} ${KIND_META[e.kind]?.label || e.kind}`;

const timeAgo = (ms) => {
  if (!ms) return '';
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function WorkspaceDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [config, setConfig] = useState(null);
  const [data, setData] = useState(null);
  // Loading is derived: we're loading whenever the fetched workspace isn't the
  // routed one (covers both first load and workspace switches).
  const [loadedId, setLoadedId] = useState(null);
  const loading = loadedId !== id;

  useEffect(() => {
    Promise.all([
      authFetch(`${API_BASE}/api/workspaces`).then(r => r.json()),
      authFetch(`${API_BASE}/api/workspaces/${id}/dashboard`).then(r => r.json()),
    ])
      .then(([wsList, dash]) => {
        setConfig(Array.isArray(wsList) ? wsList.find(w => w.id === id) : null);
        setData(dash?.error ? null : dash);
      })
      .catch(err => console.error('[Dashboard] load failed:', err))
      .finally(() => setLoadedId(id));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!config || !data) {
    return <div className="py-6 text-sm text-slate-500">Could not load this workspace's dashboard.</div>;
  }

  // "Needs your attention" — personalized to whoever walked in.
  const reviewQueueForMe = data.canReviewHere
    ? data.inReview.filter(e => (e.reviewers || []).includes(user?.uid))
    : [];
  const sentBackToMe = data.changesRequested.filter(e => e.requestedBy === user?.uid);
  const awaitingPublish = isAdmin ? data.approvedUnpublished : [];
  const attentionCount = reviewQueueForMe.length + sentBackToMe.length + awaitingPublish.length;

  const total = data.totalItems;

  return (
    <div className="space-y-8 pb-10">
      {/* Identity band */}
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        style={{ borderLeft: `6px solid ${config.theme || '#2563eb'}` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{config.name}</h2>
            {config.description && (
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{config.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {config.archived && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Archived — generation is off
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                <Globe size={12} /> Publishes to {config.destination || 'Markdown'}
              </span>
              {config.requireReview && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <ShieldCheck size={12} /> Review required before publishing
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                <FileText size={12} /> {total} {total === 1 ? 'article' : 'articles'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                <LayoutGrid size={12} /> {data.socialCounts.total} social {data.socialCounts.total === 1 ? 'asset' : 'assets'}
              </span>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/workspace/${id}/pipeline`)}
            className="shrink-0 rounded-xl px-5 font-semibold shadow-sm text-white"
            style={{ backgroundColor: config.theme || '#2563eb' }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Content
          </Button>
        </div>
      </div>

      {/* Lifecycle funnel */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          Content lifecycle
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STAGES.map((s, i) => {
            // The funnel counts every piece of content in the workspace:
            // articles AND social assets (which carry their own lifecycle).
            // Social pieces have no 'published' state — 'approved' is terminal.
            const articleCount = data.articleCounts[s.key] ?? 0;
            const socialCount = data.socialCounts?.[s.key] ?? 0;
            const total = articleCount + socialCount;
            return (
              <button
                key={s.key}
                onClick={() => navigate(`/workspace/${id}/library`)}
                className="group relative rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${s.accent}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</span>
                </div>
                <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                  {total}
                </div>
                {total > 0 && (
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {articleCount} article{articleCount === 1 ? '' : 's'}
                    {socialCount > 0 && <> &middot; {socialCount} social</>}
                  </div>
                )}
                {i < STAGES.length - 1 && (
                  <ChevronRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-300 lg:block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Needs your attention */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          Needs your attention
          {attentionCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{attentionCount}</span>
          )}
        </h3>
        {attentionCount === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            All clear — nothing is waiting on you in this workspace.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {reviewQueueForMe.map((e, i) => (
              <button
                key={`rev-${i}`}
                onClick={() => navigate(e.link)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <UserCheck size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    Review requested: <span className="font-semibold">{e.title}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {pieceLabel(e)}{e.requestedByEmail ? ` — asked by ${e.requestedByEmail.split('@')[0]}` : ''}{e.note ? ` — "${e.note}"` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(e.requestedAt)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            ))}
            {sentBackToMe.map((e, i) => (
              <button
                key={`chg-${i}`}
                onClick={() => navigate(e.link)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Undo2 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    Changes requested: <span className="font-semibold">{e.title}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {pieceLabel(e)}{e.decidedByEmail ? ` — by ${e.decidedByEmail.split('@')[0]}` : ''}{e.comment ? ` — "${e.comment}"` : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            ))}
            {awaitingPublish.map((e, i) => (
              <button
                key={`pub-${i}`}
                onClick={() => navigate(e.link)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Rocket size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    Approved & ready to publish: <span className="font-semibold">{e.title}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">Article — one click from the website</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent work */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Latest articles */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock size={15} className="text-slate-400" /> Latest articles
            </h3>
            <Link to={`/workspace/${id}/library`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View library →
            </Link>
          </div>
          {data.recentItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              Nothing generated yet — hit <span className="font-medium text-slate-600">New Content</span> to forge the first draft.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
              {data.recentItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/workspace/${id}/library/item/${item.id}`)}
                  className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-slate-300">
                    {item.coverUrl ? (
                      <img src={`${API_BASE}${item.coverUrl}`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <FileText size={16} />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{item.title}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_CHIP[item.status] || STATUS_CHIP.draft}`}>
                    {(item.status || 'draft').replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Latest social assets */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LayoutGrid size={15} className="text-slate-400" /> Latest social assets
            </h3>
            <Link to={`/workspace/${id}/social-library`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View social library →
            </Link>
          </div>
          {data.recentSocials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              No social assets yet — open an article and syndicate it.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
              {data.recentSocials.map((s, i) => {
                const Meta = KIND_META[s.kind] || KIND_META.text;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(s.link)}
                    className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${s.channel === 'x' ? 'bg-black' : 'bg-[#0a66c2]'}`}>
                      <Meta.Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{s.title}</p>
                      <p className="text-xs text-slate-400">{pieceLabel(s)} · {timeAgo(s.generatedAt)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_CHIP[s.status] || STATUS_CHIP.approved}`}>
                      {(s.status || 'approved').replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
