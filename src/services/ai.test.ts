import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateProfessionalPortrait, editProfessionalPortrait } from './ai';
import type { IdentityLocks } from './ai';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const defaultLocks: IdentityLocks = {
  eyeColor: true,
  skinTone: true,
  hairLength: true,
  hairTexture: false,
  glasses: false,
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('generateProfessionalPortrait', () => {
  it('throws when server responds with an error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Failed to generate portrait' }),
    });

    await expect(
      generateProfessionalPortrait('base64data', 'image/jpeg', 'corporate', 50, 2, defaultLocks),
    ).rejects.toThrow('Failed to generate portrait');
  });

  it('returns array of image URLs on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ images: ['https://example.com/img1.png', 'https://example.com/img2.png'] }),
    });

    const result = await generateProfessionalPortrait(
      'base64data', 'image/jpeg', 'corporate', 50, 2, defaultLocks,
    );
    expect(result).toEqual(['https://example.com/img1.png', 'https://example.com/img2.png']);
  });

  it('sends the correct fields in the request body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ images: [] }),
    });

    await generateProfessionalPortrait('mybase64', 'image/png', 'linkedin', 75, 3, defaultLocks, 60, 'warm_smile');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/portraits/generate');
    const body = JSON.parse(options.body as string);
    expect(body.imageBase64).toBe('mybase64');
    expect(body.mimeType).toBe('image/png');
    expect(body.style).toBe('linkedin');
    expect(body.likenessStrength).toBe(75);
    expect(body.numImages).toBe(3);
    expect(body.naturalness).toBe(60);
    expect(body.expressionPreset).toBe('warm_smile');
  });
});

describe('editProfessionalPortrait', () => {
  it('throws when server responds with an error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Failed to edit portrait' }),
    });

    await expect(
      editProfessionalPortrait('base64data', 'remove background'),
    ).rejects.toThrow('Failed to edit portrait');
  });

  it('returns image data URL on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ image: 'data:image/png;base64,abc123' }),
    });

    const result = await editProfessionalPortrait('base64data', 'remove background');
    expect(result).toBe('data:image/png;base64,abc123');
  });
});

describe('IdentityLocks type', () => {
  it('has all required boolean fields', () => {
    const locks: IdentityLocks = {
      eyeColor: true,
      skinTone: false,
      hairLength: true,
      hairTexture: false,
      glasses: true,
    };
    expect(locks.eyeColor).toBe(true);
    expect(locks.skinTone).toBe(false);
    expect(locks.glasses).toBe(true);
  });
});
