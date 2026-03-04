import sharp from 'sharp';

// Semi-transparent white text SVG — composited bottom-right of the portrait
const WM_SVG = Buffer.from(
  `<svg width="220" height="32" xmlns="http://www.w3.org/2000/svg">` +
  `<text x="110" y="22" text-anchor="middle" font-family="Arial,sans-serif" ` +
  `font-size="15" font-weight="bold" letter-spacing="1" fill="white" opacity="0.55">` +
  `ProPortrait AI` +
  `</text></svg>`,
);

/**
 * Apply a "ProPortrait AI" watermark to the bottom-right of a portrait image.
 * Pro users receive the clean image unchanged.
 *
 * @param base64Data  Raw base64 image data (no data-URL prefix)
 * @param isPro       If true, the image is returned as-is
 * @returns           Base64 image data with watermark applied (PNG)
 */
export async function applyWatermark(base64Data: string, isPro: boolean): Promise<string> {
  if (isPro) return base64Data;

  const input = Buffer.from(base64Data, 'base64');
  const { width = 800, height = 1000 } = await sharp(input).metadata();

  // 12px margin from bottom-right edge
  const left = Math.max(0, width - 220 - 12);
  const top = Math.max(0, height - 32 - 12);

  const output = await sharp(input)
    .composite([{ input: WM_SVG, left, top }])
    .png()
    .toBuffer();

  return output.toString('base64');
}
