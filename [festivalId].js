import { getPhotosByFestivalAndDate } from "../../../lib/d1";
import { getFestival } from "../../../lib/festivals";

export default async function handler(req, res) {
  const { festivalId, date } = req.query;

  const festival = getFestival(festivalId);
  if (!festival) {
    return res.status(404).json({ error: "We couldn't find that event." });
  }

  const photos = await getPhotosByFestivalAndDate(festivalId, date);
  const previewBase = process.env.PREVIEW_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

  const shaped = photos.map((p) => ({
    id: p.id,
    timestamp: p.timestamp,
    previewUrl: `${previewBase}/${p.preview_key}`,
    purchased: !!p.purchased,
  }));

  res.status(200).json({ photos: shaped, festival });
}
