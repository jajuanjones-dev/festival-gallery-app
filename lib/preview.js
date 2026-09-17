import sharp from "sharp";

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]));
}

export async function makePreview(buffer, label = "Eternal Flame Photos - PREVIEW") {
  const safeLabel = escapeXml(label);

  const resizedBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resizedBuffer).metadata();
  const w = meta.width || 1200;
  const h = meta.height || 1200;

  // Randomized per photo - no single fixed pattern for a bulk-removal tool to learn
  const angle = [-30, -25, -20, 20, 25, 30][Math.floor(Math.random() * 6)];
  const offsetX = Math.floor(Math.random() * 60);
  const offsetY = Math.floor(Math.random() * 60);
  const tileFontSize = Math.max(16, Math.floor(w / 24));
  const stepX = tileFontSize * 8;
  const stepY = tileFontSize * 5;
  const bandFontSize = Math.max(30, Math.floor(w / 9));

  let tileText = "";
  for (let y = -stepY; y < h + stepY * 2; y += stepY) {
    for (let x = -stepX; x < w + stepX * 2; x += stepX) {
      tileText += `<text x="${x + offsetX}" y="${y + offsetY}">${safeLabel}</text>`;
    }
  }

  // Dark + light double-layer text ensures visibility over BOTH light and dark
  // parts of a photo - a single white layer disappears on bright backgrounds,
  // which is exactly why the old watermark was so easy to miss.
  const watermarkSvg = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .tileDark { fill: rgba(0,0,0,0.35); font-family: sans-serif; font-weight: 700; font-size: ${tileFontSize}px; }
        .tileLight { fill: rgba(255,255,255,0.45); font-family: sans-serif; font-weight: 700; font-size: ${tileFontSize}px; }
        .bandDark { fill: rgba(0,0,0,0.45); font-family: sans-serif; font-weight: 800; font-size: ${bandFontSize}px; }
        .bandLight { fill: rgba(255,255,255,0.55); font-family: sans-serif; font-weight: 800; font-size: ${bandFontSize}px; }
      </style>
      <g transform="rotate(${angle} ${w / 2} ${h / 2})">
        <g class="tileDark" transform="translate(1,1)">${tileText}</g>
        <g class="tileLight">${tileText}</g>
        <text x="-${w / 2}" y="${h / 2 + 1}" class="bandDark">${(safeLabel + "   ").repeat(8)}</text>
        <text x="-${w / 2}" y="${h / 2}" class="bandLight">${(safeLabel + "   ").repeat(8)}</text>
      </g>
    </svg>
  `);

  return sharp(resizedBuffer)
    .composite([{ input: watermarkSvg, gravity: "center" }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function makeEnhanced(buffer) {
  return sharp(buffer).rotate().jpeg({ quality: 95 }).toBuffer();
}
