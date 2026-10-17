import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FolderGit2, Loader2, CheckCircle2, Unplug } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import ConfirmDialog from './ui/confirm-dialog';
import { authFetch, API_BASE } from '../lib/api';

// Settings → Integrations: YOUR connections. GitHub is per-user by design —
// everyone connects their own account (personal or work), and the forge acts
// as them: their repos in the picker, their token for ingestion. Tokens are
// stored server-side; the UI only ever sees a masked hint.
export default function IntegrationsPanel() {
  const [status, setStatus] = useState(null); // null = loading
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = () =>
    authFetch(`${API_BASE}/api/integrations/github`)
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, source: null }));

  useEffect(() => { load(); }, []);

  const handleConnect = async () => {
    if (!token.trim()) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/api/integrations/github`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect');
      setToken('');
      setStatus(data);
      toast.success(`GitHub connected as ${data.login}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/integrations/github`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disconnect');
      setStatus(data);
      toast.success('GitHub disconnected.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDisconnecting(false);
      setConfirmDisconnect(false);
    }
  };

  if (!status) {
    return (
      <div className="flex h-40 items-center justify-center text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    // Fill the settings content column like the other tabs (Team table etc.);
    // future integration cards stack below the GitHub one at the same width.
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect your GitHub?"
        message="Your repo picker and private-repo ingestion stop working until you connect a new token. Public repo URLs keep working."
        confirmLabel="Disconnect"
        icon={Unplug}
        busy={disconnecting}
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-violet-600 shadow-sm">
            <FolderGit2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">GitHub</h3>
            <p className="text-xs text-slate-500">Your account — powers your repo picker and private-repo ingestion in the Source Composer.</p>
          </div>
          {status.configured && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={13} /> {status.login || 'Connected'} {status.hint}
            </span>
          )}
        </div>

        <div className="space-y-4 p-6">
          {status.configured ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Connected as <strong>{status.login || 'unknown'}</strong> ({status.hint}). Content you generate
                from GitHub sources uses this connection. Replace the token below or disconnect.
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDisconnect(true)}
                className="shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Unplug size={15} className="mr-1.5" /> Disconnect
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Connect your own GitHub (personal or work): create a <strong>fine-grained personal access
              token</strong> (GitHub → Settings → Developer settings) with read-only <strong>Contents</strong> permission
              on the repos you want the forge to read, and paste it here. It is validated, stored
              server-side, and never shown again. Without a connection, public repo URLs still work.
            </p>
          )}

          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="github_pat_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={saving}
              autoComplete="off"
            />
            <Button type="button" onClick={handleConnect} disabled={saving || !token.trim()} className="shrink-0 min-w-[110px]">
              {saving ? <Loader2 size={15} className="animate-spin" /> : status.configured ? 'Replace token' : 'Connect'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
