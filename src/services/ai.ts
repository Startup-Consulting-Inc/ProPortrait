import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-image-preview';

export type IdentityLocks = {
  eyeColor: boolean;
  skinTone: boolean;
  hairLength: boolean;
  hairTexture: boolean;
  glasses: boolean;
};

export type ExpressionPreset =
  | 'natural'
  | 'confident_neutral'
  | 'warm_smile'
  | 'serious_authority'
  | 'approachable_expert';

export type StyleOption =
  | 'corporate' | 'creative' | 'studio' | 'tech' | 'outdoor'
  | 'bw' | 'vintage' | 'cinematic' | 'cartoon' | 'art_deco'
  | 'linkedin' | 'resume' | 'speaker' | 'dating' | 'academic' | 'creative_industry';

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

type CorePromptOptions = {
  style: StyleOption;
  selectedPersonHint: string | null;
  identityLocks: IdentityLocks;
  likenessStrength: number;
  expressionPreset: ExpressionPreset;
  naturalness: number;
  removeBlemishes: boolean;
};

function buildCorePrompt(options: CorePromptOptions): string {
  const {
    style,
    selectedPersonHint,
    identityLocks,
    likenessStrength,
    expressionPreset,
    naturalness,
    removeBlemishes,
  } = options;

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

export async function generateProfessionalPortrait(
  imageBase64: string,
  mimeType: string,
  style: StyleOption = 'corporate',
  likenessStrength: number = 50,
  numImages: number = 2,
  identityLocks: IdentityLocks = { eyeColor: true, skinTone: true, hairLength: true, hairTexture: false, glasses: false },
  naturalness: number = 50,
  expressionPreset: ExpressionPreset = 'confident_neutral',
  selectedPersonHint: string | null = null,
  removeBlemishes: boolean = true,
): Promise<string[]> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found. Please select an API key.");

  const ai = new GoogleGenAI({ apiKey });

  const finalPrompt = buildCorePrompt({
    style,
    selectedPersonHint,
    identityLocks,
    likenessStrength,
    expressionPreset,
    naturalness,
    removeBlemishes,
  });
  console.log('[ProPortrait] Final prompt (generate):', finalPrompt);

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
        imageConfig: { aspectRatio: '3:4', imageSize: '1K' },
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated in the response.");
  };

  const retouchPass = async (generatedDataUrl: string): Promise<string> => {
    const base64Data = generatedDataUrl.split(',')[1];
    console.log('[ProPortrait] Running retouch pass...');
    const retouchPrompt =
      "Professionally retouch this portrait photo. " +
      "Remove ALL visible blemishes, spots, acne, dark circles, age spots, hyperpigmentation, and enlarged pores from the face. " +
      "Make the skin look clean, clear, and smooth like a high-end magazine cover. " +
      "CRITICAL: Keep everything else EXACTLY the same — do not change the face shape, identity, expression, clothing, background, lighting, composition, or skin tone. " +
      "Only modify the skin surface quality.";
    console.log('[ProPortrait] Retouch prompt:', retouchPrompt);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { text: retouchPrompt },
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
        ],
      },
      config: {
        imageConfig: { aspectRatio: '3:4', imageSize: '1K' },
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated in retouch pass.");
  };

  try {
    const generated = await Promise.all(Array(numImages).fill(null).map(() => generateSingle()));

    if (!removeBlemishes) {
      return generated;
    }

    console.log('[ProPortrait] Applying retouch pass to', generated.length, 'images...');
    const retouched = await Promise.all(generated.map((img) => retouchPass(img)));
    return retouched;
  } catch (error) {
    console.error("Error generating portrait:", error);
    throw error;
  }
}

export async function editProfessionalPortrait(
  imageBase64: string,
  instruction: string,
  regionOnly?: string,
): Promise<string> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found. Please select an API key.");

  const ai = new GoogleGenAI({ apiKey });

  const identityCore = "CRITICAL: Preserve the exact facial features, identity, ethnicity, age, expression, and facial structure.";
  const regionInstruction = regionOnly
    ? `${identityCore} ONLY modify: ${regionOnly}. Preserve everything else exactly as-is.`
    : identityCore;

  let prompt = `${regionInstruction} Edit this image. Instruction: ${instruction}. Maintain high quality, 8k, photorealistic.`;
  if (instruction.toLowerCase().includes('transparent')) {
    prompt += " The output image MUST have a transparent background (alpha channel).";
  }

  console.log('[ProPortrait] Final prompt (edit):', prompt);

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
        imageConfig: { aspectRatio: '3:4', imageSize: '1K' },
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated in the response.");
  } catch (error) {
    console.error("Error editing portrait:", error);
    throw error;
  }
}
