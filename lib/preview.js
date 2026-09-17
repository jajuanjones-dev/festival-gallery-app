import sharp from "sharp";

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]));
}

export async function makePreview(buffer, label = "ETERNAL FLAME PHOTOS - PREVIEW") {
  const safeLabel = escapeXml(label);

  const resizedBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resizedBuffer).metadata();
  const w = meta.width || 1200;
  const h = meta.height || 1200;

  const angle = [-30, -25, -20, 20, 25, 30][Math.floor(Math.random() * 6)];
  const offset = Math.floor(Math.random() * 40);

  const stripeWidth = Math.max(14, Math.floor(w / 40));
  const stripeGap = stripeWidth * 3;
  let stripes = "";
  for (let x = -h; x < w + h; x += stripeGap) {
    stripes += `<rect x="${x + offset}" y="-50" width="${stripeWidth}" height="${h * 3}" fill="rgba(0,0,0,0.4)" />`;
  }

  const bandHeight = Math.max(70, Math.floor(h / 7));
  const bandFontSize = Math.max(28, Math.floor(w / 11));

  const watermarkSvg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${angle} ${w / 2} ${h / 2})">
        ${stripes}
        <rect x="-${w}" y="${h / 2 - bandHeight / 2}" width="${w * 3}" height="${bandHeight}" fill="rgba(0,0,0,0.65)" />
        <text x="50%" y="${h / 2}" text-anchor="middle" dominant-baseline="central" fill="rgba(255,255,255,0.98)" font-family="sans-serif" font-weight="bold" font-size="${bandFontSize}">${safeLabel}</text>
      </g>
    </svg>`
  );

  return sharp(resizedBuffer)
    .composite([{ input: watermarkSvg, top: 0, left: 0 }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function makeEnhanced(buffer) {
  return sharp(buffer).rotate().jpeg({ quality: 95 }).toBuffer();
}
