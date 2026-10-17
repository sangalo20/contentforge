// The agentic loop with the backend as the hands: forward Odin's SSE events
// to the client, intercept tool_call events, execute the matching tool here
// (where authz, Firestore, and Athena live), and call Odin back with the
// round-trip in history. Shared by the scout and studio proxies.
const MAX_ROUNDS = 5; // absolute backstop; normal turns exit on round one

async function runOdinToolLoop({ req, callOdin, executors, message, history, send, onTool }) {
  let clientGone = false;
  let currentUpstream = null;
  req.on('close', () => {
    clientGone = true;
    if (currentUpstream && typeof currentUpstream.destroy === 'function') currentUpstream.destroy();
  });

  // Forward Odin's events to the client, but intercept tool calls we can
  // execute and remember the assistant text (it belongs in the tool
  // round-trip history).
  const consumeUpstream = (stream) => new Promise((resolve, reject) => {
    let buffer = '';
    let text = '';
    const toolCalls = [];
    stream.on('data', (chunk) => {
      buffer += chunk.toString();
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
        if (event.type === 'tool_call' && executors[event.content?.name]) {
          toolCalls.push(event.content);
          continue;
        }
        if (event.type === 'text') text += event.content;
        send(event);
      }
    });
    stream.on('end', () => resolve({ text, toolCalls }));
    stream.on('error', reject);
  });

  const convo = (Array.isArray(history) ? history : []).map((h) => ({
    role: h.role || 'user',
    content: h.content || '',
  }));
  let pendingMessage = message;
  let spokenText = '';

  for (let round = 0; round < MAX_ROUNDS && !clientGone; round++) {
    const upstream = await callOdin(convo, pendingMessage);
    currentUpstream = upstream.data;
    const { text, toolCalls } = await consumeUpstream(upstream.data);
    spokenText += text;
    if (!toolCalls.length) break;

    if (pendingMessage) {
      convo.push({ role: 'user', content: pendingMessage });
      pendingMessage = '';
    }
    convo.push({
      role: 'assistant',
      content: text,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: JSON.stringify({ ...tc, id: undefined, name: undefined }),
        },
      })),
    });
    for (const tc of toolCalls) {
      const result = await executors[tc.name](tc);
      convo.push({ role: 'tool', tool_call_id: tc.id, content: result });
      // Observability hook (e.g. typed memory events); never breaks the loop.
      if (onTool) {
        try {
          await onTool(tc, result);
        } catch { /* best-effort */ }
      }
    }
  }
  return { spokenText };
}

module.exports = { runOdinToolLoop };
