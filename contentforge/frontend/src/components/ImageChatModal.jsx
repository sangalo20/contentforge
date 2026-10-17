import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { getIdToken, API_BASE } from '../lib/api';

export default function ImageChatModal({ onClose, draftContent, initialPrompt, onApproveImage, workspaceId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const systemPrompt = `You are Odin, the orchestrator and Art Director. The user needs a cover image for the following blog draft. Read it in full to understand its themes, tone, and key ideas before proposing visual concepts.

--- BLOG DRAFT ---
${draftContent}
--- END DRAFT ---

Discuss the creative direction conversationally and refine the concept with the user. If the user approves an image concept, use your tool to delegate the generation to Hermes.`;

  // Stream Odin's reply over SSE, mutating the last assistant message in place
  // as `text`, `status`, `image` and `error` events arrive. Routed through the
  // ContentForge backend proxy so Odin can stay backend-only (Cloud Run IAM).
  // Memoized on the system prompt so the init effect below re-fires exactly
  // when the draft context changes.
  const streamChat = useCallback(async (message, history) => {
    const token = await getIdToken();
    const res = await fetch(`${API_BASE}/api/odin/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        system_prompt: systemPrompt,
        agent_id: 'odin',
        // Usage attribution only — which workspace this spend belongs to.
        ...(workspaceId ? { workspaceId } : {}),
        context: { history },
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream error: HTTP ${res.status}`);
    }

    // Push a placeholder assistant message we progressively fill in.
    setMessages(prev => [...prev, { role: 'assistant', content: '', status: 'Thinking...', imageUrl: null }]);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';

    const updateLast = (patch) => {
      setMessages(prev => {
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
        } else if (event.type === 'image') {
          updateLast({ imageUrl: event.url, status: null });
        } else if (event.type === 'error') {
          answer += `\n\n**Error:** ${event.content}`;
          updateLast({ content: answer, status: null });
        }
      }
    }
  }, [systemPrompt]);

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'cover-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, '_blank');
    }
  };

  // Initial hidden prompt kick-off
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);

      const initMessage = initialPrompt
        ? `Hello Odin, I have a pre-written prompt for my cover image. Please immediately delegate generation to Hermes using this exact concept: "${initialPrompt}"`
        : "Hello Odin, I need a cover image for my blog post. What do you suggest?";

      try {
        await streamChat(initMessage, []);
      } catch (err) {
        console.error("Init chat error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [streamChat, initialPrompt]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    const history = messages;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      await streamChat(userMsg, history);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-foreground/10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <Bot className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight text-slate-900">Odin</h3>
              <p className="text-xs text-slate-500">Art Director Agent</p>
            </div>
          </div>
          <button
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {msg.role === 'user' ? <UserIcon className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-tr-none bg-blue-600 text-white'
                  : 'rounded-tl-none border border-slate-200 bg-white text-slate-800'
              }`}>
                {msg.status && (
                  <div className="mb-2 flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
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

                {msg.imageUrl && (
                  <div className="mt-3 not-prose">
                    <img
                      src={msg.imageUrl}
                      alt="Generated Cover"
                      className="mb-2 w-full rounded-lg"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        className="flex-1"
                        onClick={() => onApproveImage(msg.imageUrl)}
                      >
                        Approve & Use Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(msg.imageUrl)}
                        title="Download Image"
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Bot className="size-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                <span className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe the cover, or refine Odin's idea..."
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
            Odin is an AI agent and can make mistakes. Always review generated images before publishing.
          </p>
        </div>
      </div>
    </div>
  );
}
