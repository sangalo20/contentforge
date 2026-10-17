import { useEffect, useState, useCallback } from 'react';
import {
  X, Sparkles, LayoutGrid, Wand2, BookOpen,
  MessageSquare, Bell, Users, CheckCircle2, ChevronLeft, ChevronRight, Share2,
  Bot, UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

const STORAGE_KEY = 'cf_onboarded';

// Other components can reopen the tour with:
//   window.dispatchEvent(new Event('open-onboarding'))
export const OPEN_EVENT = 'open-onboarding';

function buildSteps(isAdmin) {
  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to ContentForge',
      body: 'ContentForge turns YouTube videos into publish-ready articles and platform-native social content. The flow: pick a workspace, drop in a video link, let the AI crew draft it, review, publish, then syndicate. This quick tour shows you where everything lives.',
    },
    {
      icon: LayoutGrid,
      title: 'Workspaces are your projects',
      body: 'The dashboard is a grid of workspaces. Each one is an isolated project with its own AI persona, writing style, and publishing destination. Click a card to land on its Overview — a lifecycle funnel, everything that needs your attention, and your most recent work.',
    },
    {
      icon: Bot,
      title: 'Meet the crew',
      body: 'You talk to one assistant — Odin. Behind the scenes he runs a crew of specialists: a writer drafts from your sources, a quality gate checks every claim and polishes the prose, an illustrator makes cover images, and a social specialist crafts your posts. You\'ll see Odin delegate to them as the work happens — no names to memorize, just progress you can follow.',
    },
    {
      icon: Wand2,
      title: 'The Forge — generate content',
      body: 'Inside a workspace, open "The Forge" in the sidebar. Stack your sources — YouTube videos, web articles, pasted notes — and hit "Generate Content". You\'ll watch Odin run the pipeline live: sources come in, the draft gets written and reviewed, and you land straight on the result with the review notes attached.',
    },
    {
      icon: BookOpen,
      title: 'Library — all your content',
      body: 'The "Library" tab holds every piece you\'ve generated, each with a lifecycle status: Draft, Finalized, In Review, Approved, or Published. Click any card to open it.',
    },
    {
      icon: UserCheck,
      title: 'Finalize, then submit for review',
      body: 'In a draft you can edit inline, generate an AI cover image, and hit "Finalize Draft" when you\'re done. Then "Submit for review" — tag one or more reviewers and they\'re notified by bell and email. Reviewers approve or request changes (with a note); workspaces with "Require review" hold publishing until a reviewer approves.',
    },
    {
      icon: Share2,
      title: 'Syndicate in the Studio',
      body: 'Turn any article into social content from "Social Media" in the sidebar: LinkedIn posts, X posts or threads, branded carousel PDFs, and posters. Everything opens in the full-screen studio — chat with Odin on the left while you edit the pages on the right — and he can add a cover image to any post. It all lands in the Social Library.',
    },
    {
      icon: MessageSquare,
      title: 'Comments & @mentions',
      body: 'Every draft has a comments section at the bottom. Leave feedback and type "@" to tag a teammate — they get notified instantly. Review decisions land here too, so the whole conversation stays on the item.',
    },
    {
      icon: Bell,
      title: 'Stay in the loop',
      body: 'The bell in the top-right shows notifications: finished drafts, review requests and decisions, mentions, errors, and announcements. The home page also gathers everything waiting on you across all your workspaces.',
    },
  ];

  if (isAdmin) {
    steps.push({
      icon: Users,
      title: 'Manage your team',
      body: 'The "Admin" area holds everything org-wide: invite teammates, set roles (Creator, Admin, or Owner), grant per-workspace reviewer rights via "Reviews In", reset passwords, send announcements, restore workspaces from the 60-day trash, and track AI usage & cost.',
    });
  }

  steps.push({
    icon: CheckCircle2,
    title: "You're all set",
    body: 'That\'s the whole app: pick a workspace → paste a link → the crew drafts it → finalize → review → publish → syndicate. You can reopen this tour anytime from the "?" Help button in the header.',
  });

  return steps;
}

export default function OnboardingModal() {
  const { isAdmin } = useAuth();
  // Auto-open on first ever visit (lazy init — read once on mount).
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'true');
  const [step, setStep] = useState(0);

  const steps = buildSteps(isAdmin);

  // Allow any Help button to reopen the tour.
  useEffect(() => {
    const handler = () => { setStep(0); setOpen(true); };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  }, []);

  const next = () => {
    if (step >= steps.length - 1) finish();
    else setStep(s => s + 1);
  };
  const prev = () => setStep(s => Math.max(0, s - 1));

  const startTour = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    window.dispatchEvent(new Event('start-coach-tour'));
  };

  if (!open) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          onClick={finish}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Skip tour"
        >
          <X size={18} />
        </button>

        {/* Illustration band */}
        <div className="flex items-center justify-center bg-gradient-to-br from-blue-600 to-violet-600 py-10">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Icon size={32} className="text-white" />
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
            Step {step + 1} of {steps.length}
          </div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">{current.title}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{current.body}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'}`}
              title={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          {isLast ? (
            <button
              onClick={startTour}
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Show me around
            </button>
          ) : (
            <button
              onClick={finish}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              Skip
            </button>
          )}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {isLast ? 'Get started' : 'Next'}
              {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
