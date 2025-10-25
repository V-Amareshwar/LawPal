// Authentication API client for MongoDB Atlas backend
// In dev, use Vite proxy with relative '/auth'. In prod, prefer VITE_API_BASE_URL if set, otherwise fall back to '/auth' so Vercel rewrites can forward.
const AUTH_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/auth';

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  token?: string;
}

async function handleAuthRequest(endpoint: string, data: SignUpData | SignInData): Promise<AuthResponse> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    // Try to parse JSON safely; some server errors may have empty body
    let result: any = null;
    const text = await res.text();
    try {
      result = text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn('Auth response was not JSON:', text);
    }

    if (!res.ok) {
      const message = (result && result.message) ? result.message : `HTTP ${res.status}: Authentication failed`;
      throw new Error(message);
    }

    // Store token if provided
    if (result && result.token) {
      localStorage.setItem('authToken', result.token);
    }

    return result as any;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error('Auth request failed:', msg);
    throw new Error(msg);
  }
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  return handleAuthRequest('/signup', data);
}

export async function signIn(data: SignInData): Promise<AuthResponse> {
  return handleAuthRequest('/signin', data);
}

export async function signOut(): Promise<void> {
  try {
    await fetch(`${AUTH_BASE_URL}/signout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Sign out failed:', err);
  } finally {
    localStorage.removeItem('authToken');
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
