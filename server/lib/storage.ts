import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
      // R2 does not support AWS SDK v3 checksum extensions — disable them
      // to prevent x-amz-checksum-mode=ENABLED from appearing in presigned URLs.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
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

/**
 * Store a portrait permanently for a saved library entry.
 * Returns the R2 key (for re-signing later) and a 7-day signed URL.
 * Falls back to data URL if R2 is not configured.
 */
export async function storePermanentPortrait(
  base64Data: string,
  uid: string,
  mimeType: string = 'image/png',
): Promise<{ r2Key: string; imageUrl: string }> {
  if (!r2Enabled) {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    return { r2Key: '', imageUrl: dataUrl };
  }

  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const r2Key = `saves/${uid}/${randomUUID()}.${ext}`;
  const bucket = process.env.R2_BUCKET_NAME!;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: r2Key,
      Body: Buffer.from(base64Data, 'base64'),
      ContentType: mimeType,
    }),
  );

  const imageUrl = await getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket, Key: r2Key }),
    { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
  );

  return { r2Key, imageUrl };
}

/**
 * Generate a fresh 7-day signed URL for an existing R2 key.
 */
export async function getSignedUrlForKey(r2Key: string): Promise<string> {
  if (!r2Enabled || !r2Key) return '';
  const bucket = process.env.R2_BUCKET_NAME!;
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket, Key: r2Key }),
    { expiresIn: 60 * 60 * 24 * 7 },
  );
}

/**
 * Delete an object from R2 by key. Fire-and-forget safe.
 */
export async function deleteR2Object(r2Key: string): Promise<void> {
  if (!r2Enabled || !r2Key) return;
  const bucket = process.env.R2_BUCKET_NAME!;
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: r2Key }));
}
