/* Image helpers — main-thread only (need the DOM canvas).
   Ported verbatim from the original build. */
import { sampleLUT } from "./color-engine";

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith("image/")) {
      reject(new Error("That is not an image file. Use a JPG, PNG, TIFF or WebP still."));
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (!img.width || !img.height) {
        reject(new Error("That image could not be read."));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error("Could not decode that image. Try a JPG or PNG."));
    img.src = URL.createObjectURL(file);
  });
}

/* downsample to a flat RGB Float64Array in 0..1 (colour distribution only) */
export function samplePixels(img: HTMLImageElement, maxSide = 256): Float64Array {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale)),
    h = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const out = new Float64Array(w * h * 3);
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
    out[j] = d[i] / 255;
    out[j + 1] = d[i + 1] / 255;
    out[j + 2] = d[i + 2] / 255;
  }
  return out;
}

/* render the graded image at full resolution (for still exports), via trilinear LUT sample */
export function applyLUTToImage(
  img: HTMLImageElement,
  lut: Float32Array,
  size: number,
  maxSide: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale)),
    h = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h),
    d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const o = sampleLUT(lut, size, d[i] / 255, d[i + 1] / 255, d[i + 2] / 255);
    d[i] = o[0] * 255;
    d[i + 1] = o[1] * 255;
    d[i + 2] = o[2] * 255;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}
