import { useState, useEffect } from 'react';
import { X, Send, Loader2, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { authFetch, API_BASE } from '../lib/api';

// Submit finalized content (an article, or one social piece) for review by
// tagged reviewers. Reviewers are users with the reviewer/admin role who have
// access to this workspace; each tagged reviewer gets a bell notification and
// an email with a deep link. Sits above the studio (z-1000), hence z-1100.
export default function SubmitReviewModal({ workspaceId, itemId, kind, channel, onClose, onSubmitted, initialSelected = [], initialNote = '', mode = 'submit' }) {
  const isUpdate = mode === 'update';
  const [reviewers, setReviewers] = useState([]);
  const [selected, setSelected] = useState(initialSelected);
  const [note, setNote] = useState(initialNote);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch(`${API_BASE}/api/workspaces/${workspaceId}/reviewers`)
      .then((res) => res.json())
      .then((data) => setReviewers(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('[SubmitReview] failed to load reviewers:', err);
        setError('Could not load the reviewer list.');
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const toggle = (uid) => {
    setSelected((prev) => (prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]));
  };

  const handleSubmit = async () => {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/api/reviews/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, kind, channel: channel || null, reviewers: selected, note: note.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit for review');
      onSubmitted({ reviewers: data.reviewers || selected, note: data.note ?? (note.trim() || null) });
    } catch (err) {
      console.error('[SubmitReview] submit failed:', err);
      setError(err.message || 'Failed to submit for review.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-foreground/10 animate-in zoom-in-95 duration-200">
        <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <UserCheck className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{isUpdate ? 'Manage review' : 'Submit for review'}</h3>
          </div>
          <button
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Tag reviewers</p>
            {loading ? (
              <div className="py-6 text-center text-slate-400">
                <Loader2 className="mx-auto mb-1 h-5 w-5 animate-spin" /> Loading reviewers...
              </div>
            ) : reviewers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                No reviewers have access to this workspace yet. An admin can grant the reviewer role in User Management.
              </p>
            ) : (
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1.5">
                {reviewers.map((r) => (
                  <label
                    key={r.uid}
                    className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      selected.includes(r.uid) ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(r.uid)}
                      onChange={() => toggle(r.uid)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="min-w-0 flex-1 truncate">{r.email}</span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{r.role}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Note <span className="font-normal normal-case">(optional)</span></p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder='e.g. "Second pair of eyes on the numbers in slide 3, please"'
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              disabled={selected.length === 0 || submitting}
              onClick={handleSubmit}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isUpdate ? 'Update review' : 'Submit for review'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
