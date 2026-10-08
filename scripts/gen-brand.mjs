/* Derives every icon size the site needs from the brand mark in assets/brand.
   Run: node scripts/gen-brand.mjs   (sharp is a devDependency) */
import sharp from "sharp";

const MARK = "assets/brand/chromamimic-mark-dark.webp";

const out = [
  ["public/logo-mark.png", 256],
  ["public/favicon-16.png", 16],
  ["public/favicon-32.png", 32],
  ["public/apple-touch-icon.png", 180],
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
];
for (const [file, size] of out) {
  await sharp(MARK).resize(size, size, { fit: "cover" }).png({ compressionLevel: 9 }).toFile(file);
}
console.log("wrote " + out.map(([f]) => f).join(", "));
