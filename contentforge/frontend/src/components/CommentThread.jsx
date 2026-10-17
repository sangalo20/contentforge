import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Loader2, AtSign, SmilePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';

// Reaction palette — must mirror REACTION_EMOJI in backend/routes/comments.js.
const REACTION_EMOJI = ['👍', '❤️', '😂', '🎉', '💡', '🔥'];

// Deterministic avatar color per author, so the same person always gets the
// same hue across threads.
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];
function avatarColor(key) {
  let h = 0;
  for (const ch of String(key || '')) h = (h * 31 + ch.codePointAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// Turn a user into a mention "handle" with no spaces so the @token stays a
// single word that our autocomplete regex can match.
function handleFor(user) {
  const base = user.displayName || (user.email ? user.email.split('@')[0] : 'user');
  return base.replace(/\s+/g, '');
}

function timeAgo(ms) {
  if (!ms) return '';
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
}

// Render comment text with @mentions highlighted. Only tokens matching a real
// user handle light up (any @token if the directory hasn't loaded).
function renderBody(text, knownHandles) {
  const parts = String(text).split(/(@[\w.-]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') && (knownHandles.size === 0 || knownHandles.has(part.slice(1).toLowerCase()))
      ? <span key={i} className="font-semibold text-blue-600">{part}</span>
      : <span key={i}>{part}</span>
  );
}

export default function CommentThread({ itemId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState([]); // [{ uid, handle }]
  const [pickerFor, setPickerFor] = useState(null); // comment id with open emoji picker
  // Loading is derived: true until the first load completes (matching the old
  // behavior, where itemId switches kept the stale thread visible, no spinner).
  const [everLoaded, setEverLoaded] = useState(false);
  const loading = !everLoaded;
  const [posting, setPosting] = useState(false);

  // Mention autocomplete state
  const [query, setQuery] = useState(null); // null = closed
  const [activeIdx, setActiveIdx] = useState(0);
  const textareaRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/library/item/${itemId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setEverLoaded(true);
    }
  }, [itemId]);

  // Schedule the (re)load instead of calling into setState-bearing code
  // synchronously from the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    authFetch(`${API_BASE}/api/users/directory`)
      .then(res => (res.ok ? res.json() : []))
      .then(setUsers)
      .catch(err => console.error('Failed to load user directory', err));
  }, []);

  const knownHandles = new Set(users.map(u => handleFor(u).toLowerCase()));

  const suggestions = query === null
    ? []
    : users
        .filter(u => {
          const q = query.toLowerCase();
          return (
            handleFor(u).toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.displayName || '').toLowerCase().includes(q)
          );
        })
        .slice(0, 6);

  const onChange = (e) => {
    const value = e.target.value;
    setText(value);
    const caret = e.target.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const match = before.match(/@([\w.-]*)$/);
    if (match) {
      setQuery(match[1]);
      setActiveIdx(0);
    } else {
      setQuery(null);
    }
  };

  const insertMention = (user) => {
    const el = textareaRef.current;
    const caret = el ? el.selectionStart : text.length;
    const before = text.slice(0, caret);
    const after = text.slice(caret);
    const tokenStart = before.lastIndexOf('@');
    if (tokenStart === -1) return;
    const handle = handleFor(user);
    const newBefore = before.slice(0, tokenStart) + `@${handle} `;
    const newText = newBefore + after;
    setText(newText);
    setMentions(prev =>
      prev.some(m => m.uid === user.uid) ? prev : [...prev, { uid: user.uid, handle }]
    );
    setQuery(null);
    // Restore focus and caret position after the inserted mention.
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        const pos = newBefore.length;
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const onKeyDown = (e) => {
    if (query !== null && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(suggestions[activeIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setQuery(null);
        return;
      }
    }
    // Submit with Cmd/Ctrl+Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const submit = async () => {
    const body = text.trim();
    if (!body || posting) return;
    // Only keep mentions whose @handle still appears in the text.
    const activeMentions = Array.from(
      new Set(mentions.filter(m => body.includes(`@${m.handle}`)).map(m => m.uid))
    );
    setPosting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/library/item/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body, mentions: activeMentions }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [...prev, data]);
        setText('');
        setMentions([]);
        setQuery(null);
        if (activeMentions.length > 0) {
          toast.success(`Notified ${activeMentions.length} ${activeMentions.length === 1 ? 'person' : 'people'}`);
        }
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  // Toggle a reaction optimistically; the server response (or a revert on
  // failure) reconciles the thread.
  const toggleReaction = async (commentId, emoji) => {
    if (!user?.uid) return;
    setPickerFor(null);
    const prev = comments;
    setComments(cs => cs.map(c => {
      if (c.id !== commentId) return c;
      const reactions = { ...(c.reactions || {}) };
      const uids = reactions[emoji] || [];
      const next = uids.includes(user.uid) ? uids.filter(u => u !== user.uid) : [...uids, user.uid];
      if (next.length === 0) delete reactions[emoji];
      else reactions[emoji] = next;
      return { ...c, reactions };
    }));
    try {
      const res = await authFetch(`${API_BASE}/api/library/item/${itemId}/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error('reaction failed');
      const data = await res.json();
      setComments(cs => cs.map(c => (c.id === commentId ? { ...c, reactions: data.reactions } : c)));
    } catch (err) {
      console.error('Failed to toggle reaction', err);
      setComments(prev);
      toast.error('Failed to react');
    }
  };

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MessageSquare size={20} className="text-blue-500" />
        Comments
        {comments.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {comments.length}
          </span>
        )}
      </h2>

      {/* Existing comments */}
      <div className="mb-5 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading comments…
          </div>
        ) : comments.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">No comments yet. Start the conversation and tag a teammate with @.</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="group flex gap-3">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase ${avatarColor(c.authorUid || c.authorName)}`}>
                {(c.authorName || '?').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-800">{c.authorName}</span>
                  <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                  {renderBody(c.text, knownHandles)}
                </p>

                {/* Reactions: pills for existing ones, hover-reveal picker for new */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {REACTION_EMOJI.filter(e => (c.reactions?.[e] || []).length > 0).map(e => {
                    const uids = c.reactions[e];
                    const mine = user && uids.includes(user.uid);
                    return (
                      <button
                        key={e}
                        type="button"
                        onClick={() => toggleReaction(c.id, e)}
                        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors ${
                          mine
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="leading-none">{e}</span>
                        <span className="text-xs font-medium">{uids.length}</span>
                      </button>
                    );
                  })}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPickerFor(p => (p === c.id ? null : c.id))}
                      title="Add reaction"
                      className={`flex items-center rounded-full border border-transparent p-1 text-slate-300 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-500 focus-visible:opacity-100 ${
                        pickerFor === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <SmilePlus className="h-4 w-4" />
                    </button>
                    {pickerFor === c.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setPickerFor(null)} />
                        <div className="absolute left-0 top-full z-20 mt-1 flex gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-lg">
                          {REACTION_EMOJI.map(e => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => toggleReaction(c.id, e)}
                              className="rounded-full p-1 text-lg leading-none transition-transform hover:scale-125 hover:bg-slate-50"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          rows={3}
          placeholder="Add a comment… type @ to tag someone"
          className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />

        {/* Mention autocomplete */}
        {query !== null && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 z-20 mb-1 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {suggestions.map((u, i) => (
              <button
                key={u.uid}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${i === activeIdx ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              >
                <AtSign className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{u.displayName || handleFor(u)}</span>
                  <span className="block truncate text-xs text-slate-400">{u.email}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">Tip: @ to tag · ⌘/Ctrl+Enter to post</span>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() || posting}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
