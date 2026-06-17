import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Wheel } from "../../lib/color-engine";
import { Slider } from "./Slider";

/* Lightroom-style colour wheel: drag the handle to set hue (angle) and
   saturation (radius); a luminance slider sits below. Self-consistent —
   the colour shown under the handle matches the baked hue. */
export function ColorWheel({
  label,
  value,
  onChange,
  size = 156,
}: {
  label: string;
  value: Wheel;
  onChange: (patch: Partial<Wheel>) => void;
  size?: number;
}) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // conic hue ring: at CSS angle φ (clockwise from top) show hsl(90 - φ),
  // so hue 0 (red) sits at the 3 o'clock handle position.
  const conic = useMemo(() => {
    const stops: string[] = [];
    for (let phi = 0; phi <= 360; phi += 15) {
      const hue = ((90 - phi) % 360 + 360) % 360;
      stops.push(`hsl(${hue} 95% 55%) ${phi}deg`);
    }
    return `conic-gradient(from 0deg at 50% 50%, ${stops.join(",")})`;
  }, []);

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = wheelRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const R = rect.width / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const sat = Math.min(1, Math.hypot(dx, dy) / R) * 100;
      const hue = ((Math.atan2(-dy, dx) * 180) / Math.PI + 360) % 360;
      onChange({ hue: Math.round(hue), sat: Math.round(sat) });
    },
    [onChange],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) setFromPointer(e.clientX, e.clientY);
    };
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [setFromPointer]);

  const ang = (value.hue * Math.PI) / 180;
  const rNorm = value.sat / 100;
  const hx = 50 + Math.cos(ang) * 50 * rNorm;
  const hy = 50 - Math.sin(ang) * 50 * rNorm;
  const swatch = `hsl(${value.hue} ${value.sat}% 55%)`;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
        {label}
      </div>
      <div
        ref={wheelRef}
        role="slider"
        aria-label={`${label} hue and saturation`}
        aria-valuetext={`hue ${value.hue}, saturation ${value.sat}`}
        tabIndex={0}
        onPointerDown={(e) => {
          dragging.current = true;
          setFromPointer(e.clientX, e.clientY);
          try {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          } catch {
            /* ignore: some browsers reject capture for synthetic pointers */
          }
        }}
        className="relative cursor-crosshair rounded-full ring-1 ring-hairline-2"
        style={{
          width: size,
          height: size,
          background: conic,
          boxShadow: "inset 0 2px 10px oklch(0 0 0 / 0.45)",
        }}
      >
        {/* desaturate toward a neutral centre */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, oklch(0.5 0 0) 0%, oklch(0.5 0 0 / 0.35) 34%, transparent 70%)",
          }}
        />
        {/* handle */}
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_oklch(0_0_0/0.6)]"
          style={{ left: `${hx}%`, top: `${hy}%`, background: value.sat > 2 ? swatch : "transparent" }}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-3 font-mono text-[11.5px] text-muted">
        <span>
          <span className="text-faint">Hue</span> {value.hue}
        </span>
        <span>
          <span className="text-faint">Sat</span> {value.sat}
        </span>
      </div>

      <div className="mt-2 w-full">
        <Slider
          label="Luminance"
          value={value.lum}
          min={-100}
          max={100}
          onChange={(v) => onChange({ lum: v })}
        />
      </div>
    </div>
  );
}
