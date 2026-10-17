import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, UserCheck, Undo2, ChevronRight, FileText, Type, Image as ImageIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { authFetch, API_BASE } from '../lib/api';

const KIND_ICON = { article: FileText, text: Type, carousel: LayoutGrid, poster: ImageIcon };
const pieceLabel = (e) =>
  e.kind === 'article' ? 'Article' : `${e.channel === 'x' ? 'X' : 'LinkedIn'} ${e.kind === 'text' ? 'post' : e.kind}`;

export default function WorkspacesDashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  // Cross-workspace to-do list: reviews waiting on you + your pieces sent back.
  const [attention, setAttention] = useState({ entries: [], countsByWorkspace: {} });

  useEffect(() => {
    authFetch(`${API_BASE}/api/workspaces`)
      .then(res => res.json())
      .then(data => {
        setWorkspaces(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch workspaces", err);
        setLoading(false);
      });
    authFetch(`${API_BASE}/api/attention`)
      .then(res => res.json())
      .then(data => { if (data && Array.isArray(data.entries)) setAttention(data); })
      .catch(() => {});
  }, []);

  const attentionWorkspaces = Object.keys(attention.countsByWorkspace).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Needs your attention — the first thing you see at login. */}
      {attention.entries.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm">
          <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3">
            <UserCheck size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              Needs your attention — {attention.entries.length} {attention.entries.length === 1 ? 'item' : 'items'}
              {attentionWorkspaces > 1 && ` across ${attentionWorkspaces} workspaces`}
            </p>
          </div>
          <div className="divide-y divide-amber-100/70 bg-white/70">
            {attention.entries.slice(0, 8).map((e, i) => {
              const Icon = KIND_ICON[e.kind] || FileText;
              const isReview = e.type === 'review_requested';
              return (
                <button
                  key={i}
                  onClick={() => navigate(e.link)}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-white"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isReview ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isReview ? <UserCheck size={15} /> : <Undo2 size={15} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {isReview ? 'Review requested' : 'Changes requested'}: <span className="font-semibold">{e.title}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      <Icon size={11} className="mr-1 inline-block align-[-1px]" />
                      {pieceLabel(e)}
                      {isReview && e.requestedByEmail ? ` — asked by ${e.requestedByEmail.split('@')[0]}` : ''}
                      {!isReview && e.comment ? ` — "${e.comment}"` : ''}
                    </p>
                  </div>
                  <span
                    className="hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex"
                    style={{ backgroundColor: `${e.workspaceTheme}1a`, color: e.workspaceTheme }}
                  >
                    {e.workspaceName}
                  </span>
                  <ChevronRight size={15} className="shrink-0 text-slate-300" />
                </button>
              );
            })}
            {attention.entries.length > 8 && (
              <p className="px-5 py-2.5 text-xs text-slate-500">
                +{attention.entries.length - 8} more — open the workspaces below to see everything.
              </p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-slate-500">Loading workspaces...</div>
      ) : (() => {
        const active = workspaces.filter(ws => !ws.archived);
        const archived = workspaces.filter(ws => ws.archived);
        const wsCard = (ws) => (
          <button
            key={ws.id}
            data-tour="ws-card"
            onClick={() => navigate(`/workspace/${ws.id}`)}
            className={`group flex flex-col rounded-2xl p-6 text-left border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${
              ws.archived
                ? 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
                : 'bg-blue-50/50 border-blue-100/50 hover:border-blue-200 hover:bg-blue-50'
            }`}
          >
            <div className="mb-5">
              <div
                className="flex size-12 items-center justify-center rounded-full mb-4"
                style={{ background: `${ws.theme}1a` }}
              >
                <LayoutGrid size={22} color={ws.archived ? '#94a3b8' : ws.theme} />
              </div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                {ws.name}
                {ws.archived && (
                  <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Archived</span>
                )}
                {attention.countsByWorkspace[ws.id] > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    {attention.countsByWorkspace[ws.id]} waiting
                  </span>
                )}
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-slate-600 mb-6 flex-grow">{ws.description}</p>

            <div className="mt-auto flex items-center justify-between w-full">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={ws.archived
                  ? { backgroundColor: '#f1f5f9', color: '#64748b' }
                  : { backgroundColor: `${ws.theme}1a`, color: ws.theme }}
              >
                {ws.archived ? 'View Workspace' : 'Open Workspace'}
              </div>
              <Badge variant="outline" className="text-xs font-medium text-slate-500 border-slate-200 bg-white">
                {ws.destination}
              </Badge>
            </div>
          </button>
        );
        return (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {active.map(wsCard)}
            </div>
            {archived.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Archived ({archived.length})
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {archived.map(wsCard)}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
