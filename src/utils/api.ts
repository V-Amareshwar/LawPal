// Simple and direct API client for chat requests

// In dev: always use the Vite proxy '/api/ask' (rewritten to backend '/ask').
// In prod: build absolute URL from env vars.
const DEV_PATH = '/api/ask';
const PROD_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
const PROD_ENDPOINT = (import.meta.env.VITE_CHAT_ENDPOINT as string | undefined) || '/ask';
const absoluteUrl = import.meta.env.DEV ? DEV_PATH : `${PROD_BASE}${PROD_ENDPOINT}`;

export type ChatResponse = {
  answer?: string;
  error?: string;
};

async function parseResponse(res: Response): Promise<string> {
  const data = (await res.json()) as ChatResponse;
  if (data.error) {
    throw new Error(`Backend Error: ${data.error}`);
  }
  const answer = data.answer;
  if (typeof answer === 'string' && answer.trim()) {
    return answer;
  }
  // Fallback if the 'answer' key is not found
  return "Received an unexpected response format from the server.";
}

export async function sendChatMessage(query: string, signal?: AbortSignal): Promise<string> {
  const controller = new AbortController();
  // Set a 180-second (3 min) timeout - first query may take time for model loading
  const timeout = setTimeout(() => controller.abort(), 600000);
  const usedSignal = signal ?? controller.signal;

  // Get auth token from localStorage
  const token = localStorage.getItem('authToken');

  try {
    const res = await fetch(absoluteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      // Our backend expects a JSON object with a "query" key.
      body: JSON.stringify({ query }),
      signal: usedSignal,
    });

    if (!res.ok) {
      // Try to parse JSON error first
      let detail = '';
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          const json = await res.json();
            detail = JSON.stringify(json).slice(0, 500);
        } catch {
          // fallback to text next
        }
      }
      if (!detail) {
        detail = await res.text().catch(() => 'Failed to read error response.');
      }
      throw new Error(`HTTP ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ''}`);
    }

    return await parseResponse(res);
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("Failed to send chat message:", msg);
    throw new Error(`Failed to communicate with the backend: ${msg}`);
  } finally {
    clearTimeout(timeout);
  }
}
