import { useState, useEffect } from 'react';
import { CircleDollarSign, Loader2 } from 'lucide-react';
import { authFetch, API_BASE } from '../lib/api';

// AI usage & estimated cost across providers (xAI, Anthropic, Gemini), fed by
// Odin's per-call ledger. Costs are estimates from litellm price tables — the
// value here is attribution (which agent/workspace) and trends, not invoices.

const fmtUsd = (v) => `$${(v ?? 0).toFixed(v >= 100 ? 0 : 2)}`;

const AGENT_LABELS = {
  oscar: 'Oscar (writer)',
  heimdall: 'Heimdall (quality gate)',
  loki: 'Loki (social)',
  hermes: 'Hermes (images)',
  odin: 'Odin (chat)',
  mimir: 'Mimir (vault scout)',
  huginn: 'Huginn (citations)',
  unknown: 'Unattributed',
};

const PROVIDER_LABELS = { anthropic: 'Anthropic', gemini: 'Google Gemini', google: 'Google Gemini', xai: 'xAI' };

function BarList({ entries, labels = {} }) {
  const max = Math.max(...entries.map(([, v]) => v.costUsd), 0.000001);
  return (
    <div className="space-y-2">
      {entries.map(([key, v]) => (
        <div key={key} className="flex items-center gap-3">
          <div className="w-44 shrink-0 truncate text-xs font-medium text-slate-600">{labels[key] || key}</div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${(v.costUsd / max) * 100}%` }} />
          </div>
          <div className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-700">{fmtUsd(v.costUsd)}</div>
          <div className="w-14 shrink-0 text-right text-[11px] tabular-nums text-slate-400">{v.calls} calls</div>
        </div>
      ))}
    </div>
  );
}

export default function UsageCost() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  // Loading is derived: we're loading whenever the fetched window isn't the
  // selected one (covers both first load and range switches).
  const [loadedDays, setLoadedDays] = useState(null);
  const loading = loadedDays !== days;

  useEffect(() => {
    authFetch(`${API_BASE}/api/usage/summary?days=${days}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoadedDays(days));
  }, [days]);

  const sorted = (obj) => Object.entries(obj || {}).sort((a, b) => b[1].costUsd - a[1].costUsd);
  const dayEntries = Object.entries(data?.byDay || {}).sort((a, b) => a[0].localeCompare(b[0]));
  const dayMax = Math.max(...dayEntries.map(([, v]) => v.costUsd), 0.000001);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <CircleDollarSign className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">AI Usage &amp; Cost</h2>
        <span className="text-xs text-slate-400">estimated from provider price tables</span>
        <div className="ml-auto flex gap-1">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                days === d ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading usage…
          </div>
        ) : !data || data.calls === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No AI usage recorded in the last {days} days. Records accrue as content is generated.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Headline */}
            <div className="flex flex-wrap items-end gap-8 px-6 py-5">
              <div>
                <div className="text-3xl font-bold tabular-nums text-slate-900">{fmtUsd(data.totalUsd)}</div>
                <div className="text-xs text-slate-400">estimated spend, last {data.days} days · {data.calls} AI calls</div>
              </div>
              <div className="flex gap-2">
                {sorted(data.byProvider).map(([p, v]) => (
                  <span key={p} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    {PROVIDER_LABELS[p] || p}: {fmtUsd(v.costUsd)}
                  </span>
                ))}
              </div>
            </div>

            {/* Daily trend */}
            {dayEntries.length > 1 && (
              <div className="px-6 py-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Spend per day</div>
                <div className="flex h-16 items-end gap-1">
                  {dayEntries.map(([day, v]) => (
                    <div key={day} className="group relative flex-1">
                      <div
                        className="w-full rounded-t bg-blue-500/80 transition-colors group-hover:bg-blue-600"
                        style={{ height: `${Math.max((v.costUsd / dayMax) * 56, 2)}px` }}
                      />
                      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                        {day.slice(5)}: {fmtUsd(v.costUsd)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By agent / by workspace */}
            <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">By agent</div>
                <BarList entries={sorted(data.byAgent)} labels={AGENT_LABELS} />
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">By workspace</div>
                <BarList
                  entries={sorted(data.byWorkspace)}
                  labels={Object.fromEntries(Object.entries(data.byWorkspace).map(([id, v]) => [id, v.name]))}
                />
              </div>
            </div>

            {/* Models, for the curious */}
            <div className="px-6 py-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">By model</div>
              <div className="flex flex-wrap gap-2">
                {sorted(data.byModel).map(([m, v]) => (
                  <span key={m} className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
                    {m} · {fmtUsd(v.costUsd)} · {v.calls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
