import sharp from "sharp";

export async function makePreview(buffer) {
  const resizedBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resizedBuffer).metadata();
  const w = meta.width || 1200;
  const h = meta.height || 1200;

  const bandHeight = Math.max(40, Math.floor(h / 12));
  const gap = bandHeight * 2;

  // No SVG at all here - this is sharp's most basic operation (create a solid
  // rectangle, composite it). If this doesn't show up, the problem isn't the
  // watermark design, it's something else entirely in the pipeline.
  const bandBuffer = await sharp({
    create: {
      width: w,
      height: bandHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.55 },
    },
  })
    .png()
    .toBuffer();

  const composites = [];
  for (let y = 0; y < h; y += gap) {
    composites.push({ input: bandBuffer, top: y, left: 0 });
  }

  return sharp(resizedBuffer)
    .composite(composites)
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function makeEnhanced(buffer) {
  return sharp(buffer).rotate().jpeg({ quality: 95 }).toBuffer();
}
