import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, RefreshCw, Send, CheckCircle, FileText, Plus, Clock, Globe, ClipboardList, Trash2, Layers, FolderGit2, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import ConfirmDialog from './ui/confirm-dialog';
import VaultScoutChat from './VaultScoutChat';
import { authFetch, API_BASE } from '../lib/api';

// The kinds of source the composer can stack (mirrors backend lib/sources/).
// Mixed stacks are the point: a video + an article + pasted notes → one draft.
const SOURCE_KINDS = {
  youtube: { label: 'YouTube', icon: Video, accent: 'text-rose-500' },
  url: { label: 'Web article', icon: Globe, accent: 'text-sky-600' },
  text: { label: 'Paste text', icon: ClipboardList, accent: 'text-amber-600' },
  github: { label: 'GitHub repo', icon: FolderGit2, accent: 'text-violet-600' },
  code: { label: 'Code', icon: Code, accent: 'text-emerald-600' },
  // Not an add-button (hidden): vault cards arrive via the scout's proposals,
  // but they still need card metadata to render.
  vault: { label: 'From the vault', icon: Layers, accent: 'text-blue-600', hidden: true },
};

// Types whose content is pasted locally (counted live in the meter and
// hard-capped) vs fetched server-side at generate time.
const isPasted = (type) => type === 'text' || type === 'code';

// Budget (mirrors backend lib/sources): pasted sources are counted live in the
// meter; fetched sources (YouTube/article) are measured server-side at
// generate time, where the same totals are enforced authoritatively.
const MAX_SOURCE_CHARS = 60000;
const MAX_TOTAL_CHARS = 240000;

const newSource = (type) => ({ key: crypto.randomUUID(), type, url: '', text: '', label: '', language: '', paths: '', repoQuery: '', resolvedTitle: null, urlError: null, usedWarning: null, vaultId: null, chars: 0 });

const sourceHasContent = (s) =>
  s.type === 'vault' ? !!s.vaultId : isPasted(s.type) ? !!s.text.trim() : !!s.url.trim();

// Advisory on-blur validation — the server stays the authority, this just
// catches typos before a three-second pipeline failure does.
const urlProblemOf = (s) => {
  const raw = s.url.trim();
  if (!raw) return null;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return 'That does not look like a valid link.';
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'That does not look like a valid link.';
  if (s.type === 'youtube' && !/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(u.hostname)) return 'Expected a YouTube link.';
  if (s.type === 'github' && !/(^|\.)github\.com$/.test(u.hostname)) return 'Expected a github.com repository URL.';
  return null;
};

