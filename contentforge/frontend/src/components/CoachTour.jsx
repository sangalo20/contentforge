import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';

// Start the interactive tour from anywhere:
//   window.dispatchEvent(new Event('start-coach-tour'))
export const START_EVENT = 'start-coach-tour';

const PAD = 6;          // spotlight padding around the target
const TIP_WIDTH = 320;  // tooltip width in px

// Wait for a [data-tour] element to appear (handles route changes / async loads).
function waitForEl(selector, timeout = 4000) {
  const start = Date.now();
  return new Promise(resolve => {
    const check = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - start > timeout) return resolve(null);
      requestAnimationFrame(check);
    };
    check();
  });
}

function buildSteps({ wsId, isAdmin }) {
  const steps = [
    {
      key: 'ws-card',
      path: '/',
      title: 'Workspaces',
      body: 'Each card is a workspace — an isolated project with its own AI persona and publishing destination. Click one to work inside it.',
    },
  ];
  if (isAdmin) {
    steps.push({
      key: 'new-workspace',
      path: '/',
      title: 'Start a new project',
      body: 'Admins create new workspaces here, then configure the AI voice and where content publishes.',
    });
  }
  steps.push(
    {
      key: 'bell',
      path: '/',
      title: 'Notifications',
      body: 'Finished drafts, cover images, @mentions and announcements all land in this bell.',
    },
    {
      key: 'help',
      path: '/',
      title: 'Help is always here',
      body: 'Reopen the overview or replay this walkthrough anytime from the “?” button.',
    },
  );
  if (wsId) {
    steps.push(
      {
        key: 'tab-forge',
        path: `/workspace/${wsId}/pipeline`,
        title: 'The Forge',
        body: 'Paste 1–3 YouTube links here and hit Generate. You’ll watch the pipeline fetch the transcript and write your draft in real time.',
      },
      {
        key: 'tab-library',
        path: `/workspace/${wsId}/pipeline`,
        title: 'Library',
        body: 'Every draft you generate lands here with a status — Draft, Approved, or Published. Open one to review, edit, add a cover image, and publish.',
      },
      {
        key: 'tab-social',
        path: `/workspace/${wsId}/pipeline`,
        title: 'Social Media',
        body: 'Turn any article into social content — LinkedIn posts, X posts or threads, branded carousel PDFs, and single-image posters. Pick a brand Social Profile, and find everything you make in the Social Library, filterable by channel.',
      },
    );
    if (isAdmin) {
      steps.push({
        key: 'tab-settings',
        path: `/workspace/${wsId}/pipeline`,
        title: 'Config & Persona',
        body: 'Tune the AI persona, model, and publishing destination for this workspace here.',
      });
    }
  }
  return steps;
}

