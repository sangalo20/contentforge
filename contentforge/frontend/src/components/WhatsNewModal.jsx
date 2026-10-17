import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { VERSION, CHANGELOG } from '../lib/changelog';

const STORAGE_KEY = 'cf_seen_version';

const TAG_STYLES = {
  new: 'bg-blue-100 text-blue-700',
  improved: 'bg-violet-100 text-violet-700',
  fixed: 'bg-emerald-100 text-emerald-700',
};

export default function WhatsNewModal() {
  // Open when a returning user hasn't seen this version's changelog yet
  // (lazy init — read once on mount). Brand-new users get the onboarding
  // tour instead; the effect below silently marks the version seen for them.
  const [open, setOpen] = useState(() =>
    localStorage.getItem('cf_onboarded') === 'true' &&
    localStorage.getItem(STORAGE_KEY) !== VERSION
  );

  useEffect(() => {
    if (localStorage.getItem('cf_onboarded') !== 'true') {
      localStorage.setItem(STORAGE_KEY, VERSION);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, VERSION);
    setOpen(false);
  };

  // Allow manual reopen.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-changelog', handler);
    return () => window.removeEventListener('open-changelog', handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">What's new in ContentForge</h2>
            <p className="text-xs text-slate-400">{CHANGELOG[0]?.date}</p>
          </div>
          <button
            onClick={dismiss}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* Entries — show most recent 2 releases */}
        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6 py-5 space-y-6">
          {CHANGELOG.slice(0, 2).map(release => (
            <div key={release.version}>
              <p className="mb-3 text-sm font-semibold text-slate-700">{release.title}</p>
              <ul className="space-y-2.5">
                {release.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TAG_STYLES[item.tag] || TAG_STYLES.new}`}>
                      {item.tag}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-600">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4">
          <button
            onClick={dismiss}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
