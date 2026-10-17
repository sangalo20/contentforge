import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User as UserIcon, Check, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getIdToken, API_BASE } from '../lib/api';

// Live studio session with Loki over a drafted carousel/poster. Fills the left
// pane of the full-screen studio: each message sends the CURRENT canvas content
// (including manual edits), and Loki's revisions stream back as `content`
// events which the parent applies to the canvas immediately (undo available).
// The conversation is ephemeral; the slides themselves are the durable state.
export default function StudioChat({ itemId, channel, kind, getContent, onContentUpdate }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: kind === 'carousel'
        ? 'I drafted these slides from your article. Tell me what to change: "punchier hook", "merge slides 3 and 4", "add a slide about pricing", anything. I update the canvas as we go, and you can edit any slide by hand at any time.'
        : 'I drafted this poster from your article. Tell me what to change: "shorter headline", "lead with the stat", anything. I update the canvas as we go, and you can edit the fields by hand at any time.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // The last message that ended in an error, so "Try again" can resend it
  // without the reviewer retyping.
  const [retryMsg, setRetryMsg] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (message, history) => {
    const token = await getIdToken();
    const res = await fetch(`${API_BASE}/api/odin/studio/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        itemId,
        channel,
        kind,
        message,
        content: getContent(),
        history: history.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Stream error: HTTP ${res.status}`);
    }

    // Placeholder assistant message we progressively fill in.
    setMessages((prev) => [...prev, { role: 'assistant', content: '', status: 'Odin is thinking...' }]);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';

    const updateLast = (patch) => {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], ...patch };
        return next;
      });
    };

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
        } else if (event.type === 'content') {
          onContentUpdate(event.content);
          updateLast({ status: null, updatedCanvas: true });
        } else if (event.type === 'reset') {
          // Model failover upstream: wipe the half-streamed reply; the backup
          // model re-answers from scratch (a status event explains the pause).
          answer = '';
          updateLast({ content: '', updatedCanvas: false });
        } else if (event.type === 'error') {
          answer += `${answer ? '\n\n' : ''}**Error:** ${event.content}`;
          updateLast({ content: answer, status: null, error: true });
          setRetryMsg(message);
        }
      }
    }
    updateLast({ status: null });
  };

  const sendMessage = async (userMsg) => {
    const history = messages;
    setRetryMsg(null);
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    try {
      await streamChat(userMsg, history);
    } catch (err) {
      console.error('[StudioChat] send failed:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: '**Error:** could not reach Odin.', error: true }]);
      setRetryMsg(userMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    sendMessage(userMsg);
  };

  const handleRetry = () => {
    if (isLoading || !retryMsg) return;
    sendMessage(retryMsg);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="custom-scrollbar flex-1 min-h-0 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
              msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-purple-100 text-purple-600'
            }`}>
              {msg.role === 'user' ? <UserIcon className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user'
                ? 'rounded-tr-none bg-blue-600 text-white'
                : 'rounded-tl-none border border-slate-200 bg-slate-50 text-slate-800'
            }`}>
              {msg.status && (
                <div className="mb-2 flex w-fit items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600">
                  <Loader2 className="size-3 animate-spin" />
                  {msg.status}
                </div>
              )}
              {msg.content && (
                <div className={`prose prose-sm max-w-none break-words ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
              {msg.updatedCanvas && (
                <div className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <Check className="size-3" /> Canvas updated
                </div>
              )}
              {msg.error && retryMsg && idx === messages.length - 1 && !isLoading && (
                <button
                  onClick={handleRetry}
                  className="mt-2 flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                >
                  <RefreshCw className="size-3" /> Try again
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-slate-200 bg-white p-3 shrink-0">
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
            placeholder={kind === 'carousel' ? 'e.g. "merge slides 3 and 4, punchier hook"...' : 'e.g. "shorter headline, lead with the stat"...'}
            rows={2}
            className="w-full resize-none overflow-hidden rounded-xl border-transparent bg-slate-100 py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Odin updates the canvas directly. Undo lives in the top bar; hand-edits are always yours to make.
        </p>
      </div>
    </div>
  );
}
