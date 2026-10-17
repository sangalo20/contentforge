import { Loader2, Trash2 } from 'lucide-react';
import { Button } from './button';

// The one confirmation dialog for destructive (and hide-y) actions. Extracted
// from UserManagement so every deletion in the app confirms the same way.
// Controlled: render it always, drive it with `open`. The type-to-confirm
// workspace delete in WorkspaceEditor stays bespoke — higher stakes.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  icon: Icon = Trash2,
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className={`mb-3 flex size-11 items-center justify-center rounded-full ${danger ? 'bg-rose-100' : 'bg-slate-100'}`}>
            <Icon className={`h-5 w-5 ${danger ? 'text-rose-600' : 'text-slate-600'}`} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1.5 text-sm text-slate-500">{message}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy} className="text-slate-500 hover:text-slate-700">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-w-[110px] text-white ${danger ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-400' : 'bg-slate-700 hover:bg-slate-800 focus-visible:ring-slate-400'}`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
