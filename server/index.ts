import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';
import sharp from 'sharp';
import * as Sentry from '@sentry/node';
import authRouter from './routes/auth.js';
import paymentsRouter from './routes/payments.js';
import emailRouter from './routes/email.js';
import contactRouter from './routes/contact.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import { authMiddleware, requireFirebaseAuth } from './middleware/authMiddleware.js';
import { storePortrait, storePermanentPortrait, getSignedUrlForKey, deleteR2Object } from './lib/storage.js';
import { trackCost, getDailySpend } from './lib/costTracker.js';
import { trackGeneration, trackEdit, trackExport, getUserDoc, checkSaveLimit, savePortraitDoc, getSavedPortraits, deleteSavedPortrait } from './lib/firestore.js';
import { applyWatermark } from './lib/watermark.js';

// Load API key from .env.local (Vite convention), then .env as fallback
config({ path: '.env.local' });
config();

const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) Sentry.init({ dsn: sentryDsn, tracesSampleRate: 0.1 });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Trust proxy headers when running behind Cloud Run load balancer
// Required for express-rate-limit to correctly identify users
app.set('trust proxy', 1);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-image-preview';

// Compress image to JPEG ≤6MB base64 before sending to Gemini for editing
async function compressForEdit(base64: string): Promise<{ data: string; mimeType: string }> {
  const buf = Buffer.from(base64, 'base64');
  const compressed = await sharp(buf)
    .resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { data: compressed.toString('base64'), mimeType: 'image/jpeg' };
}

// ── Types ────────────────────────────────────────────────────────────────────

type IdentityLocks = {
  eyeColor: boolean;
  skinTone: boolean;
  hairLength: boolean;
  hairTexture: boolean;
  glasses: boolean;
};

type ExpressionPreset =
  | 'natural'
  | 'confident'
  | 'warm_smile'
  | 'serious';

type StyleOption =
  | 'editorial'
  | 'environmental'
  | 'candid'
  | 'vintage'
  | 'bw'
  | 'cyberpunk'
  | 'watercolor';

// ── Prompt Builders ──────────────────────────────────────────────────────────

const STYLE_MAP: Record<StyleOption, string> = {
  editorial: "Ultra-realistic, unretouched close-up portrait. High-end editorial studio lighting with a soft key light and subtle rim-lighting. Skin shows visible pores, fine micro-texture, and subtle natural imperfections. Clean, neutral background. Shot on 85mm lens, shallow depth of field (f/1.8), realistic shadows, natural facial geometry.",
  environmental: "Ultra-realistic environmental portrait of the subject in a meaningful, modern workspace context. Soft, diffused natural window lighting. The background is slightly blurred with a shallow depth of field to keep focus on the subject. Relaxed shoulders, authentic expression, natural skin texture with realistic hydration shine.",
  candid: "Raw, spontaneous, candid lifestyle portrait. Unposed, lived-in human energy. Natural daylight, intentional slight imperfections, subtle sensor grain, and a hint of motion blur. Hyper-detailed skin texture, zero retouching, zero beauty filters, everyday scene.",
  vintage: "Vintage 35mm analog film portrait. Soft faded colors, warm film grain, subtle light leaks, retro 1960s Kodachrome aesthetic. Natural facial geometry and skin fidelity maintained. Emphasizes character and mood, highly emotional and intimate.",
  bw: "Black-and-white portrait with preserved midtones and natural facial detail. No crushed blacks. Skin rendered in full tonal range — no porcelain or over-smoothed surfaces. Film-like grain preserved. Emphasizes form, light, and expression over color.",
  cyberpunk: "Cinematic cyberpunk portrait at night. Illuminated by high-contrast, glowing neon pink and blue lights. Dark urban background, dramatic chiaroscuro shadows. Skin reflects neon tones naturally while preserving micro-texture, pores, and human realism. High-tech, dystopian atmosphere.",
  watercolor: "Delicate watercolor illustration portrait. Soft edges, translucent water-based bleeding effects, visible paper texture. Soft diffused lighting, no hard digital lines, authentic traditional media aesthetic. Warm, approachable, and handcrafted feel.",
};

function buildExpressionInstruction(expression: ExpressionPreset): string {
  const expressions: Record<ExpressionPreset, string> = {
    natural: "Keep the subject's original expression exactly as captured in the source photo. Do not alter facial muscles, mouth position, or eye engagement.",
    confident: "Confident neutral expression. Relaxed jaw, no forced smile, direct and focused eye contact, composed posture. Subtle inner calm.",
    warm_smile: "Warm, genuine smile with natural Duchenne markers — slight squinch of the outer eyes, subtle teeth visible, relaxed cheeks. Approachable and human, not performative.",
    serious: "Strong composed gaze, no expression movement, strong jaw, authority-forward. Eyes engaged but unsmiling. Gravitas without coldness.",
  };
  return expressions[expression];
}

