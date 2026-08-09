import sharp from "sharp";

// Downsized + watermarked version for the public gallery. Watermarking
// matters here specifically because this is a paid-download business - an
// un-watermarked preview is just a free download.
export async function makePreview(buffer, label = "Eternal Flame Photos") {
  const resized = sharp(buffer).rotate().resize({ width: 1400, withoutEnlargement: true });
  const meta = await resized.metadata();
  const w = meta.width || 1400;
  const h = meta.height || 1400;
  const fontSize = Math.max(24, Math.floor(w / 14));

  const watermarkSvg = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wm { fill: rgba(255,255,255,0.32); font-family: sans-serif; font-weight: 700;
              font-size: ${fontSize}px; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            class="wm" transform="rotate(-28 ${w / 2} ${h / 2})">${label}</text>
    </svg>
  `);

  return resized
    .composite([{ input: watermarkSvg, gravity: "center" }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

// Full-quality version for paid downloads - just normalizes orientation
// (phone photos often carry rotation as metadata rather than actual pixels).
export async function makeEnhanced(buffer) {
  return sharp(buffer).rotate().jpeg({ quality: 95 }).toBuffer();
}
