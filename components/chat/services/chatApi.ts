const BASE_URL = import.meta.env.VITE_CHAT_BACKEND_URL?.trim() ?? '';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const chatApi = {
  startChat(params: {
    firstName: string;
    phone: string;
    email?: string;
    serviceType: string;
    trackingNumber?: string;
    language: string;
  }) {
    return post<{ success: true; sessionId: string; contactId: string }>('/api/chat/start', params);
  },

  sendMessage(sessionId: string, message: string) {
    return post<{ success: true; messageId: string }>('/api/chat/send', { sessionId, message });
  },

  getMessages(sessionId: string) {
    return get<{ success: true; messages: import('../types/chat.types').ChatMessage[] }>(
      `/api/chat/messages/${sessionId}`
    );
  },

  closeSession(sessionId: string) {
    return post<{ success: true }>('/api/chat/close', { sessionId });
  },
};
