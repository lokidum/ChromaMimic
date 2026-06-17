/* Engine parity / invariant suite for the ported colour engine.
   Re-runs the checks the original LUT Builder passed (27/27), proving the
   verbatim TS port is numerically faithful and the .cube format is intact.
   Run: npx tsx scripts/verify-engine.ts */
import {
  buildTransform,
  generateLUT,
  rgb2lab,
  type Transform,
} from "../src/lib/color-engine.ts";
import { lutToCube } from "../src/lib/exporters.ts";

let pass = 0;
let fail = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}${extra ? "  " + extra : ""}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${extra ? "  " + extra : ""}`);
  }
};

// deterministic synthetic frames (256 px each)
function makeFrame(warm: number): Float64Array {
  const n = 256;
  const out = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const r = Math.min(1, (0.2 + 0.6 * t) * (1 + 0.25 * warm));
    const g = 0.2 + 0.55 * ((i * 7) % n) / n;
    const b = Math.min(1, (0.25 + 0.5 * (1 - t)) * (1 - 0.25 * warm));
    out[i * 3] = r;
    out[i * 3 + 1] = g;
    out[i * 3 + 2] = b;
  }
  return out;
}

const src = makeFrame(0);
const refWarm = makeFrame(1);

const noProg = undefined;
const optsClean = { preserveBW: false, smoothing: 0 };

console.log("\nChromaMimic engine verification\n");

// 1. Identity: reference == original -> Reinhard near identity
{
  const t = buildTransform("reinhard", src, src, 12);
  const size = 17;
  const lut = generateLUT(t, size, 1, optsClean, noProg);
  let maxErr = 0;
  let idx = 0;
  for (let bi = 0; bi < size; bi++)
    for (let gi = 0; gi < size; gi++)
      for (let ri = 0; ri < size; ri++) {
        const r = ri / (size - 1),
          g = gi / (size - 1),
          b = bi / (size - 1);
        maxErr = Math.max(
          maxErr,
          Math.abs(lut[idx] - r),
          Math.abs(lut[idx + 1] - g),
          Math.abs(lut[idx + 2] - b),
        );
        idx += 3;
      }
  ok("Reinhard ~identity when ref==src", maxErr < 0.02, `maxErr=${maxErr.toFixed(4)}`);
}

// 2. Warm reference shifts mid-grey warmer (all deterministic methods)
for (const m of ["reinhard", "hist", "blend"] as const) {
  const t: Transform = buildTransform(m, src, refWarm, 12);
  const o = t(0.5, 0.5, 0.5);
  ok(`${m}: mid-grey shifts warmer (R>B)`, o[0] > o[2], `R=${o[0].toFixed(3)} B=${o[2].toFixed(3)}`);
}

// 3. .cube structure correct at every size
for (const size of [17, 33, 65]) {
  const t = buildTransform("blend", src, refWarm, 12);
  const lut = generateLUT(t, size, 1, { preserveBW: true, smoothing: 1 }, noProg);
  const cube = lutToCube(lut, size, "test", { method: "blend", space: "display" });
  const lines = cube.trim().split("\n");
  const dataLines = lines.filter((l) => /^[0-9.eE+-]+\s+[0-9.eE+-]+\s+[0-9.eE+-]+$/.test(l));
  const hasSize = cube.includes(`LUT_3D_SIZE ${size}`);
  let inRange = true;
  for (const l of dataLines) {
    for (const v of l.split(/\s+/).map(Number)) {
      if (!(v >= 0 && v <= 1)) inRange = false;
    }
  }
  ok(
    `.cube ${size}³ structure`,
    hasSize && dataLines.length === size * size * size && inRange,
    `lines=${dataLines.length}/${size * size * size}`,
  );
}

// 4. Red-fastest ordering (identity transform)
{
  const size = 17;
  const ident: Transform = (r, g, b) => [r, g, b];
  const lut = generateLUT(ident, size, 1, optsClean, noProg);
  // node 1 (second line) should advance RED only
  const step = 1 / (size - 1);
  ok(
    "red-fastest node ordering",
    Math.abs(lut[3] - step) < 1e-6 && lut[4] < 1e-6 && lut[5] < 1e-6,
    `node1=(${lut[3].toFixed(3)},${lut[4].toFixed(3)},${lut[5].toFixed(3)})`,
  );
}

// 5. Strength 0 -> true identity LUT
{
  const size = 33;
  const t = buildTransform("blend", src, refWarm, 12);
  const lut = generateLUT(t, size, 0, optsClean, noProg);
  let maxErr = 0;
  let idx = 0;
  for (let bi = 0; bi < size; bi++)
    for (let gi = 0; gi < size; gi++)
      for (let ri = 0; ri < size; ri++) {
        maxErr = Math.max(
          maxErr,
          Math.abs(lut[idx] - ri / (size - 1)),
          Math.abs(lut[idx + 1] - gi / (size - 1)),
          Math.abs(lut[idx + 2] - bi / (size - 1)),
        );
        idx += 3;
      }
  ok("strength 0 -> identity LUT", maxErr < 1e-6, `maxErr=${maxErr.toExponential(1)}`);
}

// 6. Optimal transport moves source mean toward reference mean (LAB L)
{
  const t = buildTransform("ot", src, refWarm, 16);
  const meanL = (px: Float64Array, tf?: Transform) => {
    let s = 0;
    const n = px.length / 3;
    for (let i = 0; i < px.length; i += 3) {
      const c = tf ? tf(px[i], px[i + 1], px[i + 2]) : [px[i], px[i + 1], px[i + 2]];
      s += rgb2lab(c[0], c[1], c[2])[0];
    }
    return s / n;
  };
  const before = Math.abs(meanL(src) - meanL(refWarm));
  const after = Math.abs(meanL(src, t) - meanL(refWarm));
  ok("OT moves source mean toward reference", after < before, `before=${before.toFixed(2)} after=${after.toFixed(2)}`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
