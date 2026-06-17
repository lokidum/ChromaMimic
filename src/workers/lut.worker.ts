/// <reference lib="webworker" />
/* ChromaMimic LUT worker — builds the transform + grade and generates the 3D LUT
   off the main thread so the UI never blocks (even on 65³ + optimal transport). */
import {
  buildTransform,
  makeGrade,
  makeColorGrade,
  generateLUT,
  type BuildOptions,
  type ColorGrade,
  type Grade,
  type Method,
} from "../lib/color-engine";

export type GradeMode = "sliders" | "wheels";

export type BuildRequest = {
  srcPx: Float64Array;
  refPx: Float64Array;
  method: Method;
  size: number;
  strength: number; // 0..1
  iters: number;
  gradeMode: GradeMode;
  grade: Grade;
  colorGrade: ColorGrade;
  opts: BuildOptions;
};

export type BuildResponse =
  | { type: "progress"; value: number }
  | { type: "done"; lut: ArrayBuffer; size: number }
  | { type: "error"; message: string };

self.onmessage = (e: MessageEvent<BuildRequest>) => {
  const { srcPx, refPx, method, size, strength, iters, gradeMode, grade, colorGrade, opts } =
    e.data;
  try {
    if (srcPx.length < 300 || refPx.length < 300)
      throw new Error("a frame is too small to sample reliably");
    const match = buildTransform(method, srcPx, refPx, iters);
    const g = gradeMode === "wheels" ? makeColorGrade(colorGrade) : makeGrade(grade);
    // match strength applied here so the grade always lands at full strength
    const finalT = (r: number, gg: number, b: number) => {
      const m = match(r, gg, b);
      return g(r + (m[0] - r) * strength, gg + (m[1] - gg) * strength, b + (m[2] - b) * strength);
    };
    const lut = generateLUT(finalT, size, 1, opts, (p) => {
      const msg: BuildResponse = { type: "progress", value: p };
      self.postMessage(msg);
    });
    const buffer = lut.buffer as ArrayBuffer;
    const msg: BuildResponse = { type: "done", lut: buffer, size };
    self.postMessage(msg, [buffer]);
  } catch (err) {
    const msg: BuildResponse = {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(msg);
  }
};
