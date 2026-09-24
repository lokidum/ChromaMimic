/* One-off generator for the landing-page demo stills.
   Runs the real ChromaMimic engine (same code the tool ships) on a
   before/reference pair and writes before / reference / after JPGs.
   Run: npx tsx scripts/gen-demo.ts <before.jpg> <reference.jpg> */
import sharp from "sharp";
import { buildTransform, generateLUT, sampleLUT } from "../src/lib/color-engine.ts";

const [beforePath, refPath] = process.argv.slice(2);
if (!beforePath || !refPath) {
  console.error("usage: npx tsx scripts/gen-demo.ts <before.jpg> <reference.jpg>");
  process.exit(1);
}

const OUT_W = 1600;
const QUALITY = 82;

async function pixels(path: string, maxSide: number): Promise<Float64Array> {
  const { data, info } = await sharp(path)
    .resize(maxSide, maxSide, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = new Float64Array(info.width * info.height * 3);
  for (let i = 0; i < out.length; i++) out[i] = data[i] / 255;
  return out;
}

const srcPx = await pixels(beforePath, 256);
const refPx = await pixels(refPath, 256);

// Same defaults as the tool: blend method, 33³, preserve black/white, 1 smoothing pass.
const match = buildTransform("blend", srcPx, refPx, 12);
const STRENGTH = 0.85;
const t = (r: number, g: number, b: number) => {
  const m = match(r, g, b);
  return [r + (m[0] - r) * STRENGTH, g + (m[1] - g) * STRENGTH, b + (m[2] - b) * STRENGTH];
};
const SIZE = 33;
const lut = generateLUT(t, SIZE, 1, { preserveBW: true, smoothing: 1 });

const before = sharp(beforePath).resize(OUT_W, undefined, { withoutEnlargement: true }).removeAlpha();
const { data, info } = await before.clone().raw().toBuffer({ resolveWithObject: true });
const after = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += 3) {
  const o = sampleLUT(lut, SIZE, data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
  after[i] = Math.round(o[0] * 255);
  after[i + 1] = Math.round(o[1] * 255);
  after[i + 2] = Math.round(o[2] * 255);
}

await before.clone().jpeg({ quality: QUALITY, mozjpeg: true }).toFile("public/samples/demo-before.jpg");
await sharp(refPath)
  .resize(OUT_W, undefined, { withoutEnlargement: true })
  .jpeg({ quality: QUALITY, mozjpeg: true })
  .toFile("public/samples/demo-reference.jpg");
await sharp(after, { raw: { width: info.width, height: info.height, channels: 3 } })
  .jpeg({ quality: QUALITY, mozjpeg: true })
  .toFile("public/samples/demo-after.jpg");

console.log(`wrote public/samples/demo-{before,reference,after}.jpg at ${info.width}x${info.height}`);
