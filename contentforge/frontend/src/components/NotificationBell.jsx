import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Megaphone, CircleAlert, Image as ImageIcon, FileText, Loader2, History } from 'lucide-react';
import { authFetch, API_BASE } from '../lib/api';

const POLL_INTERVAL_MS = 45000;

const typeMeta = {
  success: { Icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  image: { Icon: ImageIcon, color: 'text-violet-600', bg: 'bg-violet-50' },
  error: { Icon: CircleAlert, color: 'text-red-600', bg: 'bg-red-50' },
  announcement: { Icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
  mention: { Icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
};

function timeAgo(ms) {
  if (!ms) return '';
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/notifications`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, []);

  useEffect(() => {
    // Schedule the initial fetch instead of calling into setState-bearing
    // code synchronously from the effect body (react-hooks/set-state-in-effect).
    const initial = setTimeout(load, 0);
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => { clearTimeout(initial); clearInterval(id); };
  }, [load]);

  useEffect(() => {
    function onClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnread(prev => Math.max(0, prev - 1));
    try {
      await authFetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    try {
      await authFetch(`${API_BASE}/api/notifications/read-all`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const onItemClick = (n) => {
    if (!n.read) markRead(n.id);
    // Only follow in-app (client-route) links; never navigate to API URLs.
    if (n.link && n.link.startsWith('/') && !n.link.startsWith('/api/')) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const hasUnread = items.some(n => !n.read);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggle}
        title="Notifications"
        className="relative flex items-center justify-center rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new Event('open-changelog'));
                }}
                title="View update history"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <History className="h-3.5 w-3.5" /> Log
              </button>
              {hasUnread && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                <Bell className="h-8 w-8" />
                <span className="text-sm">No notifications yet</span>
              </div>
            ) : (
              items.map(n => {
                const meta = typeMeta[n.type] || typeMeta.success;
                const { Icon } = meta;
                return (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${n.read ? '' : 'bg-blue-50/40'}`}
                  >
                    <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${n.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                          {n.title}
                        </span>
                        {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-500" />}
                      </span>
                      {n.message && <span className="mt-0.5 block text-xs text-slate-500 line-clamp-2">{n.message}</span>}
                      <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
