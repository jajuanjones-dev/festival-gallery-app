import crypto from "crypto";
import { downloadFile } from "../../../lib/drive";
import { makePreview, makeEnhanced } from "../../../lib/preview";
import { uploadPreview, uploadEnhanced } from "../../../lib/r2";
import { insertPhoto, markDriveFileProcessed } from "../../../lib/d1";
import { isAuthorized } from "../../../lib/adminAuth";
import { nowEventLocalTimestamp } from "../../../lib/time";

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { festivalId, driveFileIds } = req.body;
  if (!festivalId || !Array.isArray(driveFileIds) || driveFileIds.length === 0) {
    return res.status(400).json({ error: "Select at least one photo to publish." });
  }

  const results = [];

  for (const fileId of driveFileIds) {
    try {
      const original = await downloadFile(fileId);
      const [preview, enhanced] = await Promise.all([
        makePreview(original),
        makeEnhanced(original),
      ]);

      const photoId = crypto.randomUUID();
      const timestamp = nowEventLocalTimestamp();
      const previewKey = `${festivalId}/${photoId}-preview.jpg`;
      const enhancedKey = `${festivalId}/${photoId}-full.jpg`;

      await Promise.all([
        uploadPreview(previewKey, preview),
        uploadEnhanced(enhancedKey, enhanced),
      ]);

      await insertPhoto({ id: photoId, festivalId, timestamp, previewKey, enhancedKey });
      await markDriveFileProcessed(fileId, photoId);

      results.push({ fileId, status: "ok" });
    } catch (err) {
      console.error(`Failed to publish Drive file ${fileId}:`, err.message);
      results.push({ fileId, status: "error", error: err.message });
    }
  }

  res.status(200).json({ results });
}