function buildPersonSelector(selectedPersonHint: string | null): string {
  const personDescriptions: Record<string, string> = {
    left: "person on the left side of the image",
    center: "person in the center of the image",
    right: "person on the right side of the image",
  };
  return personDescriptions[selectedPersonHint || ""] ?? selectedPersonHint ?? "primary subject";
}

function buildIdentityLockInstruction(identityLocks: IdentityLocks, likenessStrength: number): string {
  const lockParts: string[] = [];
  if (identityLocks.eyeColor) lockParts.push("exact eye color");
  if (identityLocks.skinTone) lockParts.push("exact skin tone and undertone");
  if (identityLocks.hairLength) lockParts.push("exact hair length");
  if (identityLocks.hairTexture) lockParts.push("exact hair texture");
  if (identityLocks.glasses) lockParts.push("glasses must remain");

  const likenessLevel = likenessStrength >= 80
    ? "very strict identity fidelity"
    : likenessStrength >= 50
      ? "high identity fidelity"
      : "moderate identity fidelity";

  const lockText = lockParts.length > 0 ? lockParts.join(", ") : "preserve identity by default";
  return `Identity fidelity: ${likenessLevel}. Preserve: ${lockText}.`;
}

function buildSkinDescription(naturalness: number, removeBlemishes: boolean): string {
  const smoothnessDesc = naturalness <= 33
    ? "with natural skin texture visible"
    : naturalness <= 66
      ? "with realistic but refined skin character"
      : "with polished smooth skin (not plastic)";

  if (removeBlemishes) {
    return `The subject's skin in the output must appear clean, clear, and professionally retouched ${smoothnessDesc}. There must be NO visible blemishes, spots, acne, dark circles, age spots, or enlarged pores on the face. The skin should look like a high-end magazine portrait after professional retouching.`;
  }
  return `The subject's skin should look natural and authentic ${smoothnessDesc}, preserving existing texture, pores, and minor imperfections as they appear in the reference.`;
}

function buildCorePrompt(options: {
  style: StyleOption;
  selectedPersonHint: string | null;
  identityLocks: IdentityLocks;
  likenessStrength: number;
  expressionPreset: ExpressionPreset;
  naturalness: number;
  removeBlemishes: boolean;
}): string {
  const { style, selectedPersonHint, identityLocks, likenessStrength, expressionPreset, naturalness, removeBlemishes } = options;

  const personSelector = buildPersonSelector(selectedPersonHint);
  const identityInstruction = buildIdentityLockInstruction(identityLocks, likenessStrength);
  const expressionInstruction = buildExpressionInstruction(expressionPreset);
  const skinDescription = buildSkinDescription(naturalness, removeBlemishes);
  const skinToneRule = identityLocks.skinTone
    ? "Keep exact skin tone and undertone from reference. Do not darken or lighten skin. No color-cast shift."
    : "Preserve natural skin tone and avoid unnatural color shifts.";

  return [
    "ROLE: Professional portrait retoucher and photographer.",
    "",
    "SUBJECT SELECTION:",
    `Use ONLY the selected person from the reference image: ${personSelector}. Ignore all other people.`,
    "",
    "PRIORITY ORDER (highest to lowest):",
    "1) Identity fidelity",
    "2) Skin tone fidelity",
    "3) Bright, clean lighting",
    "4) Skin quality (described in OUTPUT)",
    "5) Requested style",
    "",
    "IDENTITY + SKIN TONE (STRICT):",
    identityInstruction,
    skinToneRule,
    "Preserve exact facial identity, ethnicity, and key facial structure.",
    "Note: clean skin is NOT an identity change. Blemishes are not part of identity.",
    "",
    "EXPRESSION:",
    expressionInstruction,
    "",
    "LIGHTING:",
    "Bright, even, flattering portrait lighting.",
    "No underexposure, no crushed shadows, no muddy blacks.",
    "Face must be fully visible and clear.",
    "",
    "COMPOSITION:",
    "Head-and-shoulders portrait (mid-chest up), full head visible, small headroom.",
    "Do not crop too tight.",
    "Keep clean refined background without artifacts.",
    "",
    "STYLE:",
    STYLE_MAP[style],
    "",
    "OUTPUT (the generated image MUST match this description):",
    "Photorealistic, high clarity, sharp facial detail, professional quality.",
    skinDescription,
  ].join("\n");
}

// ── Middleware ───────────────────────────────────────────────────────────────

// Stripe webhook must receive raw body — register BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://portrait.ai-biz.app',
      'https://proportrait.ai',
    ];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait before generating more portraits.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/portraits', limiter);
