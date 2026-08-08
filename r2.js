import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 speaks the same S3 API, so this is the AWS SDK pointed at Cloudflare's
// endpoint instead of Amazon's - same code shape as the original S3 version.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Time-limited link to the full-res enhanced photo, from the private bucket.
export async function getDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: "eternalflame-originals",
    Key: key,
  });
  return getSignedUrl(r2, command, { expiresIn: 60 * 60 * 48 });
}