export default function PipelineTrigger() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // No presumed source type: the composer starts empty and the operator picks
  // what they're starting from (YouTube, article, text, repo, or code).
  const [sources, setSources] = useState([]);
  // Removal confirm — only when the card actually holds typed/pasted content.
  const [confirmRemove, setConfirmRemove] = useState(null);
  // The scout: opens over the vault when this workspace has material to mine.
  const [scoutOpen, setScoutOpen] = useState(false);
  const [vaultUnusedCount, setVaultUnusedCount] = useState(null); // null = not fetched
  const hasYoutubeCard = sources.some(s => s.type === 'youtube');
  useEffect(() => {
    if (!hasYoutubeCard || vaultUnusedCount !== null) return;
    authFetch(`${API_BASE}/api/vault?workspaceId=${id}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) return setVaultUnusedCount(0);
        const unused = (data.entries || []).filter(e => !(e.usedIn || []).some(u => u.workspaceId === id)).length;
        setVaultUnusedCount(unused);
      })
      .catch(() => setVaultUnusedCount(0));
  }, [hasYoutubeCard, vaultUnusedCount, id]);

  // The scout's editorial direction rides along into generation — the angle
  // and working title steer Oscar instead of evaporating at the composer.
  const [brief, setBrief] = useState(null); // { angle, workingTitle }

  const handleScoutProposal = (proposal) => {
    setSources(prev => [
      ...prev.filter(sourceHasContent), // drop the empty YouTube card that opened the scout
      ...proposal.picks.map(p => ({ ...newSource('vault'), vaultId: p.vaultId, resolvedTitle: p.title })),
    ]);
    if (proposal.angle || proposal.workingTitle) {
      setBrief({ angle: proposal.angle || '', workingTitle: proposal.workingTitle || '' });
    }
    setScoutOpen(false);
  };

  // The repo picker's index, fetched lazily the first time a GitHub card is
  // added: { configured, repos } | 'error' | null (not fetched yet).
  const [repoIndex, setRepoIndex] = useState(null);
  const hasGithubCard = sources.some(s => s.type === 'github');
  useEffect(() => {
    if (!hasGithubCard || repoIndex) return;
    authFetch(`${API_BASE}/api/github/repos`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => setRepoIndex(ok ? data : 'error'))
      .catch(() => setRepoIndex('error'));
  }, [hasGithubCard, repoIndex]);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [logs, setLogs] = useState([]);
  const [, setDraft] = useState(null);
  const logEndRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE}/api/library/${id}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && Array.isArray(data)) {
          const sorted = data.sort((a, b) => {
            const dateA = a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0;
            const dateB = b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0;
            return dateB - dateA;
          });
          setHistory(sorted.slice(0, 5));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [id]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs]);

  useEffect(() => {
    authFetch(`${API_BASE}/api/workspaces`)
      .then(res => res.json())
      .then(data => {
        const ws = data.find(w => w.id === id);
        setConfig(ws);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="py-6 text-sm text-slate-500">Loading workspace...</div>;
  if (!config) return <div className="py-6 text-sm text-slate-500">Workspace not found</div>;

  const updateSource = (key, patch) => {
    setSources(prev => prev.map(s => (s.key === key ? { ...s, ...patch } : s)));
    if (status === 'success' || status === 'error') {
      setStatus('idle');
      setDraft(null);
      setLogs([]);
    }
  };

  const removeSource = (key) => {
    setSources(prev => prev.filter(s => s.key !== key));
    setConfirmRemove(null);
  };

  // On blur: surface obvious URL typos, resolve YouTube titles live so a
  // filled card reads as the video, not a raw URL — and warn when the vault
  // says this video already fed published content.
  const handleUrlBlur = (s) => {
    const problem = urlProblemOf(s);
    setSources(prev => prev.map(x => (x.key === s.key ? { ...x, urlError: problem } : x)));
    if (s.type === 'youtube' && !problem && s.url.trim()) {
      const url = s.url.trim();
      authFetch(`${API_BASE}/api/sources/youtube-title?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(({ title, usedIn }) => {
          const usedWarning = usedIn?.length
            ? `Already used in “${usedIn[0].title}”${usedIn[0].date ? ` (${usedIn[0].date})` : ''}${usedIn.length > 1 ? ` and ${usedIn.length - 1} more` : ''}.`
            : null;
          setSources(prev => prev.map(x => (
            x.key === s.key && x.url.trim() === url
              ? { ...x, ...(title ? { resolvedTitle: title } : {}), usedWarning }
              : x
          )));
        })
        .catch(() => {});
    }
  };

  const filledSources = sources.filter(sourceHasContent);
  const pastedChars = sources.reduce((sum, s) => sum + (isPasted(s.type) ? s.text.length : 0), 0);
  const overBudget = sources.some(s => isPasted(s.type) && s.text.length > MAX_SOURCE_CHARS) || pastedChars > MAX_TOTAL_CHARS;

  const handleGenerate = async () => {
    if (filledSources.length === 0 || overBudget) return;
    setStatus('processing');
    setLogs([{ message: 'Preparing pipeline...', level: 'info', time: new Date() }]);

    const appendLog = (message, level = 'info') =>
      setLogs(prev => [...prev, { message, level, time: new Date() }]);

    try {
      const res = await authFetch(`${API_BASE}/api/generate/content/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(brief ? { brief } : {}),
          sources: filledSources.map(s => {
            if (s.type === 'vault') return { type: 'vault', vaultId: s.vaultId };
            if (s.type === 'text') return { type: 'text', text: s.text, label: s.label.trim() || undefined };
            if (s.type === 'code') return { type: 'code', text: s.text, label: s.label.trim() || undefined, language: s.language.trim() || undefined };
            if (s.type === 'github') {
              const paths = s.paths.split(',').map(p => p.trim()).filter(Boolean);
              return { type: 'github', url: s.url.trim(), paths: paths.length ? paths : undefined };
            }
            return { type: s.type, url: s.url.trim() };
          }),
          workspaceId: id
        })
      });

      if (!res.ok || !res.body) {
        // Fallback: try to read an error JSON body
        let message = 'Pipeline failed';
        try {
          const data = await res.json();
          message = data.error || message;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const dataLine = block
            .split('\n')
            .find(line => line.startsWith('data:'));
          if (!dataLine) continue;

          let event;
          try {
            event = JSON.parse(dataLine.slice(5).trim());
          } catch {
            continue;
          }

          if (event.type === 'stage') {
            appendLog(event.message, event.level || 'info');
          } else if (event.type === 'error') {
            appendLog(event.message, 'error');
            setStatus('error');
            finished = true;
            break;
          } else if (event.type === 'done') {
            setStatus('success');
            finished = true;
            const delay = event.existing ? 1500 : 1000;
            if (event.libraryId) {
              setTimeout(() => navigate(`/workspace/${id}/library/item/${event.libraryId}`), delay);
            }
            break;
          }
        }
      }
    } catch (err) {
      appendLog(`ERROR: ${err.message}`, 'error');
      setStatus('error');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Input & Trigger Panel */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {scoutOpen && (
              <VaultScoutChat
                workspaceId={id}
                onUseSources={handleScoutProposal}
                onClose={() => setScoutOpen(false)}
              />
            )}
            <ConfirmDialog
              open={!!confirmRemove}
              title="Remove this source?"
              message={`The ${SOURCE_KINDS[confirmRemove?.type]?.label || 'source'} you entered is dropped from the stack.`}
              confirmLabel="Remove source"
              onConfirm={() => removeSource(confirmRemove.key)}
              onCancel={() => setConfirmRemove(null)}
            />
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="flex items-center gap-2.5 text-slate-800 text-lg font-semibold tracking-tight">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm border border-slate-200">
                  <Layers size={16} />
                </div>
                Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {brief && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Editorial direction</p>
                      {brief.workingTitle && <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{brief.workingTitle}</p>}
                      {brief.angle && <p className="mt-0.5 text-xs italic text-slate-600">{brief.angle}</p>}
                    </div>
                    {status !== 'processing' && (
                      <button
                        type="button"
                        aria-label="Remove editorial direction"
                        onClick={() => setBrief(null)}
                        className="ml-auto rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              {sources.map((s, i) => {
                const kind = SOURCE_KINDS[s.type];
                const Icon = kind.icon;
                const pasted = isPasted(s.type);
                const overCap = pasted && s.text.length > MAX_SOURCE_CHARS;
                const urlPlaceholder = s.type === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : s.type === 'github'
                    ? 'https://github.com/owner/repo'
                    : 'https://example.com/article...';
                return (
                  <div key={s.key} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={`shrink-0 ${kind.accent}`} />
                      <span className="shrink-0 text-sm font-semibold text-slate-700">{kind.label}{sources.length > 1 ? ` ${i + 1}` : ''}</span>
                      {s.resolvedTitle && (
                        <span className="min-w-0 truncate text-xs text-slate-500" title={s.resolvedTitle}>— {s.resolvedTitle}</span>
                      )}
                      {pasted && (
                        <span className={`ml-auto text-xs tabular-nums ${overCap ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
                          {s.text.length.toLocaleString()} / {MAX_SOURCE_CHARS.toLocaleString()}
                        </span>
                      )}
                      {status !== 'processing' && (
                        <button
                          aria-label={`Remove source ${i + 1}`}
                          onClick={() => (sourceHasContent(s) ? setConfirmRemove(s) : removeSource(s.key))}
                          className={`${pasted ? '' : 'ml-auto '}rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {s.type === 'vault' ? (
                      <p className="text-xs text-slate-500">
                        From the vault{s.chars ? ` — ${s.chars.toLocaleString()} characters, no fetching needed` : ''}.
                      </p>
                    ) : pasted ? (
                      <>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder={s.type === 'code' ? "Label (optional) — e.g. 'billing.py'" : "Label (optional) — e.g. 'API docs excerpt'"}
                            value={s.label}
                            onChange={(e) => updateSource(s.key, { label: e.target.value })}
                            disabled={status === 'processing'}
                          />
                          {s.type === 'code' && (
                            <Input
                              type="text"
                              placeholder="Language"
                              value={s.language}
                              onChange={(e) => updateSource(s.key, { language: e.target.value })}
                              disabled={status === 'processing'}
                              className="w-32"
                            />
                          )}
                        </div>
                        <Textarea
                          placeholder={s.type === 'code' ? 'Paste the code...' : 'Paste an article, notes, documentation...'}
                          value={s.text}
                          rows={5}
                          onChange={(e) => updateSource(s.key, { text: e.target.value })}
                          disabled={status === 'processing'}
                          className={s.type === 'code' ? 'font-mono text-xs' : ''}
                        />
                        {overCap && (
                          <p className="text-xs font-medium text-rose-600">
                            Over the per-source budget — trim it or split it into two sources.
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <Input
                          type="text"
                          placeholder={urlPlaceholder}
                          value={s.url}
                          onChange={(e) => updateSource(s.key, { url: e.target.value, urlError: null, resolvedTitle: null })}
                          onBlur={() => handleUrlBlur(s)}
                          disabled={status === 'processing'}
                        />
                        {s.urlError && (
                          <p className="text-xs font-medium text-rose-600">{s.urlError}</p>
                        )}
                        {s.usedWarning && !s.urlError && (
                          <p className="text-xs font-medium text-amber-600">{s.usedWarning}</p>
                        )}
                        {s.type === 'youtube' && vaultUnusedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setScoutOpen(true)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/40 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                          >
                            <Layers size={13} /> Scout the vault — {vaultUnusedCount} unused transcript{vaultUnusedCount === 1 ? '' : 's'}
                          </button>
                        )}
                        {s.type === 'github' && (() => {
                          const configured = repoIndex && repoIndex !== 'error' && repoIndex.configured;
                          const repos = configured ? repoIndex.repos : [];
                          const query = s.repoQuery.trim().toLowerCase();
                          const selected = repos.find(r => r.url === s.url);
                          const matches = query && (!selected || selected.fullName.toLowerCase() !== query)
                            ? repos.filter(r => r.fullName.toLowerCase().includes(query)).slice(0, 6)
                            : [];
                          return (
                            <>
                              {configured && (
                                <div className="relative">
                                  <Input
                                    type="text"
                                    placeholder={`Search your ${repos.length} repos...`}
                                    value={s.repoQuery}
                                    onChange={(e) => updateSource(s.key, { repoQuery: e.target.value })}
                                    disabled={status === 'processing'}
                                  />
                                  {matches.length > 0 && (
                                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                                      {matches.map(r => (
                                        <button
                                          key={r.url}
                                          onClick={() => updateSource(s.key, { url: r.url, repoQuery: r.fullName })}
                                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50"
                                        >
                                          <FolderGit2 size={13} className="shrink-0 text-violet-600" />
                                          <span className="truncate font-medium">{r.fullName}</span>
                                          {r.private && <span className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">private</span>}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {repoIndex && repoIndex !== 'error' && repoIndex.configured === false && (
                                <p className="text-[11px] text-slate-400">
                                  Connect your GitHub in Settings → Integrations to pick from your repos; public repo URLs work without it.
                                </p>
                              )}
                              <Input
                                type="text"
                                placeholder="Specific files (optional, comma-separated) — e.g. src/api.py, examples/demo.md"
                                value={s.paths}
                                onChange={(e) => updateSource(s.key, { paths: e.target.value })}
                                disabled={status === 'processing'}
                              />
                              <p className="text-[11px] text-slate-400">
                                Ingests the README and docs folder automatically; add specific files above.
                              </p>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                );
              })}

              {sources.length === 0 && (
                <p className="pt-1 text-center text-sm text-slate-500">
                  What are you starting from? Add one or more sources below.
                </p>
              )}

              {sources.length < 10 && status !== 'processing' && (
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(SOURCE_KINDS).filter(([, k]) => !k.hidden).map(([type, kind]) => {
                    const Icon = kind.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setSources(prev => [...prev, newSource(type)])}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600"
                      >
                        <Plus size={13} /> <Icon size={13} className={kind.accent} /> {kind.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {status !== 'processing' && (
                <p className="text-center text-[11px] text-slate-400">
                  Mix freely — a video + an article + your notes become one draft.
                </p>
              )}

              {pastedChars > 0 && (
                <p className={`text-center text-xs tabular-nums ${pastedChars > MAX_TOTAL_CHARS ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
                  {pastedChars.toLocaleString()} / {MAX_TOTAL_CHARS.toLocaleString()} characters pasted
                  <span className="text-slate-400"> — videos &amp; articles are measured when fetched</span>
                </p>
              )}

              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: status === 'processing' ? '#1d4ed8' : config.theme }}
                onClick={handleGenerate}
                disabled={filledSources.length === 0 || overBudget || status === 'processing'}
              >
                {status === 'processing' ? (
                  <><RefreshCw size={18} className="animate-spin" /> Processing Pipeline...</>
                ) : status === 'success' ? (
                  <><CheckCircle size={18} /> Generation Complete</>
                ) : (
                  <><Send size={18} /> Generate Content{filledSources.length > 1 ? ` (${filledSources.length} sources)` : ''}</>
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                Target Destination: <strong className="text-slate-700">{config.destination}</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:col-span-7">
          {/* Status Log Panel */}
          <Card className="flex-1 bg-white border-slate-200 shadow-sm overflow-hidden relative">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="flex items-center gap-2.5 text-slate-800 text-lg font-semibold tracking-tight">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm border border-slate-200">
                  <FileText size={16} />
                </div>
                Pipeline Status
              </CardTitle>
            </CardHeader>
            <CardContent className="custom-scrollbar max-h-72 overflow-y-auto py-5 px-5 font-mono text-[13px] leading-relaxed">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <div className="mb-3 rounded-full bg-slate-50 p-4 border border-slate-200">
                    <Send size={24} className="opacity-40" />
                  </div>
                  <span className="tracking-widest uppercase text-xs opacity-70">Awaiting Input Sequence</span>
                </div>
              ) : (
                logs.map((log, i) => {
                  const isLast = i === logs.length - 1;
                  const levelClass =
                    log.level === 'error'
                      ? 'text-rose-600'
                      : log.level === 'warn'
                        ? 'text-amber-600'
                        : log.level === 'success'
                          ? 'text-emerald-600'
                          : 'text-slate-700';
                  return (
                    <div key={i} className={`mb-2.5 flex items-start gap-3 ${levelClass}`}>
                      <span className="shrink-0 text-slate-400 font-medium select-none">
                        [{(log.time instanceof Date ? log.time : new Date()).toLocaleTimeString()}]
                      </span>
                      <span className="flex-1 tracking-wide">{log.message}</span>
                      {status === 'processing' && isLast && (
                        <RefreshCw size={13} className="mt-0.5 shrink-0 animate-spin text-blue-500" />
                      )}
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Log Section */}
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-slate-400" /> Recent Activity Log
        </h3>
        {loadingHistory ? (
           <div className="text-xs text-slate-500 animate-pulse bg-white border border-slate-200 rounded-xl p-4">Loading history...</div>
        ) : history.length === 0 ? (
           <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
             <Clock className="mx-auto mb-2 opacity-30" size={24} />
             No recent pipeline runs found for this workspace.
           </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {history.map(item => {
                const dateObj = item.createdAt?._seconds ? new Date(item.createdAt._seconds * 1000) : new Date();
                const sourceUrl = Array.isArray(item.sources) && item.sources.length
                  ? item.sources.map(s => s.title || s.url || s.type).join('  +  ')
                  : (item.youtubeUrls ? item.youtubeUrls[0] : item.youtubeUrl);
                const statusStr = (item.status || 'draft').replace('_', ' ');
                const displayTitle = item.draft ? (item.draft.match(/^(?:#+)\s+(.+?)(?:\n|$)/m)?.[1]?.replace(/(\*\*|\*)/g, '').trim() || item.title || 'Untitled Draft') : (item.title || 'Generating...');
                
                let statusColor = "bg-slate-400";
                if (item.status === 'approved') statusColor = "bg-emerald-500";
                if (item.status === 'published') statusColor = "bg-indigo-500";
                if (item.status === 'error' || item.status === 'failed') statusColor = "bg-rose-500";

                return (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/workspace/${id}/library/item/${item.id}`)}>
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden relative flex items-center justify-center text-slate-400 group-hover:border-blue-300 transition-colors">
                        {item.coverImage?.url ? (
                          <img
                            src={`${API_BASE}${item.coverImage.url}`}
                            alt="Thumbnail"
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <FileText size={18} className="group-hover:text-blue-500 transition-colors relative z-10" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{displayTitle}</p>
                        <p className="truncate text-xs text-slate-500">{sourceUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                      <div className="hidden sm:flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusColor}`}></span>
                        <span className="text-[13px] text-slate-500 capitalize">{statusStr}</span>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums font-medium">
                        {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