export default function CoachTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  // The spotlight box is keyed to the step it was measured for, so switching
  // steps hides the old box by derivation (no synchronous reset in the effect).
  const [spot, setSpot] = useState(null); // { index, box }
  const rect = spot && spot.index === index ? spot.box : null;
  const [steps, setSteps] = useState([]);
  const elRef = useRef(null);
  const firstWsId = useRef(null);

  // Cache the first workspace id so we can walk into a workspace.
  useEffect(() => {
    authFetch(`${API_BASE}/api/workspaces`)
      .then(res => (res.ok ? res.json() : []))
      .then(list => { if (Array.isArray(list) && list[0]) firstWsId.current = list[0].id; })
      .catch(() => {});
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setSpot(null);
    elRef.current = null;
  }, []);

  // Launch on demand.
  useEffect(() => {
    const handler = () => {
      const urlMatch = location.pathname.match(/^\/workspace\/([a-zA-Z0-9_-]+)/);
      const wsId = (urlMatch && urlMatch[1] !== 'new' ? urlMatch[1] : null) || firstWsId.current;
      setSteps(buildSteps({ wsId, isAdmin }));
      setIndex(0);
      setActive(true);
    };
    window.addEventListener(START_EVENT, handler);
    return () => window.removeEventListener(START_EVENT, handler);
  }, [location.pathname, isAdmin]);

  const advance = useCallback((dir) => {
    setIndex(i => {
      const nextI = i + dir;
      if (nextI < 0) return 0;
      if (nextI >= steps.length) { stop(); return i; }
      return nextI;
    });
  }, [steps.length, stop]);

  // Position the spotlight for the current step (navigating if needed).
  useEffect(() => {
    if (!active) return;
    const step = steps[index];
    if (!step) return;

    // Navigate first; the effect reruns when the pathname updates.
    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
      return;
    }

    let cancelled = false;
    (async () => {
      const el = await waitForEl(`[data-tour="${step.key}"]`);
      if (cancelled) return;
      if (!el) { advance(1); return; } // skip steps whose target isn't present
      elRef.current = el;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => { if (!cancelled) setSpot({ index, box: el.getBoundingClientRect() }); }, 320);
    })();

    return () => { cancelled = true; };
  }, [active, index, steps, location.pathname, navigate, advance]);

  // Keep the spotlight glued to the element on scroll/resize.
  useEffect(() => {
    if (!active) return;
    const update = () => { if (elRef.current) setSpot({ index, box: elRef.current.getBoundingClientRect() }); };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [active, index]);

  // Escape to exit.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') stop();
      else if (e.key === 'ArrowRight') advance(1);
      else if (e.key === 'ArrowLeft') advance(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, advance, stop]);

  if (!active) return null;

  const step = steps[index];
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Tooltip placement: below the target if there's room, else above.
  let tipTop;
  let tipLeft;
  let placeBelow = true;
  if (rect) {
    placeBelow = rect.bottom + 180 < vh;
    tipTop = placeBelow ? rect.bottom + 14 : rect.top - 14;
    tipLeft = Math.min(Math.max(rect.left + rect.width / 2 - TIP_WIDTH / 2, 12), vw - TIP_WIDTH - 12);
  } else {
    // No target yet — center the tooltip.
    tipTop = vh / 2 - 90;
    tipLeft = vw / 2 - TIP_WIDTH / 2;
  }

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Spotlight: four dark panels around the target (or full dark if none) */}
      {rect ? (
        <>
          <div className="absolute bg-black/60 transition-all" style={{ left: 0, top: 0, width: '100%', height: Math.max(0, rect.top - PAD) }} />
          <div className="absolute bg-black/60 transition-all" style={{ left: 0, top: rect.bottom + PAD, width: '100%', height: Math.max(0, vh - rect.bottom - PAD) }} />
          <div className="absolute bg-black/60 transition-all" style={{ left: 0, top: rect.top - PAD, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 }} />
          <div className="absolute bg-black/60 transition-all" style={{ left: rect.right + PAD, top: rect.top - PAD, width: Math.max(0, vw - rect.right - PAD), height: rect.height + PAD * 2 }} />
          <div
            className="pointer-events-none absolute rounded-xl ring-2 ring-blue-400 transition-all"
            style={{ left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Tooltip */}
      <div
        className="absolute w-80 rounded-xl bg-white p-4 shadow-2xl transition-all"
        style={{ top: tipTop, left: tipLeft, transform: placeBelow ? 'none' : 'translateY(-100%)' }}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {index + 1} / {steps.length}
          </span>
          <button onClick={stop} title="Exit tour" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={15} />
          </button>
        </div>
        <h3 className="mb-1.5 text-base font-bold text-slate-900">{step?.title}</h3>
        <p className="mb-3 text-sm leading-relaxed text-slate-600">{step?.body}</p>
        <div className="flex items-center justify-between">
          <button onClick={stop} className="text-xs font-medium text-slate-400 hover:text-slate-600">Exit</button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button onClick={() => advance(-1)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <button onClick={() => advance(1)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
              {index === steps.length - 1 ? 'Done' : 'Next'}
              {index !== steps.length - 1 && <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