// Disable browser caching for all API responses
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(authMiddleware);

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dailySpend: getDailySpend() });
});

// POST /api/portraits/export — track platform export (fire-and-forget, no heavy work)
app.post('/api/portraits/export', (req, res) => {
  const { platform } = req.body as { platform?: string };
  if (req.auth.uid && platform) void trackExport(req.auth.uid, platform);
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/email', emailRouter);
app.use('/api/contact', contactRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

// POST /api/portraits/save — save a portrait to the user's library
app.post('/api/portraits/save', requireFirebaseAuth, async (req, res) => {
  const uid = req.auth.uid!;
  const { imageBase64, mimeType = 'image/png', style = 'editorial', title } = req.body as {
    imageBase64?: string; mimeType?: string; style?: string; title?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64 is required' });
    return;
  }

  try {
    const doc = await getUserDoc(uid);
    await checkSaveLimit(uid, doc ?? { email: '', displayName: '', isAdmin: false });
    const { r2Key, imageUrl } = await storePermanentPortrait(imageBase64, uid, mimeType);
    const id = await savePortraitDoc(uid, r2Key, style, title);
    res.json({ id, imageUrl, style, title });
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    if (e.code === 'save_limit') {
      res.status(403).json({ error: 'save_limit', message: e.message });
    } else {
      console.error('[portraits/save]', err);
      res.status(500).json({ error: 'Failed to save portrait.' });
    }
  }
});

// GET /api/portraits/saved — list user's saved portraits
app.get('/api/portraits/saved', requireFirebaseAuth, async (req, res) => {
  const uid = req.auth.uid!;
  try {
    const portraits = await getSavedPortraits(uid);
    // Re-sign all R2 URLs (7-day fresh URLs)
    const withUrls = await Promise.all(
      portraits.map(async (p) => ({
        id: p.id,
        style: p.style,
        title: p.title,
        createdAt: p.createdAt,
        imageUrl: p.r2Key ? await getSignedUrlForKey(p.r2Key) : '',
      })),
    );
    // Filter out portraits with missing images (corrupted/missing R2 data)
    const validPortraits = withUrls.filter((p) => p.imageUrl !== '');
    res.json({ portraits: validPortraits });
  } catch (err) {
    console.error('[portraits/saved]', err);
    res.status(500).json({ error: 'Failed to fetch saved portraits.' });
  }
});

// DELETE /api/portraits/saved/:id — delete a saved portrait
app.delete('/api/portraits/saved/:id', requireFirebaseAuth, async (req, res) => {
  const uid = req.auth.uid!;
  const { id } = req.params;
  try {
    const r2Key = await deleteSavedPortrait(uid, id);
    if (r2Key) void deleteR2Object(r2Key);
    res.json({ ok: true });
  } catch (err) {
    console.error('[portraits/saved/delete]', err);
    res.status(500).json({ error: 'Failed to delete portrait.' });
  }
});

app.post('/api/portraits/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server configuration error: API key not configured.' });
    return;
  }

  const imageSize = '2K';
  const userId = req.auth.uid ?? req.auth.sessionId ?? 'anon';
  trackCost('generate');

  const {
    imageBase64,
    mimeType,
    style = 'corporate',
    likenessStrength = 50,
    numImages = 1,
    identityLocks = { eyeColor: true, skinTone: true, hairLength: true, hairTexture: false, glasses: false },
    naturalness = 50,
    expressionPreset = 'confident_neutral',
    selectedPersonHint = null,
    removeBlemishes = true,
  } = req.body;

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: 'Missing required fields: imageBase64, mimeType' });
    return;
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(mimeType)) {
    res.status(400).json({ error: 'Invalid image type. Upload JPG, PNG, or WEBP.' });
    return;
  }

  // ~10MB check on base64 size
  if (imageBase64.length > 14_000_000) {
    res.status(400).json({ error: 'Image too large. Maximum size is 10MB.' });
    return;
  }

  const safeNumImages = Math.min(Math.max(parseInt(String(numImages), 10) || 1, 1), 4);

  const ai = new GoogleGenAI({ apiKey });

  // Build per-slot expressions: slot 0 = user's choice, slots 1-3 cycle through the rest
  const ALL_EXPRESSIONS: ExpressionPreset[] = ['warm_smile', 'confident', 'serious', 'natural'];
  const slotExpressions: ExpressionPreset[] = [expressionPreset as ExpressionPreset];
  for (const expr of ALL_EXPRESSIONS) {
    if (slotExpressions.length >= safeNumImages) break;
    if (expr !== expressionPreset) slotExpressions.push(expr);
  }

  const generateSingle = async (slotExpression: ExpressionPreset): Promise<string> => {
    const prompt = buildCorePrompt({
      style: style as StyleOption,
      selectedPersonHint,
      identityLocks,
      likenessStrength,
      expressionPreset: slotExpression,
      naturalness,
      removeBlemishes,
    });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: imageBase64, mimeType } },
        ],
      },
      config: {
        imageConfig: { aspectRatio: '3:4', imageSize },
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }
    }
    throw new Error("No image generated in response.");
  };

  const retouchPass = async (base64Data: string): Promise<string> => {
    const retouchPrompt =
      "Professionally retouch this portrait photo. " +
      "Remove ALL visible blemishes, spots, acne, dark circles, age spots, hyperpigmentation, and enlarged pores from the face. " +
      "Make the skin look clean, clear, and smooth like a high-end magazine cover. " +
      "CRITICAL: Keep everything else EXACTLY the same — do not change the face shape, identity, expression, clothing, background, lighting, composition, or skin tone. " +
      "Only modify the skin surface quality.";

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            { text: retouchPrompt },
            { inlineData: { data: base64Data, mimeType: 'image/png' } },
          ],
        },
        config: {
          imageConfig: { aspectRatio: '3:4', imageSize },
        },
      });

      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts ?? []) {
          if (part.inlineData?.data) {
            return part.inlineData.data;
          }
        }
      }
      // If no image returned, fall back to original
      console.warn('[server] Retouch pass returned no image, using original');
      return base64Data;
    } catch (err) {
      // If retouch fails, return original image instead of failing entire request
      console.warn('[server] Retouch pass failed, using original:', err);
      return base64Data;
    }
  };

  try {
    const rawImages = await Promise.all(slotExpressions.map((expr) => generateSingle(expr)));

    const finalImages = removeBlemishes
      ? await Promise.all(rawImages.map((b64) => retouchPass(b64)))
      : rawImages;

    // No watermark — credit-based model, all generations are full quality
    const watermarkedImages = await Promise.all(
      finalImages.map((b64) => applyWatermark(b64, true)),
    );
    const outputMime = 'image/png';
    const images = await Promise.all(
      watermarkedImages.map((b64) => storePortrait(b64, userId, outputMime)),
    );

    res.json({ images });
    if (req.auth.uid) void trackGeneration(req.auth.uid, style as string);
  } catch (error) {
    console.error('[server] Error generating portrait:', error);
    res.status(502).json({ error: 'Failed to generate portrait. Please try again.' });
  }
});

