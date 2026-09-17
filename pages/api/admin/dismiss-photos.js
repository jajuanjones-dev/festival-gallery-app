import { markDriveFileProcessed } from "../../../lib/d1";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { driveFileIds } = req.body;
  if (!Array.isArray(driveFileIds) || driveFileIds.length === 0) {
    return res.status(400).json({ error: "Select at least one photo to dismiss." });
  }

  const results = [];
  for (const fileId of driveFileIds) {
    try {
      // "dismissed" is a placeholder, not a real photo - photo_id is required
      // by the table, but no actual photo gets created for a dismissed file.
      await markDriveFileProcessed(fileId, "dismissed");
      results.push({ fileId, status: "ok" });
    } catch (err) {
      console.error(`Failed to dismiss Drive file ${fileId}:`, err.message);
      results.push({ fileId, status: "error", error: err.message });
    }
  }
  res.status(200).json({ results });
}
