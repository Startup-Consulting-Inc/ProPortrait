import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export const r2Enabled = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

/**
 * Store a portrait image in Cloudflare R2 and return a 24h signed URL.
 * Falls back to returning the original base64 data URL if R2 is not configured.
 */
export async function storePortrait(
  base64Data: string,
  sessionId: string,
  mimeType: string = 'image/jpeg',
): Promise<string> {
  if (!r2Enabled) {
    // Fallback: return data URL directly (memory-heavy but works without R2)
    return `data:${mimeType};base64,${base64Data}`;
  }

  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const key = `portraits/${sessionId}/${randomUUID()}.${ext}`;
  const bucket = process.env.R2_BUCKET_NAME!;

  const body = Buffer.from(base64Data, 'base64');

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
    }),
  );

  const url = await getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 60 * 60 * 24 }, // 24 hours
  );

  return url;
}