app.post('/api/portraits/edit', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server configuration error: API key not configured.' });
    return;
  }

  const editImageSize = '2K';
  trackCost('edit');

  const { imageBase64: rawBase64, imageUrl, instruction, regionOnly } = req.body;

  if ((!rawBase64 && !imageUrl) || !instruction) {
    res.status(400).json({ error: 'Missing required fields: imageBase64 or imageUrl, instruction' });
    return;
  }

  if (typeof instruction !== 'string' || instruction.length > 500) {
    res.status(400).json({ error: 'Invalid instruction. Must be a string under 500 characters.' });
    return;
  }

  // If client sent a URL (R2 signed URL), fetch it server-side to get base64
  let imageBase64 = rawBase64 as string;
  if (!imageBase64 && imageUrl) {
    try {
      const imgRes = await fetch(imageUrl as string);
      const buffer = await imgRes.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString('base64');
    } catch {
      res.status(400).json({ error: 'Failed to fetch image from URL.' });
      return;
    }
  }

  const identityCore = "CRITICAL: Preserve the exact facial features, identity, ethnicity, age, expression, and facial structure.";
  const regionInstruction = regionOnly
    ? `${identityCore} ONLY modify: ${regionOnly}. Preserve everything else exactly as-is.`
    : identityCore;

  let prompt = `${regionInstruction} Edit this image. Instruction: ${instruction}. Maintain high quality, 8k, photorealistic.`;
  if (instruction.toLowerCase().includes('transparent')) {
    prompt += " The output image MUST have a transparent background (alpha channel).";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Compress to JPEG ≤1536px before sending — keeps payload well under 10MB
  const { data: editBase64, mimeType: editMimeType } = await compressForEdit(imageBase64);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: editBase64, mimeType: editMimeType } },
        ],
      },
      config: {
        imageConfig: { aspectRatio: '3:4', imageSize: editImageSize },
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData?.data) {
          res.json({ image: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}` });
          if (req.auth.uid) void trackEdit(req.auth.uid);
          return;
        }
      }
    }
    res.status(502).json({ error: 'No image generated in response.' });
  } catch (error) {
    console.error('[server] Error editing portrait:', error);
    res.status(502).json({ error: 'Failed to edit portrait. Please try again.' });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

if (sentryDsn) app.use(Sentry.expressErrorHandler());

const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
app.listen(PORT, host, () => {
  console.log(`[server] ProPortrait API running on http://${host}:${PORT}`);
});
