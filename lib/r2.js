import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const ORIGINALS_BUCKET = "eternalflame-originals";
const PREVIEWS_BUCKET = process.env.R2_PREVIEWS_BUCKET || "eternalflame-previews";

export async function getDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: ORIGINALS_BUCKET,
    Key: key,
  });
  return getSignedUrl(r2, command, { expiresIn: 60 * 60 * 48 });
}

export async function uploadEnhanced(key, buffer) {
  await r2.send(
    new PutObjectCommand({
      Bucket: ORIGINALS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  );
}

export async function uploadPreview(key, buffer) {
  await r2.send(
    new PutObjectCommand({
      Bucket: PREVIEWS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  );
}
