import { getAuthToken } from './auth';

const BASE = '/auth/conversations';

export async function listConversations() {
  const token = getAuthToken();
  const res = await fetch(BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.conversations as Array<{ id: string; title: string; date: string; messages: Array<{sender:'user'|'ai'; text: string}> }>;
}

export async function createConversationApi(title?: string) {
  const token = getAuthToken();
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.conversation as { id: string; title: string; date: string; messages: Array<{sender:'user'|'ai'; text: string}> };
}

export async function renameConversationApi(id: string, title: string) {
  const token = getAuthToken();
  const res = await fetch(`${BASE}/${id}/title`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function appendMessageApi(id: string, sender: 'user'|'ai', text: string) {
  const token = getAuthToken();
  const res = await fetch(`${BASE}/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sender, text }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function deleteConversationApi(id: string) {
  const token = getAuthToken();
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
