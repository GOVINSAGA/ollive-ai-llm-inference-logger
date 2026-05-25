const API_BASE = '/api';

/**
 * API Client — handles all HTTP requests to the backend.
 */

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Conversations ──────────────────────────────────────

export async function createConversation(title) {
  return request('POST', '/conversations', { title });
}

export async function listConversations() {
  return request('GET', '/conversations');
}

export async function getConversation(id) {
  return request('GET', `/conversations/${id}`);
}

export async function updateConversation(id, updates) {
  return request('PATCH', `/conversations/${id}`, updates);
}

export async function deleteConversation(id) {
  return request('DELETE', `/conversations/${id}`);
}

export async function cancelConversation(id) {
  return request('POST', `/conversations/${id}/cancel`);
}

// ── Messages (SSE Streaming) ───────────────────────────

/**
 * Send a message and receive streaming response via SSE.
 * @param {string} conversationId
 * @param {string} message
 * @param {function} onToken - Called with each token string
 * @param {function} onDone - Called with full assistant message object
 * @param {function} onError - Called on error
 * @param {AbortSignal} [signal] - For cancellation
 */
export function sendMessage(conversationId, message, { onToken, onDone, onError, signal }) {
  const controller = new AbortController();
  const combinedSignal = signal || controller.signal;

  fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal: combinedSignal,
  })
    .then(async (response) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          try {
            const data = JSON.parse(trimmed.slice(5).trim());

            if (data.type === 'token' && onToken) {
              onToken(data.content);
            } else if (data.type === 'done' && onDone) {
              onDone(data.message);
            } else if (data.type === 'error' && onError) {
              onError(data.error);
            }
          } catch (e) {
            // Skip malformed data
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim().startsWith('data:')) {
        try {
          const data = JSON.parse(buffer.trim().slice(5).trim());
          if (data.type === 'done' && onDone) onDone(data.message);
        } catch (e) {}
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError' && onError) {
        onError(err.message);
      }
    });

  return controller;
}

// ── Logs & Stats ───────────────────────────────────────

export async function fetchLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request('GET', `/logs${qs ? '?' + qs : ''}`);
}

export async function fetchStats(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request('GET', `/logs/stats${qs ? '?' + qs : ''}`);
}
