import { getIdToken } from './auth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface SavedPortrait {
  id: string;
  imageUrl: string;
  style: string;
  title: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export async function savePortrait(
  imageBase64: string,
  mimeType: string,
  style: string,
  title?: string,
): Promise<SavedPortrait> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/portraits/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ imageBase64, mimeType, style, title }),
    credentials: 'include',
  });
  const data = await res.json() as { error?: string; message?: string } & SavedPortrait;
  if (!res.ok) {
    throw Object.assign(new Error(data.message ?? data.error ?? 'Failed to save portrait'), {
      code: data.error,
    });
  }
  return data;
}

export async function getSavedPortraits(): Promise<SavedPortrait[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/portraits/saved`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch saved portraits');
  const data = await res.json() as { portraits: SavedPortrait[] };
  return data.portraits;
}

export async function deleteSavedPortrait(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/portraits/saved/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete portrait');
}
