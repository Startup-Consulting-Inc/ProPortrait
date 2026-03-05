import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';
import * as Sentry from '@sentry/node';
import authRouter from './routes/auth.js';
import paymentsRouter from './routes/payments.js';
import emailRouter from './routes/email.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { storePortrait } from './lib/storage.js';
import { trackCost, getDailySpend } from './lib/costTracker.js';
import { applyWatermark } from './lib/watermark.js';

// Load API key from .env.local (Vite convention), then .env as fallback
config({ path: '.env.local' });
config();

const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) Sentry.init({ dsn: sentryDsn, tracesSampleRate: 0.1 });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-image-preview';

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
  | 'confident_neutral'
  | 'warm_smile'
  | 'serious_authority'
  | 'approachable_expert';

type StyleOption =
  | 'corporate' | 'creative' | 'studio' | 'tech' | 'outdoor'
  | 'bw' | 'vintage' | 'cinematic' | 'cartoon' | 'art_deco'
  | 'linkedin' | 'resume' | 'speaker' | 'dating' | 'academic' | 'creative_industry';

// ── Prompt Builders ──────────────────────────────────────────────────────────

const STYLE_MAP: Record<StyleOption, string> = {
  corporate: "Professional corporate portrait, neutral office background, subtle contrast.",
  creative: "Modern creative portrait, tasteful color accents, bright and clean.",
  studio: "Classic studio portrait, controlled lighting, clean neutral backdrop.",
  tech: "Modern tech profile portrait, airy background, approachable professional look.",
  outdoor: "Bright outdoor portrait in warm afternoon daylight, natural and clear.",
  bw: "Black-and-white portrait with preserved midtones and facial detail (no crushed blacks).",
  vintage: "Subtle vintage film tone, gentle warmth, bright exposure, natural skin fidelity.",
  cinematic: "Subtle cinematic contrast and depth, but keep natural brightness and exact skin tone.",
  cartoon: "Stylized 3D character look while preserving facial identity and expression.",
  art_deco: "Elegant Art Deco-inspired portrait with refined geometric styling and bright face lighting.",
  linkedin: "LinkedIn-ready professional headshot, clean background, bright even face lighting.",
  resume: "Conservative resume headshot, neutral background, clear and formal presentation.",
  speaker: "Conference speaker portrait, confident and polished, bright key light on face.",
  dating: "Warm approachable portrait, natural flattering light, authentic and friendly.",
  academic: "Academic faculty portrait, thoughtful professional tone, clean balanced lighting.",
  creative_industry: "Editorial-style creative professional portrait, refined, modern, and bright.",
};

function buildExpressionInstruction(expression: ExpressionPreset): string {
  const expressions: Record<ExpressionPreset, string> = {
    natural: "Keep original expression naturally.",
    confident_neutral: "Confident neutral expression with relaxed jaw and focused eyes.",
    warm_smile: "Warm genuine smile with relaxed eyes and natural approachability.",
    serious_authority: "Serious authoritative expression with composed direct gaze.",
    approachable_expert: "Approachable expert expression with subtle confident smile.",
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
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait before generating more portraits.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(authMiddleware);

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dailySpend: getDailySpend() });
});

app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/email', emailRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

app.post('/api/portraits/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server configuration error: API key not configured.' });
    return;
  }

  const imageSize = req.auth.isPro ? '2K' : '1K';
  const userId = req.auth.uid ?? req.auth.sessionId ?? 'anon';
  trackCost(req.auth.isPro ? 'pro_generate' : 'free_generate');

  const {
    imageBase64,
    mimeType,
    style = 'corporate',
    likenessStrength = 50,
    numImages = 2,
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

  const safeNumImages = Math.min(Math.max(parseInt(String(numImages), 10) || 2, 1), 4);

  const ai = new GoogleGenAI({ apiKey });

  const finalPrompt = buildCorePrompt({
    style: style as StyleOption,
    selectedPersonHint,
    identityLocks,
    likenessStrength,
    expressionPreset: expressionPreset as ExpressionPreset,
    naturalness,
    removeBlemishes,
  });

  const generateSingle = async (): Promise<string> => {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { text: finalPrompt },
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
    throw new Error("No image generated in retouch pass.");
  };

  try {
    const rawImages = await Promise.all(Array(safeNumImages).fill(null).map(() => generateSingle()));

    const finalImages = removeBlemishes
      ? await Promise.all(rawImages.map((b64) => retouchPass(b64)))
      : rawImages;

    // Apply watermark for free users, then store
    const watermarkedImages = await Promise.all(
      finalImages.map((b64) => applyWatermark(b64, req.auth.isPro)),
    );
    const outputMime = 'image/png';
    const images = await Promise.all(
      watermarkedImages.map((b64) => storePortrait(b64, userId, outputMime)),
    );

    res.json({ images });
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

  const editImageSize = req.auth.isPro ? '2K' : '1K';
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

  if (imageBase64.length > 14_000_000) {
    res.status(400).json({ error: 'Image too large. Maximum size is 10MB.' });
    return;
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

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: imageBase64, mimeType: 'image/png' } },
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
