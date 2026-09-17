import { getPhotosByFestivalAndDate, getEvent } from "../../../lib/d1";

export default async function handler(req, res) {
  const { festivalId } = req.query;

  const event = await getEvent(festivalId);
  if (!event) {
    return res.status(404).json({ error: "We couldn't find that event." });
  }

  // The displayed date is now fully manual (event.event_date), completely
  // separate from any photo's internal timestamp. Photos are always fetched
  // by festivalId alone, regardless of when they were actually published,
  // so the gallery stays intact under one label no matter what day photos
  // get added.
  const dates = event.event_date ? [event.event_date] : [];
  const festival = { festivalId: event.id, displayName: event.display_name, dates };

  const photos = await getPhotosByFestivalAndDate(festivalId, null);
  const previewBase = process.env.PREVIEW_PUBLIC_URL;

  const shaped = photos.map((p) => ({
    id: p.id,
    timestamp: p.timestamp,
    previewUrl: `${previewBase}/${p.preview_key}`,
    purchased: !!p.purchased,
  }));

  res.status(200).json({ photos: shaped, festival });
}
