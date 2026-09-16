import { getPhotosForEvent } from "../../../lib/d1";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { festivalId } = req.query;
  if (!festivalId) {
    return res.status(400).json({ error: "festivalId is required" });
  }

  const photos = await getPhotosForEvent(festivalId);
  const previewBase = process.env.PREVIEW_PUBLIC_URL;
  const shaped = photos.map((p) => ({
    id: p.id,
    timestamp: p.timestamp,
    previewUrl: `${previewBase}/${p.preview_key}`,
  }));

  res.status(200).json({ photos: shaped });
}
