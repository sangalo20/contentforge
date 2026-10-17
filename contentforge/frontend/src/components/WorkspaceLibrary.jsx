import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Layers, Trash2 } from 'lucide-react';
import { sourcesOf, sourceSummary, metaOf } from '../lib/sourceMeta';
import toast from 'react-hot-toast';
import { Badge } from './ui/badge';
import ConfirmDialog from './ui/confirm-dialog';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';

export default function WorkspaceLibrary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmItem, setConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    authFetch(`${API_BASE}/api/library/${id}`)
      .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          throw new Error(data.error || 'Failed to fetch');
        }
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setItems(null); // use null to signify error state
        setLoading(false);
      });
  }, [id]);

  const getMeshClass = (id) => {
    const chars = id.split('');
    const sum = chars.reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `mesh-bg-${(sum % 4) + 1}`;
  };

  const handleDelete = async (e, item) => {
    e.stopPropagation();
    setConfirmItem(item);
  };

  const runDelete = async () => {
    const item = confirmItem;
    setDeleting(true);
    const toastId = toast.loading('Deleting article...');
    try {
      const res = await authFetch(`${API_BASE}/api/library/${item.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== item.id));
        toast.success('Article deleted', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to delete', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete', { id: toastId });
    } finally {
      setDeleting(false);
      setConfirmItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading library items...</p>
        </div>
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-rose-600 glass-card p-8 rounded-2xl">
          <p className="text-lg font-semibold mb-2">Database Error</p>
          <p className="text-sm opacity-80">
            Failed to load the library. This is likely because Firestore requires a composite index.
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-slate-500 dark:text-slate-400 glass-card p-8 rounded-2xl">
          <BookOpen className="mx-auto mb-4 opacity-50" size={32} />
          <p className="text-lg">No drafts generated yet.</p>
          <p className="text-sm opacity-80 mt-1">Run the content pipeline to see your drafts here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ConfirmDialog
        open={!!confirmItem}
        title="Delete this article?"
        message="The draft, its social content, and its cover image reference are removed permanently. This cannot be undone."
        confirmLabel="Delete article"
        busy={deleting}
        onConfirm={runDelete}
        onCancel={() => setConfirmItem(null)}
      />
      {items.map((item, index) => {
        const dateObj = item.createdAt?._seconds ? new Date(item.createdAt._seconds * 1000) : new Date();
        const itemSources = sourcesOf(item);

        return (
          <div
            key={item.id}
            onClick={() => navigate(`/workspace/${id}/library/item/${item.id}`)}
            className={`glass-card rounded-2xl cursor-pointer group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Thumbnail / Header Area */}
            <div className={`h-32 w-full ${getMeshClass(item.id)} relative overflow-hidden rounded-t-2xl`}>
              {item.coverImage?.url && (
                <img
                  src={`${API_BASE}${item.coverImage.url}`}
                  alt="Cover"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              {isAdmin && (
                <button
                  onClick={(e) => handleDelete(e, item)}
                  title="Delete article"
                  className="absolute top-3 right-3 z-10 rounded-full bg-black/40 p-2 text-white/90 backdrop-blur-md opacity-0 transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <Badge
                  variant="secondary"
                  className={`backdrop-blur-md bg-black/40 border-0 ${
                    ['approved', 'published'].includes(item.status) ? 'text-green-400'
                      : item.status === 'in_review' ? 'text-amber-300'
                      : item.status === 'finalized' ? 'text-sky-300'
                      : 'text-white/90'
                  }`}
                >
                  {(item.status === 'pending_approval' ? 'draft' : (item.status || 'draft')).replace('_', ' ')}
                </Badge>
                {itemSources.length > 0 && (
                  <Badge variant="outline" className="backdrop-blur-md bg-black/40 border-0 text-white/90 flex items-center gap-1.5">
                    {itemSources.length > 1 && <Layers size={12} />}
                    {/* One icon per distinct source type, in stack order. */}
                    {[...new Set(itemSources.map((s) => s.type))].slice(0, 4).map((type) => {
                      const Icon = metaOf(type).icon;
                      return <Icon key={type} size={12} />;
                    })}
                    {itemSources.length > 1 && <span>{itemSources.length}</span>}
                  </Badge>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.draft ? (item.draft.match(/^(?:#+)\s+(.+?)(?:\n|$)/m)?.[1]?.replace(/(\*\*|\*)/g, '').trim() || 'Untitled Article') : 'Generating...'}
              </h3>
              
              <div className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1 italic border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                Source: {item.titles && item.titles.length > 0
                  ? item.titles.join(' + ')
                  : (item.title || `Draft generated on ${dateObj.toLocaleDateString()}`)}
              </div>
              
              <div className="mt-auto pt-2 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="opacity-70" />
                  <span>{dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="opacity-70" />
                  <span className="truncate">
                    From: <span className="text-blue-600 dark:text-blue-400">{sourceSummary(itemSources) || 'Unknown source'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
