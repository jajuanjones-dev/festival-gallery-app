import exifr from "exifr";

export async function getPhotoTimestamp(buffer, fallbackTimestamp) {
  try {
    const data = await exifr.parse(buffer, { pick: ["DateTimeOriginal", "CreateDate"] });
    const raw = data?.DateTimeOriginal || data?.CreateDate;
    if (raw instanceof Date && !isNaN(raw)) {
      return raw.toISOString();
    }
  } catch {
    // fall through to fallback below
  }
  return fallbackTimestamp;
}
