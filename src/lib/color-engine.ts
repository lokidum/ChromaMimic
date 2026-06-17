/* ============================================================
   ChromaMimic — client-side colour transfer + 3D LUT engine
   Ported VERBATIM (logic-identical) from the original LUT Builder
   build. Do not change the math: the exported .cube must remain
   byte-comparable to the validated reference (27/27 checks).

   Hardened: NaN guards, LUT smoothing/regularisation, black/white
   normalisation, strength blend toward identity.
   ============================================================ */

export type Vec3 = [number, number, number];
export type Transform = (r: number, g: number, b: number) => number[];

export type Grade = {
  temp: number;
  tint: number;
  exp: number;
  con: number;
  sat: number;
  vib: number;
  sha: number;
  hig: number;
  fad: number;
};

export type Method = "reinhard" | "hist" | "blend" | "ot";
export type Space = "display" | "log";

export type BuildOptions = {
  preserveBW: boolean;
  smoothing: number;
};

/* ---------- colour space helpers ---------- */
export function s2l(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
export function l2s(c: number): number {
  c = Math.max(0, Math.min(1, c));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
const Xn = 0.95047,
  Yn = 1.0,
  Zn = 1.08883;
function fLab(t: number): number {
  return t > 0.008856451 ? Math.cbrt(t) : 7.787037 * t + 0.137931;
}
function fLabInv(t: number): number {
  const t3 = t * t * t;
  return t3 > 0.008856451 ? t3 : (t - 0.137931) / 7.787037;
}
export function rgb2lab(r: number, g: number, b: number): number[] {
  const R = s2l(r),
    G = s2l(g),
    B = s2l(b);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / Xn,
    Y = (0.2126 * R + 0.7152 * G + 0.0722 * B) / Yn,
    Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / Zn;
  const fx = fLab(X),
    fy = fLab(Y),
    fz = fLab(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export function lab2rgb(L: number, a: number, b: number): number[] {
  const fy = (L + 16) / 116,
    fx = fy + a / 500,
    fz = fy - b / 200;
  const X = Xn * fLabInv(fx),
    Y = Yn * fLabInv(fy),
    Z = Zn * fLabInv(fz);
  const R = 3.2406 * X - 1.5372 * Y - 0.4986 * Z,
    G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
    B = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  return [l2s(R), l2s(G), l2s(B)];
}

/* ---------- statistics ---------- */
function meanStdLab(px: Float64Array) {
  const n = px.length / 3,
    m = [0, 0, 0];
  const labs = new Float64Array(n * 3);
  for (let i = 0, j = 0; i < px.length; i += 3, j += 3) {
    const l = rgb2lab(px[i], px[i + 1], px[i + 2]);
    labs[j] = l[0];
    labs[j + 1] = l[1];
    labs[j + 2] = l[2];
    m[0] += l[0];
    m[1] += l[1];
    m[2] += l[2];
  }
  m[0] /= n;
  m[1] /= n;
  m[2] /= n;
  const v = [0, 0, 0];
  for (let j = 0; j < labs.length; j += 3) {
    v[0] += (labs[j] - m[0]) ** 2;
    v[1] += (labs[j + 1] - m[1]) ** 2;
    v[2] += (labs[j + 2] - m[2]) ** 2;
  }
  return {
    mean: m,
    std: [
      Math.sqrt(v[0] / n) || 1e-6,
      Math.sqrt(v[1] / n) || 1e-6,
      Math.sqrt(v[2] / n) || 1e-6,
    ],
  };
}

/* ---------- transforms ---------- */
function buildReinhard(srcPx: Float64Array, refPx: Float64Array): Transform {
  const s = meanStdLab(srcPx),
    r = meanStdLab(refPx);
  const gain = [r.std[0] / s.std[0], r.std[1] / s.std[1], r.std[2] / s.std[2]];
  return (R, G, B) => {
    const lab = rgb2lab(R, G, B);
    return lab2rgb(
      (lab[0] - s.mean[0]) * gain[0] + r.mean[0],
      (lab[1] - s.mean[1]) * gain[1] + r.mean[1],
      (lab[2] - s.mean[2]) * gain[2] + r.mean[2],
    );
  };
}
function channelCDF(px: Float64Array, ch: number, bins = 256): Float64Array {
  const h = new Float64Array(bins);
  for (let i = ch; i < px.length; i += 3) {
    let b = Math.floor(px[i] * (bins - 1));
    if (b < 0) b = 0;
    if (b >= bins) b = bins - 1;
    h[b]++;
  }
  let acc = 0;
  const cdf = new Float64Array(bins);
  const tot = px.length / 3;
  for (let i = 0; i < bins; i++) {
    acc += h[i];
    cdf[i] = acc / tot;
  }
  return cdf;
}
function buildHistMap(srcPx: Float64Array, refPx: Float64Array, bins = 256): Transform {
  const maps: Float64Array[] = [];
  for (let ch = 0; ch < 3; ch++) {
    const sc = channelCDF(srcPx, ch, bins),
      rc = channelCDF(refPx, ch, bins);
    const map = new Float64Array(bins);
    let r = 0;
    for (let i = 0; i < bins; i++) {
      const p = sc[i];
      while (r < bins - 1 && rc[r] < p) r++;
      map[i] = r / (bins - 1);
    }
    maps.push(map);
  }
  const lut1d = (v: number, ch: number) => {
    const f = Math.max(0, Math.min(1, v)) * (bins - 1);
    const i = Math.floor(f),
      t = f - i;
    const m = maps[ch];
    return i >= bins - 1 ? m[bins - 1] : m[i] * (1 - t) + m[i + 1] * t;
  };
  return (R, G, B) => [lut1d(R, 0), lut1d(G, 1), lut1d(B, 2)];
}
function randRotation(): number[][] {
  function gauss() {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  let a = [gauss(), gauss(), gauss()],
    b = [gauss(), gauss(), gauss()],
    c = [gauss(), gauss(), gauss()];
  const dot = (x: number[], y: number[]) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const norm = (x: number[]) => {
    const n = Math.hypot(x[0], x[1], x[2]) || 1e-9;
    return [x[0] / n, x[1] / n, x[2] / n];
  };
  a = norm(a);
  const bd = dot(b, a);
  b = norm([b[0] - bd * a[0], b[1] - bd * a[1], b[2] - bd * a[2]]);
  const cd1 = dot(c, a),
    cd2 = dot(c, b);
  c = norm([
    c[0] - cd1 * a[0] - cd2 * b[0],
    c[1] - cd1 * a[1] - cd2 * b[1],
    c[2] - cd1 * a[2] - cd2 * b[2],
  ]);
  return [a, b, c];
}
function applyRot(Q: number[][], p: number[]): number[] {
  return [
    Q[0][0] * p[0] + Q[0][1] * p[1] + Q[0][2] * p[2],
    Q[1][0] * p[0] + Q[1][1] * p[1] + Q[1][2] * p[2],
    Q[2][0] * p[0] + Q[2][1] * p[1] + Q[2][2] * p[2],
  ];
}
function applyRotT(Q: number[][], p: number[]): number[] {
  return [
    Q[0][0] * p[0] + Q[1][0] * p[1] + Q[2][0] * p[2],
    Q[0][1] * p[0] + Q[1][1] * p[1] + Q[2][1] * p[2],
    Q[0][2] * p[0] + Q[1][2] * p[1] + Q[2][2] * p[2],
  ];
}
function build1DMap(srcVals: Float64Array, refVals: Float64Array, bins = 128) {
  function cdfOf(vals: Float64Array, lo: number, hi: number) {
    const h = new Float64Array(bins);
    const span = hi - lo || 1e-6;
    for (let i = 0; i < vals.length; i++) {
      let b = Math.floor(((vals[i] - lo) / span) * (bins - 1));
      if (b < 0) b = 0;
      if (b >= bins) b = bins - 1;
      h[b]++;
    }
    let acc = 0;
    const c = new Float64Array(bins);
    for (let i = 0; i < bins; i++) {
      acc += h[i];
      c[i] = acc / vals.length;
    }
    return c;
  }
  let sLo = Infinity,
    sHi = -Infinity,
    rLo = Infinity,
    rHi = -Infinity;
  for (const v of srcVals) {
    if (v < sLo) sLo = v;
    if (v > sHi) sHi = v;
  }
  for (const v of refVals) {
    if (v < rLo) rLo = v;
    if (v > rHi) rHi = v;
  }
  const sc = cdfOf(srcVals, sLo, sHi),
    rc = cdfOf(refVals, rLo, rHi);
  const map = new Float64Array(bins);
  let r = 0;
  for (let i = 0; i < bins; i++) {
    const p = sc[i];
    while (r < bins - 1 && rc[r] < p) r++;
    map[i] = rLo + (r / (bins - 1)) * ((rHi - rLo) || 1e-6);
  }
  return (v: number) => {
    const f = Math.max(0, Math.min(1, (v - sLo) / ((sHi - sLo) || 1e-6))) * (bins - 1);
    const i = Math.floor(f),
      t = f - i;
    return i >= bins - 1 ? map[bins - 1] : map[i] * (1 - t) + map[i + 1] * t;
  };
}
function buildOT(srcPx: Float64Array, refPx: Float64Array, iters: number): Transform {
  const N = srcPx.length / 3,
    M = refPx.length / 3;
  const src = Float64Array.from(srcPx);
  const transforms: { Q: number[][]; maps: ((v: number) => number)[] }[] = [];
  for (let it = 0; it < iters; it++) {
    const Q = randRotation();
    const sA = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
    for (let i = 0, k = 0; i < src.length; i += 3, k++) {
      const p = applyRot(Q, [src[i], src[i + 1], src[i + 2]]);
      sA[0][k] = p[0];
      sA[1][k] = p[1];
      sA[2][k] = p[2];
    }
    const rA = [new Float64Array(M), new Float64Array(M), new Float64Array(M)];
    for (let i = 0, k = 0; i < refPx.length; i += 3, k++) {
      const p = applyRot(Q, [refPx[i], refPx[i + 1], refPx[i + 2]]);
      rA[0][k] = p[0];
      rA[1][k] = p[1];
      rA[2][k] = p[2];
    }
    const maps = [
      build1DMap(sA[0], rA[0]),
      build1DMap(sA[1], rA[1]),
      build1DMap(sA[2], rA[2]),
    ];
    transforms.push({ Q, maps });
    for (let i = 0; i < src.length; i += 3) {
      const p = applyRot(Q, [src[i], src[i + 1], src[i + 2]]);
      const back = applyRotT(Q, [maps[0](p[0]), maps[1](p[1]), maps[2](p[2])]);
      src[i] = back[0];
      src[i + 1] = back[1];
      src[i + 2] = back[2];
    }
  }
  return (R, G, B) => {
    let p = [R, G, B];
    for (const { Q, maps } of transforms) {
      const r = applyRot(Q, p);
      p = applyRotT(Q, [maps[0](r[0]), maps[1](r[1]), maps[2](r[2])]);
    }
    return p;
  };
}
export function buildTransform(
  method: Method,
  srcPx: Float64Array,
  refPx: Float64Array,
  iters: number,
): Transform {
  if (method === "reinhard") return buildReinhard(srcPx, refPx);
  if (method === "hist") return buildHistMap(srcPx, refPx);
  if (method === "ot") return buildOT(srcPx, refPx, iters);
  const f1 = buildReinhard(srcPx, refPx),
    f2 = buildHistMap(srcPx, refPx);
  return (R, G, B) => {
    const a = f1(R, G, B),
      b = f2(R, G, B);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  };
}

/* ---------- LUT smoothing (separable 3-tap blur, regularises OT) ---------- */
export function smoothLUT(lut: Float32Array, size: number, passes: number): Float32Array {
  if (passes <= 0) return lut;
  const idx = (r: number, g: number, b: number) => (b * size * size + g * size + r) * 3;
  let cur = lut;
  for (let p = 0; p < passes; p++) {
    const next = new Float32Array(cur.length);
    for (let b = 0; b < size; b++)
      for (let g = 0; g < size; g++)
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0,
              wsum = 0;
            for (let db = -1; db <= 1; db++) {
              const bb = b + db;
              if (bb < 0 || bb >= size) continue;
              const wb = db === 0 ? 2 : 1;
              for (let dg = -1; dg <= 1; dg++) {
                const gg = g + dg;
                if (gg < 0 || gg >= size) continue;
                const wg = dg === 0 ? 2 : 1;
                for (let dr = -1; dr <= 1; dr++) {
                  const rr = r + dr;
                  if (rr < 0 || rr >= size) continue;
                  const wr = dr === 0 ? 2 : 1;
                  const w = wb * wg * wr;
                  sum += cur[idx(rr, gg, bb) + c] * w;
                  wsum += w;
                }
              }
            }
            next[idx(r, g, b) + c] = sum / wsum;
          }
        }
    cur = next;
  }
  return cur;
}

/* ---------- generate 3D LUT (synchronous, with progress + guards) ---------- */
export function generateLUT(
  transform: Transform,
  size: number,
  strength: number,
  opts: BuildOptions,
  onProgress?: (p: number) => void,
): Float32Array {
  const lut = new Float32Array(size * size * size * 3);
  const s = strength;
  let bO = [0, 0, 0],
    wScale = [1, 1, 1];
  if (opts.preserveBW) {
    const b = transform(0, 0, 0),
      w = transform(1, 1, 1);
    for (let c = 0; c < 3; c++) {
      bO[c] = b[c];
      const den = w[c] - b[c];
      wScale[c] = Math.abs(den) > 1e-4 ? 1 / den : 1;
    }
  }
  let idx = 0;
  for (let bi = 0; bi < size; bi++) {
    const b = bi / (size - 1);
    for (let gi = 0; gi < size; gi++) {
      const g = gi / (size - 1);
      for (let ri = 0; ri < size; ri++) {
        const r = ri / (size - 1);
        const o = transform(r, g, b);
        let or_ = o[0],
          og = o[1],
          ob = o[2];
        if (opts.preserveBW) {
          or_ = (or_ - bO[0]) * wScale[0];
          og = (og - bO[1]) * wScale[1];
          ob = (ob - bO[2]) * wScale[2];
        }
        if (!isFinite(or_)) or_ = r;
        if (!isFinite(og)) og = g;
        if (!isFinite(ob)) ob = b;
        or_ = r + (or_ - r) * s;
        og = g + (og - g) * s;
        ob = b + (ob - b) * s;
        lut[idx++] = Math.max(0, Math.min(1, or_));
        lut[idx++] = Math.max(0, Math.min(1, og));
        lut[idx++] = Math.max(0, Math.min(1, ob));
      }
    }
    if ((bi & 1) === 0) onProgress?.(bi / size);
  }
  onProgress?.(1);
  const result = smoothLUT(lut, size, opts.smoothing | 0);
  if (opts.preserveBW) {
    result[0] = 0;
    result[1] = 0;
    result[2] = 0;
    const last = (size * size * size - 1) * 3;
    result[last] = 1;
    result[last + 1] = 1;
    result[last + 2] = 1;
  }
  return result;
}

/* ---------- trilinear sample (preview + still exports) ---------- */
export function sampleLUT(
  lut: Float32Array,
  size: number,
  r: number,
  g: number,
  b: number,
): number[] {
  const sc = size - 1;
  const fr = Math.max(0, Math.min(1, r)) * sc,
    fg = Math.max(0, Math.min(1, g)) * sc,
    fb = Math.max(0, Math.min(1, b)) * sc;
  const r0 = Math.floor(fr),
    g0 = Math.floor(fg),
    b0 = Math.floor(fb);
  const r1 = Math.min(r0 + 1, sc),
    g1 = Math.min(g0 + 1, sc),
    b1 = Math.min(b0 + 1, sc);
  const dr = fr - r0,
    dg = fg - g0,
    db = fb - b0;
  const at = (ri: number, gi: number, bi: number) => {
    const i = (bi * size * size + gi * size + ri) * 3;
    return [lut[i], lut[i + 1], lut[i + 2]];
  };
  const lerp = (a: number[], b: number[], t: number) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  const c00 = lerp(at(r0, g0, b0), at(r1, g0, b0), dr),
    c10 = lerp(at(r0, g1, b0), at(r1, g1, b0), dr);
  const c01 = lerp(at(r0, g0, b1), at(r1, g0, b1), dr),
    c11 = lerp(at(r0, g1, b1), at(r1, g1, b1), dr);
  return lerp(lerp(c00, c10, dg), lerp(c01, c11, dg), db);
}

/* ---------- grading (baked into the LUT, on top of the match) ---------- */
export function makeGrade(g: Grade): Transform {
  const ev = Math.pow(2, g.exp * 1.5),
    con = 1 + g.con * 0.8,
    sat = 1 + g.sat;
  return (r, gr, b) => {
    let lr = s2l(r) * ev,
      lg = s2l(gr) * ev,
      lb = s2l(b) * ev; // exposure in linear light
    lr *= 1 + 0.45 * g.temp;
    lb *= 1 - 0.45 * g.temp; // temperature (warm/cool)
    lg *= 1 - 0.3 * g.tint;
    lr *= 1 + 0.1 * g.tint;
    lb *= 1 + 0.1 * g.tint; // tint (green<->magenta)
    r = l2s(lr);
    gr = l2s(lg);
    b = l2s(lb);
    r = (r - 0.5) * con + 0.5;
    gr = (gr - 0.5) * con + 0.5;
    b = (b - 0.5) * con + 0.5; // contrast about mid grey
    let lum = 0.2126 * r + 0.7152 * gr + 0.0722 * b;
    if (g.sha) {
      const m = Math.pow(1 - Math.min(1, Math.max(0, lum)), 2) * g.sha * 0.35;
      r += m;
      gr += m;
      b += m;
    }
    if (g.hig) {
      const m = Math.pow(Math.min(1, Math.max(0, lum)), 2) * g.hig * 0.35;
      r += m;
      gr += m;
      b += m;
    }
    lum = 0.2126 * r + 0.7152 * gr + 0.0722 * b;
    r = lum + (r - lum) * sat;
    gr = lum + (gr - lum) * sat;
    b = lum + (b - lum) * sat; // saturation
    if (g.vib) {
      const chroma = Math.max(r, gr, b) - Math.min(r, gr, b);
      const amt = 1 + g.vib * (1 - Math.min(1, chroma));
      lum = 0.2126 * r + 0.7152 * gr + 0.0722 * b;
      r = lum + (r - lum) * amt;
      gr = lum + (gr - lum) * amt;
      b = lum + (b - lum) * amt;
    }
    if (g.fad) {
      const k = g.fad * 0.12;
      r = r * (1 - k) + k;
      gr = gr * (1 - k) + k;
      b = b * (1 - k) + k;
    } // lifted blacks / fade
    return [
      Math.max(0, Math.min(1, r)),
      Math.max(0, Math.min(1, gr)),
      Math.max(0, Math.min(1, b)),
    ];
  };
}

export const ZERO_GRADE: Grade = {
  temp: 0,
  tint: 0,
  exp: 0,
  con: 0,
  sat: 0,
  vib: 0,
  sha: 0,
  hig: 0,
  fad: 0,
};

/* ============================================================
   Colour wheels (3-way + global) — Lightroom-style colour grading
   baked into the LUT. Each tonal range gets a hue/saturation tint
   and a luminance lift, weighted by the pixel's luminance. Blending
   widens the range overlap; Balance shifts the shadow/highlight split.
   ============================================================ */
export type Wheel = { hue: number; sat: number; lum: number }; // hue 0..360, sat 0..100, lum -100..100
export type ColorGrade = {
  shadows: Wheel;
  midtones: Wheel;
  highlights: Wheel;
  global: Wheel;
  blending: number; // 0..100
  balance: number; // -100..100
};

export const ZERO_WHEEL: Wheel = { hue: 0, sat: 0, lum: 0 };
export const ZERO_COLORGRADE: ColorGrade = {
  shadows: { ...ZERO_WHEEL },
  midtones: { ...ZERO_WHEEL },
  highlights: { ...ZERO_WHEEL },
  global: { ...ZERO_WHEEL },
  blending: 50,
  balance: 0,
};

/* pure fully-saturated hue colour (HSV s=1, v=1) for a hue in degrees */
export function hueToRgb(h: number): number[] {
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = 1 - Math.abs((hh % 2) - 1);
  if (hh < 1) return [1, x, 0];
  if (hh < 2) return [x, 1, 0];
  if (hh < 3) return [0, 1, x];
  if (hh < 4) return [0, x, 1];
  if (hh < 5) return [x, 0, 1];
  return [1, 0, x];
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / ((e1 - e0) || 1e-6)));
  return t * t * (3 - 2 * t);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function makeColorGrade(cg: ColorGrade): Transform {
  const bal = cg.balance / 100; // -1..1
  const bl = cg.blending / 100; // 0..1
  const pivot = 0.5 + bal * 0.22; // balance shifts the shadow/highlight split
  const width = 0.16 + bl * 0.34; // blending widens range overlap
  const TINT = 0.25; // colour push strength at sat=100
  const LUM = 0.4; // luminance lift strength at lum=100

  // precompute each wheel's zero-luminance chroma direction + scalars
  const prep = (w: Wheel) => {
    const c = hueToRgb(w.hue);
    const luma = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return {
      cd: [c[0] - luma, c[1] - luma, c[2] - luma] as number[],
      s: w.sat / 100,
      l: w.lum / 100,
    };
  };
  const S = prep(cg.shadows),
    M = prep(cg.midtones),
    H = prep(cg.highlights),
    G = prep(cg.global);

  return (r, g, b) => {
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const lo = pivot - width,
      hi = pivot + width;
    const sw = 1 - smoothstep(lo, pivot, L); // shadows weight
    const hw = smoothstep(pivot, hi, L); // highlights weight
    const mw = Math.max(0, 1 - sw - hw); // midtones weight (partition of unity)

    // weighted colour tint (global applies uniformly, weight 1)
    const tx = sw * S.s * S.cd[0] + mw * M.s * M.cd[0] + hw * H.s * H.cd[0] + G.s * G.cd[0];
    const ty = sw * S.s * S.cd[1] + mw * M.s * M.cd[1] + hw * H.s * H.cd[1] + G.s * G.cd[1];
    const tz = sw * S.s * S.cd[2] + mw * M.s * M.cd[2] + hw * H.s * H.cd[2] + G.s * G.cd[2];

    // weighted luminance lift (+ global)
    const la = LUM * (sw * S.l + mw * M.l + hw * H.l + G.l);

    return [clamp01(r + TINT * tx + la), clamp01(g + TINT * ty + la), clamp01(b + TINT * tz + la)];
  };
}
