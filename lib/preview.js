import sharp from "sharp";

const WATERMARK_URL = `${process.env.PREVIEW_PUBLIC_URL}/watermark-tile.png`;

export async function makePreview(buffer) {
  const resizedBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .toBuffer();

  const res = await fetch(WATERMARK_URL);
  const tileBuffer = Buffer.from(await res.arrayBuffer());

  return sharp(resizedBuffer)
    .composite([{ input: tileBuffer, tile: true, blend: "over" }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function makeEnhanced(buffer) {
  return sharp(buffer).rotate().jpeg({ quality: 95 }).toBuffer();
}
