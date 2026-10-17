import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Image as ImageIcon, LayoutGrid, Type, Calendar, Share2, Loader2, Lightbulb, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from './ui/badge';
import ConfirmDialog from './ui/confirm-dialog';
import { authFetch, API_BASE } from '../lib/api';

// Fetches an auth-protected poster PNG and renders it as a thumbnail.
function PosterThumb({ itemId, channel }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let alive = true;
    authFetch(`${API_BASE}/api/socials/poster/item/${itemId}/${channel}`)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('failed'))))
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [itemId, channel]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-white/70">
        <ImageIcon size={28} />
      </div>
    );
  }
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center text-white/70">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }
  return <img src={url} alt="Poster" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />;
}

const CHANNELS = [
  { id: 'all', label: 'All' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
];

const TYPE_META = {
  text: { label: 'Post', icon: Type },
  carousel: { label: 'Carousel', icon: LayoutGrid },
  poster: { label: 'Poster', icon: ImageIcon },
};

function ChannelIcon({ channel, size = 14 }) {
  // lucide-react dropped brand icons; render simple brand-consistent glyphs.
  if (channel === 'linkedin') return <span style={{ fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: '-0.5px' }}>in</span>;
  return <span style={{ fontWeight: 800, fontSize: size + 1, lineHeight: 1 }}>X</span>;
}

export default function SocialLibrary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  // Loading is derived: we're loading whenever the fetched workspace isn't the
  // routed one (covers both first load and workspace switches).
  const [loadedFor, setLoadedFor] = useState(null);
  const loading = loadedFor !== id;
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');
  // Pending confirmation: { action: 'delete' | 'archive', entry }. Restore
  // needs no confirm — it only brings content back.
  const [confirm, setConfirm] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    authFetch(`${API_BASE}/api/social-library/${id}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Failed to fetch');
        setEntries(data);
        setLoadedFor(id);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoadedFor(id);
      });
  }, [id]);

  // Archived assets live behind their own filter; channel views only count
  // and show active content.
  const active = entries.filter((e) => !e.archived);
  const archivedEntries = entries.filter((e) => e.archived);
  const counts = active.reduce((acc, e) => {
    acc.all = (acc.all || 0) + 1;
    acc[e.channel] = (acc[e.channel] || 0) + 1;
    return acc;
  }, {});

  const visible = filter === 'archived'
    ? archivedEntries
    : (filter === 'all' ? active : active.filter((e) => e.channel === filter));

  const postAction = async (path, body) => {
    const res = await authFetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'The request failed.');
    return data;
  };

  const handleDelete = async (e) => {
    setBusyId(e.id);
    try {
      await postAction('/api/socials/delete', { itemId: e.itemId, channel: e.channel, kind: e.type });
      setEntries((prev) => prev.filter((x) => x.id !== e.id));
      toast.success('Deleted.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const handleArchive = async (e, archived) => {
    setBusyId(e.id);
    try {
      await postAction('/api/socials/archive', { itemId: e.itemId, channel: e.channel, kind: e.type, archived });
      setEntries((prev) => {
        const next = prev.map((x) => (x.id === e.id ? { ...x, archived } : x));
        // Restoring the last archived asset empties that view; jump back.
        if (!archived && filter === 'archived' && !next.some((x) => x.archived)) setFilter('all');
        return next;
      });
      toast.success(archived ? 'Archived — find it under the Archived filter.' : 'Restored.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const typeLabel = (e) => (TYPE_META[e.type] || TYPE_META.text).label.toLowerCase();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading generated content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-rose-600 glass-card p-8 rounded-2xl">
          <p className="text-lg font-semibold mb-2">Could not load content</p>
          <p className="text-sm opacity-80">Failed to load the social media library. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'delete'
          ? `Delete this ${confirm ? typeLabel(confirm.entry) : 'asset'}?`
          : `Archive this ${confirm ? typeLabel(confirm.entry) : 'asset'}?`}
        message={confirm?.action === 'delete'
          ? 'It is removed permanently. This cannot be undone.'
          : `It disappears from the library but stays recoverable under the Archived filter.${confirm?.entry?.approverEmail ? ` Approved by ${confirm.entry.approverEmail}.` : ''}`}
        confirmLabel={confirm?.action === 'delete' ? 'Delete' : 'Archive'}
        icon={confirm?.action === 'delete' ? Trash2 : Archive}
        danger={confirm?.action === 'delete'}
        busy={!!confirm && busyId === confirm.entry.id}
        onConfirm={() => (confirm.action === 'delete' ? handleDelete(confirm.entry) : handleArchive(confirm.entry, true))}
        onCancel={() => setConfirm(null)}
      />
      {/* Header + channel filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Social Media Library</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Every piece of generated content, tagged by channel.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                filter === c.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {c.id !== 'all' && <ChannelIcon channel={c.id} size={13} />}
              {c.label}
              <span className="text-xs opacity-60">{counts[c.id] || 0}</span>
            </button>
          ))}
          {archivedEntries.length > 0 && (
            <button
              onClick={() => setFilter('archived')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                filter === 'archived'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <Archive size={13} />
              Archived
              <span className="text-xs opacity-60">{archivedEntries.length}</span>
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center text-slate-500 dark:text-slate-400 glass-card p-8 rounded-2xl">
            <Share2 className="mx-auto mb-4 opacity-50" size={32} />
            <p className="text-lg">{filter === 'archived' ? 'Nothing archived.' : 'No generated content yet.'}</p>
            <p className="text-sm opacity-80 mt-1">
              {filter === 'archived' ? 'Archived approved assets will show up here.' : 'Draft posts, carousels, or posters to see them here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((e, index) => {
            const meta = TYPE_META[e.type] || TYPE_META.text;
            const Icon = meta.icon;
            const isX = e.channel === 'x';
            const dateStr = e.generatedAt ? new Date(e.generatedAt).toLocaleDateString() : '';
            return (
              <div
                key={e.id}
                onClick={() => navigate(`/workspace/${id}/library/item/${e.itemId}/social/${e.channel}?kind=${e.type}`)}
                className="glass-card rounded-2xl cursor-pointer group overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both flex flex-col"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Preview area */}
                <div className={`relative h-40 w-full overflow-hidden ${isX ? 'bg-black' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
                  {e.type === 'poster' && e.fileId ? (
                    <PosterThumb itemId={e.itemId} channel={e.channel} />
                  ) : e.type === 'text' ? (
                    <div className="absolute inset-0 p-4 overflow-hidden">
                      <p className="text-white/90 text-sm leading-snug line-clamp-6 whitespace-pre-wrap">{e.preview || 'Text post'}</p>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/80">
                      <div className="text-center">
                        <LayoutGrid size={30} className="mx-auto mb-1" />
                        <span className="text-xs font-medium">{e.slideCount} slides</span>
                      </div>
                    </div>
                  )}
                  {/* Channel badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md ${isX ? 'bg-black/60 text-white' : 'bg-white/90 text-blue-700'}`}>
                      <ChannelIcon channel={e.channel} size={12} />
                      {isX ? 'X' : 'LinkedIn'}
                    </span>
                  </div>
                  {/* Type badge */}
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="backdrop-blur-md bg-black/40 border-0 text-white/90 flex items-center gap-1">
                      <Icon size={12} /> {meta.label}
                    </Badge>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {e.type === 'poster' ? (e.headline || 'Poster') : e.articleTitle}
                  </h3>
                  {e.type !== 'poster' && (
                    e.sourceType === 'original' ? (
                      <p className="flex items-center gap-1 text-xs font-medium text-amber-600">
                        <Lightbulb size={11} /> Original idea
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 line-clamp-1 italic">From: {e.articleTitle}</p>
                    )
                  )}
                  <div className="mt-auto pt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar size={13} className="opacity-70" />
                    <span>{dateStr}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {e.function && <span className="capitalize rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5">{e.function}</span>}
                      {/* Lifecycle-aware action, always behind the shared confirm
                          dialog: drafts/finalized delete; approved archives (approver
                          or admin — the server enforces it); restore is direct since
                          it only brings content back. In-review pieces are managed
                          via the review. */}
                      {(e.status === 'draft' || e.status === 'finalized') && (
                        <button
                          aria-label="Delete"
                          title="Delete"
                          disabled={busyId === e.id}
                          onClick={(ev) => { ev.stopPropagation(); setConfirm({ action: 'delete', entry: e }); }}
                          className="flex items-center rounded-md px-1.5 py-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                        >
                          {busyId === e.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      )}
                      {e.status === 'approved' && (
                        <button
                          aria-label={e.archived ? 'Restore' : 'Archive'}
                          title={e.archived
                            ? 'Restore to the library'
                            : `Archive${e.approverEmail ? ` (approved by ${e.approverEmail})` : ''}`}
                          disabled={busyId === e.id}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (e.archived) handleArchive(e, false);
                            else setConfirm({ action: 'archive', entry: e });
                          }}
                          className="flex items-center rounded-md px-1.5 py-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                        >
                          {busyId === e.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : e.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
