import { useCallback, useEffect, useRef, useState } from "react";
import { samplePixels } from "../../lib/image";
import { startBuild } from "../../lib/build-lut";
import type { BuildHandle } from "../../lib/build-lut";
import {
  ZERO_COLORGRADE,
  type ColorGrade,
  type Grade,
  type Method,
  type Space,
  type Wheel,
} from "../../lib/color-engine";
import type { GradeMode } from "../../workers/lut.worker";
import {
  downloadCube,
  downloadDNG,
  downloadPNG,
  exportXMP,
  exportColorGradeXMP,
  type ExportFormat,
} from "../../lib/exporters";

export type GradeRaw = Record<keyof Grade, number>;
export type Status = { msg: string; kind: "" | "ok" | "err" | "warn"; busy?: boolean };
export type Mode = "simple" | "pro";
export type WheelRange = "shadows" | "midtones" | "highlights" | "global";

export const ZERO_RAW: GradeRaw = {
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

const normGrade = (r: GradeRaw): Grade => ({
  temp: r.temp / 100,
  tint: r.tint / 100,
  exp: r.exp / 100,
  con: r.con / 100,
  sat: r.sat / 100,
  vib: r.vib / 100,
  sha: r.sha / 100,
  hig: r.hig / 100,
  fad: r.fad / 100,
});

export function useLut() {
  const [srcImg, setSrcImg] = useState<HTMLImageElement | null>(null);
  const [refImg, setRefImg] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<Mode>("simple");
  const [method, setMethod] = useState<Method>("blend");
  const [size, setSize] = useState(33);
  const [space, setSpace] = useState<Space>("display");
  const [strength, setStrength] = useState(50);
  const [smoothing, setSmoothing] = useState(1);
  const [iters, setIters] = useState(12);
  const [preserveBW, setPreserveBW] = useState(true);
  const [grade, setGrade] = useState<GradeRaw>({ ...ZERO_RAW });
  const [gradeMode, setGradeMode] = useState<GradeMode>("sliders");
  const [colorGrade, setColorGrade] = useState<ColorGrade>(() => structuredClone(ZERO_COLORGRADE));

  const [lut, setLut] = useState<Float32Array | null>(null);
  const [builtSize, setBuiltSize] = useState(33);
  const [builtMeta, setBuiltMeta] = useState<{ method: Method; space: Space }>({
    method: "blend",
    space: "display",
  });
  const [progress, setProgress] = useState(0);
  const [building, setBuilding] = useState(false);
  const [status, setStatus] = useState<Status>({ msg: "Load both frames to begin.", kind: "" });

  const activeBuild = useRef<BuildHandle | null>(null);
  const buildSeq = useRef(0);

  const canBuild = !!srcImg && !!refImg;

  const build = useCallback(async () => {
    if (!srcImg || !refImg) return;
    activeBuild.current?.cancel();
    const seq = ++buildSeq.current;
    const simple = mode === "simple";
    const m: Method = simple ? "blend" : method;
    const sz = size;
    const str = strength / 100;
    const sp: Space = simple ? "display" : space;
    const opts = { preserveBW: simple ? true : preserveBW, smoothing: simple ? 1 : smoothing };
    setBuilding(true);
    setProgress(0);
    setStatus({ msg: `Building ${sz}³ LUT…`, kind: "", busy: true });
    try {
      const srcPx = samplePixels(srcImg, m === "ot" ? 180 : 256);
      const refPx = samplePixels(refImg, m === "ot" ? 180 : 256);
      const handle = startBuild(
        {
          srcPx,
          refPx,
          method: m,
          size: sz,
          strength: str,
          iters,
          gradeMode,
          grade: normGrade(grade),
          colorGrade,
          opts,
        },
        (p) => {
          if (seq === buildSeq.current) setProgress(p);
        },
      );
      activeBuild.current = handle;
      const { lut: out } = await handle.promise;
      if (seq !== buildSeq.current) return;
      setLut(out);
      setBuiltSize(sz);
      setBuiltMeta({ method: m, space: sp });
      setStatus({
        msg: `${sz}³ LUT built — ${(sz * sz * sz).toLocaleString()} nodes. Drag to compare, tweak the grade live, then download.`,
        kind: "ok",
      });
    } catch (e) {
      if (seq !== buildSeq.current) return;
      setStatus({
        msg: "Could not build the LUT: " + (e instanceof Error ? e.message : String(e)),
        kind: "err",
      });
    } finally {
      if (seq === buildSeq.current) {
        setBuilding(false);
        setProgress(1);
      }
    }
  }, [
    srcImg,
    refImg,
    mode,
    method,
    size,
    space,
    strength,
    smoothing,
    iters,
    preserveBW,
    gradeMode,
    grade,
    colorGrade,
  ]);

  // status hint while loading frames
  useEffect(() => {
    if (lut) return;
    if (srcImg && refImg) setStatus({ msg: "Both frames loaded — building preview…", kind: "ok" });
    else if (srcImg || refImg) setStatus({ msg: "Load the other frame to continue.", kind: "" });
    else setStatus({ msg: "Load both frames to begin.", kind: "" });
  }, [srcImg, refImg, lut]);

  // auto build/rebuild (debounced) whenever both frames are loaded and any
  // match or grade control changes — so the sliders/wheels always drive the
  // preview live, even before the first manual Build click.
  useEffect(() => {
    if (!canBuild) return;
    const id = window.setTimeout(() => void build(), 140);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    method,
    size,
    space,
    strength,
    smoothing,
    iters,
    preserveBW,
    gradeMode,
    grade,
    colorGrade,
    srcImg,
    refImg,
  ]);

  const updateGrade = useCallback((key: keyof GradeRaw, value: number) => {
    setGrade((g) => ({ ...g, [key]: value }));
  }, []);
  const resetGrade = useCallback(() => setGrade({ ...ZERO_RAW }), []);

  const updateWheel = useCallback((range: WheelRange, patch: Partial<Wheel>) => {
    setColorGrade((cg) => ({ ...cg, [range]: { ...cg[range], ...patch } }));
  }, []);
  const setBlending = useCallback(
    (v: number) => setColorGrade((cg) => ({ ...cg, blending: v })),
    [],
  );
  const setBalance = useCallback((v: number) => setColorGrade((cg) => ({ ...cg, balance: v })), []);
  const resetColorGrade = useCallback(() => setColorGrade(structuredClone(ZERO_COLORGRADE)), []);

  const doExport = useCallback(
    (fmt: ExportFormat) => {
      if (!lut || !srcImg) return;
      try {
        if (fmt === "cube") {
          downloadCube(lut, builtSize, "ChromaMimic export", builtMeta);
        } else if (fmt === "png") {
          downloadPNG(srcImg, lut, builtSize);
        } else if (fmt === "dng") {
          setStatus({ msg: "Encoding DNG…", kind: "", busy: true });
          downloadDNG(srcImg, lut, builtSize);
          setStatus({
            msg: "DNG exported — 16-bit linear DNG of the graded still. Open in Lightroom, Camera Raw or Capture One.",
            kind: "ok",
          });
        } else if (fmt === "xmp") {
          if (gradeMode === "wheels") exportColorGradeXMP(colorGrade);
          else exportXMP(normGrade(grade));
          setStatus({
            msg: "Lightroom / ACR preset exported — grade only, not the reference match. Use the .cube for the full look.",
            kind: "ok",
          });
        }
      } catch (e) {
        setStatus({
          msg: "Export failed: " + (e instanceof Error ? e.message : String(e)),
          kind: "err",
        });
      }
    },
    [lut, srcImg, builtSize, builtMeta, gradeMode, grade, colorGrade],
  );

  return {
    srcImg,
    setSrcImg,
    refImg,
    setRefImg,
    mode,
    setMode,
    method,
    setMethod,
    size,
    setSize,
    space,
    setSpace,
    strength,
    setStrength,
    smoothing,
    setSmoothing,
    iters,
    setIters,
    preserveBW,
    setPreserveBW,
    grade,
    updateGrade,
    resetGrade,
    gradeMode,
    setGradeMode,
    colorGrade,
    updateWheel,
    setBlending,
    setBalance,
    resetColorGrade,
    lut,
    builtSize,
    progress,
    building,
    status,
    setStatus,
    canBuild,
    build,
    doExport,
  };
}
