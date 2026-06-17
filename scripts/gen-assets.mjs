/* One-off generator for raster brand assets (og-image, apple-touch-icon).
   Run: node scripts/gen-assets.mjs  (requires sharp as a devDependency)
   Uses system sans-serif so it renders without bundled fonts. */
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const BG = "#100f0c";
const ACCENT = "#e8c9a0";
const TEXT = "#f4f3ef";
const MUTED = "#b8b3a8";
const FAINT = "#7d796f";
const FONT = "Helvetica, Arial, sans-serif";

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="85%" cy="18%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="grade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#39506b"/>
      <stop offset="50%" stop-color="#5b5550"/>
      <stop offset="100%" stop-color="#7d5a39"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- mark + wordmark -->
  <g transform="translate(80,76)">
    <circle cx="13" cy="16" r="9" fill="none" stroke="${MUTED}" stroke-width="2.2"/>
    <circle cx="25" cy="16" r="9" fill="none" stroke="${ACCENT}" stroke-width="2.2"/>
    <circle cx="19" cy="16" r="3" fill="${ACCENT}"/>
    <text x="52" y="23" font-family="${FONT}" font-size="26" font-weight="600" fill="${TEXT}" letter-spacing="0.5">ChromaMimic</text>
  </g>

  <!-- headline -->
  <text x="80" y="290" font-family="${FONT}" font-size="74" font-weight="700" fill="${TEXT}" letter-spacing="-1.5">Match any film look.</text>
  <text x="80" y="372" font-family="${FONT}" font-size="74" font-weight="700" fill="${ACCENT}" letter-spacing="-1.5">Export a free .cube LUT.</text>

  <!-- subline -->
  <text x="80" y="436" font-family="${FONT}" font-size="24" fill="${MUTED}">Drop two frames, learn the colour transform, download a .cube. In your browser.</text>

  <!-- grade strip -->
  <rect x="80" y="486" width="1040" height="6" rx="3" fill="url(#grade)"/>

  <!-- footers -->
  <text x="80" y="548" font-family="${FONT}" font-size="20" font-weight="600" fill="${FAINT}" letter-spacing="3">FREE · IN YOUR BROWSER · NOTHING UPLOADED</text>
  <text x="1120" y="548" text-anchor="end" font-family="${FONT}" font-size="20" fill="${FAINT}">Resolve · Premiere · Final Cut</text>
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="${BG}"/>
  <g transform="translate(90,90) scale(4.2) translate(-16,-16)">
    <circle cx="13" cy="16" r="6.5" fill="none" stroke="${MUTED}" stroke-width="1.6"/>
    <circle cx="19" cy="16" r="6.5" fill="none" stroke="${ACCENT}" stroke-width="1.6"/>
    <circle cx="16" cy="16" r="2" fill="${ACCENT}"/>
  </g>
</svg>`;

writeFileSync("public/og-image.svg", og);

await sharp(Buffer.from(og)).png().toFile("public/og-image.png");
await sharp(Buffer.from(icon)).png().toFile("public/apple-touch-icon.png");
console.log("Generated public/og-image.png (1200x630) and public/apple-touch-icon.png (180x180)");
