import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layers, Search, CheckSquare, Square, RefreshCw, Loader2, Plus, Trash2, Video, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { metaOf } from '../lib/sourceMeta';

// The Source Vault: the org-wide ledger of reusable source material and where
// each piece was used — the product version of the old hand-maintained
// transcript_usage_log.md. Composing FROM the vault happens in each
// workspace's Forge composer ("From vault"); this page is the ledger:
// browse, stage new URLs, watch channels, sync.
export default function SourceVault() {
  const { id: workspaceId } = useParams();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null); // { entries, channels, lastSyncAt, syncStale }
  const [filter, setFilter] = useState('all'); // all | unused | used
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null); // entry id with text preview open
  const [previewText, setPreviewText] = useState({});
  const [stageUrls, setStageUrls] = useState('');
  const [staging, setStaging] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [channelDraft, setChannelDraft] = useState('');
  const [savingChannels, setSavingChannels] = useState(false);

  const load = useCallback(() =>
    authFetch(`${API_BASE}/api/vault?workspaceId=${workspaceId}`)
      .then((res) => res.json())
      .then((d) => { setData(d); return d; })
      .catch(() => { toast.error('Failed to load the Source Vault'); return null; }), [workspaceId]);

  const runSync = useCallback(async (auto = false) => {
    setSyncing(true);
    try {
      const res = await authFetch(`${API_BASE}/api/vault/sync`, { method: 'POST' });
      const report = await res.json();
      if (!res.ok) throw new Error(report.error || 'Sync failed');
      const bits = [`${report.added.length} new video${report.added.length === 1 ? '' : 's'} added`];
      if (report.matchedExisting) bits.push(`${report.matchedExisting} matched existing entries`);
      if (report.skippedShorts) bits.push(`${report.skippedShorts} shorts skipped`);
      if (report.failed.length) bits.push(`${report.failed.length} failed`);
      const tail = report.remaining ? ` ${report.remaining} more queued — sync again to continue.` : '';
      toast.success(`Channel sync: ${bits.join(', ')}.${tail}`, { duration: 6000 });
      await load();
    } catch (err) {
      if (!auto) toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  }, [load]);

  // The "about weekly" rhythm without cron: any vault visit after 7 days
  // triggers a sync automatically (checked once, on the initial load).
  useEffect(() => {
    load().then((d) => { if (d?.syncStale) runSync(true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleStage = async () => {
    const urls = stageUrls.split('\n').map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setStaging(true);
    try {
      const res = await authFetch(`${API_BASE}/api/vault/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, workspaceId }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Staging failed');
      const bits = [`${out.staged.length} staged`];
      if (out.existed) bits.push(`${out.existed} already in the vault`);
      if (out.failed.length) bits.push(`${out.failed.length} failed`);
      toast[out.failed.length ? 'error' : 'success'](bits.join(', ') + '.');
      setStageUrls('');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStaging(false);
    }
  };

  const saveChannels = async (channels) => {
    setSavingChannels(true);
    try {
      const res = await authFetch(`${API_BASE}/api/vault/channels`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Failed to save channels');
      setData((prev) => ({ ...prev, channels: out.channels }));
      toast.success('Watched channels saved.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingChannels(false);
    }
  };

  const togglePreview = async (entry) => {
    if (expanded === entry.id) return setExpanded(null);
    setExpanded(entry.id);
    if (!previewText[entry.id]) {
      try {
        const res = await authFetch(`${API_BASE}/api/vault/${entry.id}/text`);
        const out = await res.json();
        setPreviewText((prev) => ({ ...prev, [entry.id]: out.text || '(no text stored)' }));
      } catch {
        setPreviewText((prev) => ({ ...prev, [entry.id]: '(failed to load text)' }));
      }
    }
  };

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  // Used/unused answers "is this still available for THIS workspace?" —
  // usage from other workspaces shows as a muted note, not a used tag.
  const usedHere = (e) => e.usedIn.filter((u) => u.workspaceId === workspaceId);
  const usedElsewhere = (e) => e.usedIn.filter((u) => u.workspaceId && u.workspaceId !== workspaceId);
  const q = query.trim().toLowerCase();
  const visible = data.entries.filter((e) => {
    if (filter === 'unused' && usedHere(e).length) return false;
    if (filter === 'used' && !usedHere(e).length) return false;
    if (q && !`${e.title} ${e.group}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const groups = [...new Set(visible.map((e) => e.group))];
  const unusedCount = data.entries.filter((e) => !usedHere(e).length).length;

  return (
    <div className="w-full pb-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900"><Layers className="text-blue-600" size={24} /> Source Vault</h1>
          <p className="mt-1 text-sm text-slate-500">
            This workspace's source material, with where each piece was used. {unusedCount} of {data.entries.length} still unused.
            Compose from the vault in The Forge ("From vault").
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(data.channels || []).length > 0 && (
            <Button type="button" variant="ghost" onClick={() => runSync(false)} disabled={syncing} className="text-slate-600">
              {syncing ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <RefreshCw size={15} className="mr-1.5" />}
              Sync channels
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {[['all', `All ${data.entries.length}`], ['unused', `Unused ${unusedCount}`], ['used', `Used ${data.entries.length - unusedCount}`]].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                filter === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input type="text" placeholder="Search titles and groups..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* The ledger */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-sm font-semibold text-slate-700">{group}</div>
            <div className="divide-y divide-slate-50">
              {visible.filter((e) => e.group === group).map((entry) => {
                const here = usedHere(entry);
                const elsewhere = usedElsewhere(entry);
                const used = here.length > 0;
                const Icon = metaOf(entry.type).icon;
                return (
                  <div key={entry.id} className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {used
                        ? <CheckSquare size={16} className="shrink-0 text-emerald-600" />
                        : <Square size={16} className="shrink-0 text-slate-300" />}
                      <Icon size={15} className={`shrink-0 ${metaOf(entry.type).accent}`} />
                      <button type="button" onClick={() => togglePreview(entry)} className="flex min-w-0 items-center gap-1.5 text-left">
                        <span className={`truncate text-sm font-medium ${used ? 'text-slate-500' : 'text-slate-800'}`}>{entry.title}</span>
                        <ChevronDown size={13} className={`shrink-0 text-slate-400 transition-transform ${expanded === entry.id ? 'rotate-180' : ''}`} />
                      </button>
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-400">{entry.chars.toLocaleString()} chars</span>
                    </div>
                    {used && (
                      <p className="mt-1 pl-[62px] text-xs text-slate-500">
                        {here.map((u, i) => (
                          <span key={i}>
                            {i > 0 && ' · '}
                            <span className="font-medium text-slate-600">“{u.title}”</span>
                            {u.kind ? ` (${u.kind}${u.date ? `, ${u.date}` : ''})` : u.date ? ` (${u.date})` : ''}
                          </span>
                        ))}
                      </p>
                    )}
                    {elsewhere.length > 0 && (
                      <p className="mt-1 pl-[62px] text-[11px] italic text-slate-400">
                        Used elsewhere: {elsewhere.map((u) => `“${u.title}”${u.kind ? ` (${u.kind})` : ''}`).join(' · ')}
                      </p>
                    )}
                    {expanded === entry.id && (
                      <div className="mt-2 ml-[62px] max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-700">
                        {previewText[entry.id] || 'Loading...'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            {data.entries.length === 0
              ? 'The vault is empty. Stage YouTube URLs below, watch a channel, or run the import script for the legacy corpus.'
              : 'Nothing matches this filter.'}
          </div>
        )}
      </div>

      {/* Stage new material */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><Video size={16} className="text-rose-500" /> Stage videos for later</h3>
          <p className="mb-3 text-xs text-slate-500">One YouTube URL per line (up to 20). Transcripts are fetched now so composing later is instant.</p>
          <Textarea rows={3} placeholder={'https://www.youtube.com/watch?v=...\nhttps://youtu.be/...'} value={stageUrls} onChange={(e) => setStageUrls(e.target.value)} disabled={staging} />
          <Button type="button" onClick={handleStage} disabled={staging || !stageUrls.trim()} className="mt-3">
            {staging ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Plus size={15} className="mr-1.5" />} Stage
          </Button>
        </div>

        {isAdmin && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-slate-800">Watched channels</h3>
            <p className="mb-3 text-xs text-slate-500">New uploads land here as unused entries — synced automatically about weekly (on vault visits), or on demand.</p>
            <div className="space-y-2">
              {(data.channels || []).map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="truncate font-medium">{c.label}</span>
                  <span className="truncate text-xs text-slate-400">{c.id}</span>
                  <button
                    type="button"
                    aria-label={`Remove channel ${c.label}`}
                    onClick={() => saveChannels(data.channels.filter((_, j) => j !== i))}
                    disabled={savingChannels}
                    className="ml-auto rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input type="text" placeholder="@handle or channel URL" value={channelDraft} onChange={(e) => setChannelDraft(e.target.value)} disabled={savingChannels} />
                <Button
                  type="button"
                  variant="ghost"
                  disabled={savingChannels || !channelDraft.trim()}
                  onClick={() => {
                    const id = channelDraft.trim();
                    saveChannels([...(data.channels || []), { id, label: id.replace(/^https?:\/\/(www\.)?youtube\.com\//, ''), workspaceId }]);
                    setChannelDraft('');
                  }}
                  className="shrink-0"
                >
                  <Plus size={15} className="mr-1" /> Watch
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
