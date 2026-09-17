import { getPhotoById, deletePhotoRow } from "../../../lib/d1";
import { deletePreview, deleteEnhanced } from "../../../lib/r2";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { photoId } = req.body;
  if (!photoId) {
    return res.status(400).json({ error: "photoId is required" });
  }

  const photo = await getPhotoById(photoId);
  if (!photo) {
    return res.status(404).json({ error: "Photo not found" });
  }

  try {
    await Promise.all([
      deletePreview(photo.preview_key),
      deleteEnhanced(photo.enhanced_key),
    ]);
  } catch (err) {
    console.error(`Failed to delete R2 files for ${photoId}:`, err.message);
  }

  await deletePhotoRow(photoId);
  res.status(200).json({ status: "deleted" });
}
