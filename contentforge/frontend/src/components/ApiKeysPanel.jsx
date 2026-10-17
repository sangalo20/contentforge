import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Plus, Copy, Ban, Loader2, TerminalSquare } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import ConfirmDialog from './ui/confirm-dialog';
import { authFetch, API_BASE } from '../lib/api';

// Settings → API Keys (admin only): machine credentials for scripts and
// workbenches that call ContentForge outside the browser. The plaintext token
// is shown exactly once, at mint time — afterwards only the display handle
// (cfk_xxxxxxxx…xxxx) identifies a key.
export default function ApiKeysPanel({ workspaces = [] }) {
  const [keys, setKeys] = useState(null); // null = loading
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('creator');
  const [accessMode, setAccessMode] = useState('specific');
  const [accessIds, setAccessIds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [mintedToken, setMintedToken] = useState(null); // shown once after create
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const load = () =>
    authFetch(`${API_BASE}/api/api-keys`)
      .then((res) => res.json())
      .then((data) => setKeys(Array.isArray(data) ? data : []))
      .catch(() => setKeys([]));

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName('');
    setRole('creator');
    setAccessMode('specific');
    setAccessIds([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE}/api/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role,
          workspaceAccess: accessMode === 'all' ? 'all' : accessIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create the key');
      setMintedToken({ name: data.name, token: data.token });
      setShowCreate(false);
      resetForm();
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (key) => {
    try {
      const res = await authFetch(`${API_BASE}/api/api-keys/${key.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke the key');
      toast.success(`"${key.name}" revoked.`);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token)
      .then(() => toast.success('Key copied to clipboard.'))
      .catch(() => toast.error('Could not copy — select and copy it manually.'));
  };

  const accessLabel = (access) =>
    access === 'all'
      ? 'All workspaces'
      : (access || []).map((id) => workspaces.find((w) => w.id === id)?.name || id).join(', ') || 'No workspaces';

  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

  if (keys === null) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading API keys…
      </div>
    );
  }

  const active = keys.filter((k) => !k.revokedAt);
  const revoked = keys.filter((k) => k.revokedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <TerminalSquare size={18} className="text-slate-400" /> API keys
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Machine credentials for scripts and workbenches. Send one as{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">Authorization: Bearer cfk_…</code>{' '}
            against the same API the app uses. Keys carry a role and workspace scope, and can never manage users or other keys.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl px-4 font-semibold shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> New key
        </Button>
      </div>

      {/* One-time token reveal */}
      {mintedToken && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            “{mintedToken.name}” created — copy the key now. It will not be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-slate-800">
              {mintedToken.token}
            </code>
            <Button variant="outline" size="sm" onClick={() => copyToken(mintedToken.token)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMintedToken(null)}>Done</Button>
          </div>
        </div>
      )}

      {/* Active keys */}
      {active.length === 0 && !mintedToken ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
          <KeyRound className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No API keys yet. Create one to call ContentForge from a script or workbench.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {active.map((k, i) => (
            <div key={k.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-800">{k.name}</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">{k.display}</code>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {k.role} · {accessLabel(k.workspaceAccess)} · created {fmtDate(k.createdAt)} by {k.createdBy || '—'} · last used {fmtDate(k.lastUsedAt)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setConfirmRevoke(k)}>
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Revoke
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Revoked keys, kept visible as the audit trail */}
      {revoked.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Revoked</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 opacity-60">
            {revoked.map((k, i) => (
              <div key={k.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="truncate text-sm text-slate-600 line-through">{k.name}</span>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-400">{k.display}</code>
                <span className="ml-auto text-xs text-slate-400">revoked {fmtDate(k.revokedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">New API key</h2>
              <p className="text-xs text-slate-500">The key is shown once after creation — store it somewhere safe.</p>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="key-name" className="text-slate-700">Name</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sam's workbench"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[['creator', 'Creator', 'Generate and edit drafts'], ['admin', 'Admin', 'Full pipeline, incl. publish']].map(([r, label, hint]) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-lg border px-3 py-2 text-left transition-colors ${role === r ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className={`block text-sm font-medium ${role === r ? 'text-blue-700' : 'text-slate-700'}`}>{label}</span>
                      <span className="block text-[11px] text-slate-500">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Workspace access</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[['all', 'Entire app'], ['specific', 'Specific workspaces']].map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAccessMode(m)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${accessMode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {accessMode === 'specific' && (
                  <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-2">
                    {workspaces.length === 0 ? (
                      <p className="px-2 py-3 text-xs text-slate-400">No workspaces available.</p>
                    ) : (
                      workspaces.map((w) => (
                        <label key={w.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={accessIds.includes(w.id)}
                            onChange={() =>
                              setAccessIds((ids) => (ids.includes(w.id) ? ids.filter((x) => x !== w.id) : [...ids, w.id]))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                          />
                          <span className="text-slate-700">{w.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating || !name.trim()}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Create key
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Revoke API key"
        message={confirmRevoke ? `Revoke "${confirmRevoke.name}"? Anything using this key stops working immediately. This cannot be undone.` : ''}
        confirmLabel="Revoke key"
        icon={Ban}
        onConfirm={async () => { await handleRevoke(confirmRevoke); setConfirmRevoke(null); }}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  );
}
