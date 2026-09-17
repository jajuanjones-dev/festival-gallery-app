import { getPhotosForEvent, deletePhotoRow, deleteEventRow } from "../../../lib/d1";
import { deletePreview, deleteEnhanced } from "../../../lib/r2";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { festivalId } = req.body;
  if (!festivalId) {
    return res.status(400).json({ error: "festivalId is required" });
  }

  const photos = await getPhotosForEvent(festivalId);

  for (const photo of photos) {
    try {
      await Promise.all([
        deletePreview(photo.preview_key),
        deleteEnhanced(photo.enhanced_key),
      ]);
    } catch (err) {
      console.error(`Failed to delete R2 files for photo ${photo.id}:`, err.message);
    }
    await deletePhotoRow(photo.id);
  }

  await deleteEventRow(festivalId);

  res.status(200).json({ status: "deleted", photosDeleted: photos.length });
}
