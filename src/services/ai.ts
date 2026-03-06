// Type exports — used by components
export type IdentityLocks = {
  eyeColor: boolean;
  skinTone: boolean;
  hairLength: boolean;
  hairTexture: boolean;
  glasses: boolean;
};

export type ExpressionPreset =
  | 'natural'
  | 'confident'
  | 'warm_smile'
  | 'serious';

export type StyleOption =
  | 'editorial'
  | 'environmental'
  | 'candid'
  | 'vintage'
  | 'bw'
  | 'cyberpunk'
  | 'watercolor';

// ── API calls — all Gemini requests go through the backend proxy ─────────────
// In dev: VITE_API_URL is unset → empty string → Vite proxy handles /api/*
// In production: VITE_API_URL=https://proportrait-api-22835475779.us-central1.run.app
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

import { getIdToken } from './auth';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function generateProfessionalPortrait(
  imageBase64: string,
  mimeType: string,
  style: StyleOption = 'editorial',
  likenessStrength: number = 50,
  numImages: number = 2,
  identityLocks: IdentityLocks = { eyeColor: true, skinTone: true, hairLength: true, hairTexture: false, glasses: false },
  naturalness: number = 50,
  expressionPreset: ExpressionPreset = 'warm_smile',
  selectedPersonHint: string | null = null,
  removeBlemishes: boolean = true,
): Promise<string[]> {
  const authH = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/portraits/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authH },
    credentials: 'include',
    body: JSON.stringify({
      imageBase64,
      mimeType,
      style,
      likenessStrength,
      numImages,
      identityLocks,
      naturalness,
      expressionPreset,
      selectedPersonHint,
      removeBlemishes,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.images as string[];
}

export async function editProfessionalPortrait(
  imageData: string,  // base64 string OR https:// URL (R2 signed URL)
  instruction: string,
  regionOnly?: string,
): Promise<string> {
  const isUrl = imageData.startsWith('http');
  const authH2 = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/portraits/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authH2 },
    credentials: 'include',
    body: JSON.stringify({
      ...(isUrl ? { imageUrl: imageData } : { imageBase64: imageData }),
      instruction,
      regionOnly,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.image as string;
}
