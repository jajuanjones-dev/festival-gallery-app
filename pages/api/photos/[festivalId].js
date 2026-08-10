import { getPhotosByFestivalAndDate, getEvent, getDatesForEvent } from "../../../lib/d1";

export default async function handler(req, res) {
  const { festivalId, date } = req.query;

  const event = await getEvent(festivalId);
  if (!event) {
    return res.status(404).json({ error: "We couldn't find that event." });
  }

  const dates = await getDatesForEvent(festivalId);
  const festival = { festivalId: event.id, displayName: event.display_name, dates };

  const photos = await getPhotosByFestivalAndDate(festivalId, date);
  const previewBase = process.env.PREVIEW_PUBLIC_URL;

  const shaped = photos.map((p) => ({
    id: p.id,
    timestamp: p.timestamp,
    previewUrl: `${previewBase}/${p.preview_key}`,
    purchased: !!p.purchased,
  }));

  res.status(200).json({ photos: shaped, festival });
}
