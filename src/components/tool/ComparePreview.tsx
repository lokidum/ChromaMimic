import { useCallback, useEffect, useRef, useState } from "react";
import { LutPreview } from "../../webgl/lut-preview";
import { applyLUTToImage } from "../../lib/image";
import { sampleLUT } from "../../lib/color-engine";
import { StepHeader } from "./StepHeader";

export function ComparePreview({
  srcImg,
  lut,
  builtSize,
}: {
  srcImg: HTMLImageElement | null;
  lut: Float32Array | null;
  builtSize: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const beforeRef = useRef<HTMLCanvasElement>(null);
  const afterRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const preview = useRef<LutPreview | null>(null);
  const [webglOk, setWebglOk] = useState(true);
  const [split, setSplit] = useState(0.5);
  const dragging = useRef(false);

  // init WebGL preview
  useEffect(() => {
    if (!glCanvasRef.current) return;
    try {
      preview.current = new LutPreview(glCanvasRef.current);
      setWebglOk(true);
    } catch {
      setWebglOk(false);
    }
    return () => {
      preview.current?.dispose();
      preview.current = null;
    };
  }, []);

  // CPU fallback render of the "before" image
  const cpuRenderBefore = useCallback(() => {
    const img = srcImg;
    const cv = beforeRef.current;
    if (!img || !cv) return;
    const maxSide = 900;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale),
      h = Math.round(img.height * scale);
    cv.width = w;
    cv.height = h;
    cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
  }, [srcImg]);

  const cpuRenderAfter = useCallback(() => {
    const img = srcImg;
    const cv = afterRef.current;
    if (!img || !cv || !lut) return;
    const maxSide = 900;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale),
      h = Math.round(img.height * scale);
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h),
      d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const o = sampleLUT(lut, builtSize, d[i] / 255, d[i + 1] / 255, d[i + 2] / 255);
      d[i] = o[0] * 255;
      d[i + 1] = o[1] * 255;
      d[i + 2] = o[2] * 255;
    }
    ctx.putImageData(id, 0, 0);
  }, [srcImg, lut, builtSize]);

  // render scope (always CPU, from a small graded still — matches export)
  const renderScope = useCallback(() => {
    const cv = scopeRef.current;
    const img = srcImg;
    if (!cv) return;
    const W = (cv.width = cv.offsetWidth || 600);
    const H = (cv.height = 96);
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
    if (!img || !lut) return;
    const small = applyLUTToImage(img, lut, builtSize, 256);
    const data = small.getContext("2d")!.getImageData(0, 0, small.width, small.height).data;
    const hr = new Float32Array(256),
      hg = new Float32Array(256),
      hb = new Float32Array(256);
    for (let i = 0; i < data.length; i += 4) {
      hr[data[i]]++;
      hg[data[i + 1]]++;
      hb[data[i + 2]]++;
    }
    const sm = (h: Float32Array) => {
      const o = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        let s = 0,
          c = 0;
        for (let k = -2; k <= 2; k++) {
          const j = i + k;
          if (j >= 0 && j < 256) {
            s += h[j];
            c++;
          }
        }
        o[i] = s / c;
      }
      return o;
    };
    const R = sm(hr),
      G = sm(hg),
      B = sm(hb);
    let mx = 1;
    for (let i = 1; i < 255; i++) mx = Math.max(mx, R[i], G[i], B[i]);
    ctx.globalCompositeOperation = "lighter";
    const draw = (h: Float32Array, col: string) => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x < W; x++) {
        const bi = Math.floor((x / W) * 255);
        ctx.lineTo(x, H - (h[bi] / mx) * (H - 6));
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    };
    draw(R, "rgba(255,99,99,.5)");
    draw(G, "rgba(99,210,140,.5)");
    draw(B, "rgba(120,150,255,.55)");
    ctx.globalCompositeOperation = "source-over";
  }, [srcImg, lut, builtSize]);

  // push source image to preview
  useEffect(() => {
    if (!srcImg) return;
    if (webglOk && preview.current) preview.current.setImage(srcImg);
    else cpuRenderBefore();
    renderScope();
  }, [srcImg, webglOk, cpuRenderBefore, renderScope]);

  // push LUT to preview
  useEffect(() => {
    if (!lut) return;
    if (webglOk && preview.current) preview.current.setLUT(lut, builtSize);
    else {
      cpuRenderBefore();
      cpuRenderAfter();
    }
    renderScope();
  }, [lut, builtSize, webglOk, cpuRenderBefore, cpuRenderAfter, renderScope]);

  // split -> shader / clip
  useEffect(() => {
    if (webglOk && preview.current) preview.current.setSplit(split);
  }, [split, webglOk]);

  // scope responsive redraw
  useEffect(() => {
    const onResize = () => renderScope();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [renderScope]);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSplit(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) setFromClientX(e.clientX);
    };
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [setFromClientX]);

  const empty = !srcImg || !lut;

  return (
    <div className="panel p-5 md:p-6">
      <StepHeader step={5} title="Preview" sub="original vs graded, drag to compare" />
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          dragging.current = true;
          setFromClientX(e.clientX);
        }}
        className="relative aspect-video w-full select-none overflow-hidden rounded-[8px] border border-hairline-2 bg-bg-2"
      >
        {/* WebGL canvas */}
        <canvas
          ref={glCanvasRef}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ display: webglOk ? "block" : "none" }}
        />
        {/* CPU fallback canvases */}
        {!webglOk && (
          <>
            <canvas ref={beforeRef} className="absolute inset-0 h-full w-full object-contain" />
            <canvas
              ref={afterRef}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }}
            />
          </>
        )}

        {empty && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <p className="max-w-xs text-[13px] text-faint">
              Load both frames and build a LUT to see the before and after here.
            </p>
          </div>
        )}

        {!empty && (
          <>
            <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-[6px] border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">
              Original
            </span>
            <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-[6px] border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">
              Graded
            </span>
            <div
              className="absolute bottom-0 top-0 z-30 w-0.5 -translate-x-1/2 cursor-ew-resize bg-white/85"
              style={{ left: `${split * 100}%` }}
            >
              <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-black/70 text-[12px] text-white backdrop-blur-sm">
                ⟷
              </span>
            </div>
          </>
        )}
      </div>

      <canvas
        ref={scopeRef}
        className="mt-3.5 block h-24 w-full rounded-[8px] border border-hairline bg-bg-2"
        height={96}
      />
      <p className="mt-3 text-[12.5px] leading-relaxed text-faint">
        The preview applies the generated LUT, so what you see is what the exported file does. The
        scope above is a live RGB histogram of the graded result.
      </p>
    </div>
  );
}
