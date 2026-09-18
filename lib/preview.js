import sharp from "sharp";

// Cache-busting: appending a timestamp query param forces a fresh fetch every
// time, bypassing any CDN/edge caching on the watermark file. Without this,
// swapping the file in R2 can take a while to actually show up, since the
// old cached version keeps getting served under the hood.
const WATERMARK_BASE_URL = `${process.env.PREVIEW_PUBLIC_URL}/watermark-tile.png`;

export async function makePreview(buffer) {
  const resizedBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .toBuffer();

  const cacheBustedUrl = `${WATERMARK_BASE_URL}?v=${Date.now()}`;
  const res = await fetch(cacheBustedUrl, { cache: "no-store" });
  const tileBuffer = Buffer.from(await res.arrayBuffer());

  return sharp(resizedBuffer)
    .composite([{ input: tileBuffer, tile: true, blend: "over" }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function makeEnhanced(buffer) {
  return sharp(buffer).rotate().jpeg({ quality: 95 }).toBuffer();
}
