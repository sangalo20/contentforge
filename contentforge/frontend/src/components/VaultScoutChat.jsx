import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, X, Layers, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { authFetch, API_BASE } from '../lib/api';

// The scouting session (Mimir agent backstage, branded as Odin — one
// assistant face for users): a chat over this workspace's Source Vault
// that helps pick the transcript(s) for the next piece. Proposals
// render as cards; "Use these" hands the picks back to the composer as vault
// source cards. Modeled on StudioChat's SSE loop.
export default function VaultScoutChat({ workspaceId, onUseSources, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const openedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = useCallback(async (message, history, { hidden = false } = {}) => {
    setIsLoading(true);
    if (!hidden) setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', status: 'Connecting to Odin...' }]);

    const updateLast = (patch) => {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], ...patch };
        return next;
      });
    };

    try {
      const res = await authFetch(`${API_BASE}/api/vault/scout/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          message,
          history: history.filter((m) => !m.error && !m.proposal).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Stream error: HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          let event;
          try {
            event = JSON.parse(trimmed.slice(5).trim());
          } catch {
            continue;
          }
          if (event.type === 'status') {
            updateLast({ status: event.content });
          } else if (event.type === 'text') {
            answer += event.content;
            updateLast({ content: answer, status: null });
          } else if (event.type === 'proposal') {
            updateLast({ status: null, proposal: event.content });
          } else if (event.type === 'error') {
            answer += `${answer ? '\n\n' : ''}**Error:** ${event.content}`;
            updateLast({ content: answer, status: null, error: true });
          }
        }
      }
      updateLast({ status: null });
    } catch (err) {
      console.error('[VaultScout] send failed:', err);
      updateLast({ content: '**Error:** could not reach Odin. Try again.', status: null, error: true });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Open the session: Mimir leads with the lay of the land (hidden seed turn).
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    streamChat('Open the session: give me the lay of the land and help me pick what to make next.', [], { hidden: true });
  }, [streamChat]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    streamChat(userMsg, messages);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => !isLoading && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scout the vault"
        className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Layers size={16} /></div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Scout the vault</h2>
            <p className="text-[11px] text-slate-500">Odin helps you pick the transcripts for your next piece.</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 min-h-0 space-y-4 overflow-y-auto p-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-tr-none bg-blue-600 text-white'
                  : 'rounded-tl-none border border-slate-200 bg-slate-50 text-slate-800'
              }`}>
                {msg.status && (
                  <div className="flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                    <Loader2 className="size-3 animate-spin" /> {msg.status}
                  </div>
                )}
                {msg.content && (
                  <div className={`prose prose-sm max-w-none break-words ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}
                {msg.proposal && (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Proposal</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{msg.proposal.workingTitle}</p>
                    <p className="mt-0.5 text-xs italic text-slate-600">{msg.proposal.angle}</p>
                    <ul className="mt-2 space-y-1.5">
                      {msg.proposal.picks.map((p) => (
                        <li key={p.vaultId} className="text-xs text-slate-700">
                          <span className="font-semibold">{p.title}</span> — {p.reason}
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      onClick={() => onUseSources(msg.proposal)}
                      className="mt-3 h-8 bg-blue-600 px-4 text-xs font-semibold hover:bg-blue-700"
                    >
                      <CheckCircle2 size={13} className="mr-1.5" /> Use these {msg.proposal.picks.length > 1 ? `${msg.proposal.picks.length} sources` : 'source'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={'e.g. "something about financing", "pair a podcast with a lesson", "surprise me"...'}
              rows={2}
              className="w-full resize-none rounded-xl border-transparent bg-slate-100 py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              aria-label="Send"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
