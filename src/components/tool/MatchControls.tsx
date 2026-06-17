import type { Method, Space } from "../../lib/color-engine";
import type { Mode } from "./useLut";
import { StepHeader } from "./StepHeader";
import { Slider } from "../ui/Slider";

function Field({
  label,
  children,
  show = true,
}: {
  label: string;
  children: React.ReactNode;
  show?: boolean;
}) {
  if (!show) return null;
  return (
    <div className="min-w-[180px] flex-1">
      <label className="mb-2 block text-[12px] text-muted">{label}</label>
      {children}
    </div>
  );
}

export function MatchControls(p: {
  mode: Mode;
  method: Method;
  setMethod: (m: Method) => void;
  size: number;
  setSize: (n: number) => void;
  space: Space;
  setSpace: (s: Space) => void;
  strength: number;
  setStrength: (n: number) => void;
  smoothing: number;
  setSmoothing: (n: number) => void;
  iters: number;
  setIters: (n: number) => void;
  preserveBW: boolean;
  setPreserveBW: (b: boolean) => void;
}) {
  const pro = p.mode === "pro";
  return (
    <div className="panel p-5 md:p-6">
      <StepHeader step={3} title="Match & build" sub="how the colour transfer works" />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-4">
          <Field label="Colour matching method" show={pro}>
            <select
              className="field-select"
              value={p.method}
              onChange={(e) => p.setMethod(e.target.value as Method)}
            >
              <option value="reinhard">Reinhard (LAB mean/std) — fast, clean</option>
              <option value="hist">Histogram match (per channel)</option>
              <option value="blend">Reinhard + Histogram blend — recommended</option>
              <option value="ot">Optimal transport (sliced) — advanced</option>
            </select>
          </Field>
          <Field label="LUT resolution">
            <select
              className="field-select"
              value={p.size}
              onChange={(e) => p.setSize(parseInt(e.target.value, 10))}
            >
              <option value={17}>17³ — small, fast</option>
              <option value={33}>33³ — standard (most compatible)</option>
              <option value={65}>65³ — high precision</option>
            </select>
          </Field>
          <Field label="Frames are in" show={pro}>
            <select
              className="field-select"
              value={p.space}
              onChange={(e) => p.setSpace(e.target.value as Space)}
            >
              <option value="display">sRGB / Rec.709 (standard)</option>
              <option value="log">Log (S-Log, V-Log, C-Log, LogC…)</option>
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap gap-4">
          <Slider
            label="Match strength"
            value={p.strength}
            min={0}
            max={100}
            suffix="%"
            onChange={p.setStrength}
          />
          {pro && (
            <Slider
              label="Smoothing"
              value={p.smoothing}
              min={0}
              max={5}
              tip="A light 3D blur on the LUT grid. Cleans up the noise optimal transport can introduce."
              onChange={p.setSmoothing}
            />
          )}
          {pro && p.method === "ot" && (
            <Slider
              label="OT iterations"
              value={p.iters}
              min={4}
              max={24}
              onChange={p.setIters}
            />
          )}
        </div>

        {pro && (
          <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] border border-hairline bg-bg-2 px-3.5 py-3 text-[13.5px] text-text transition-colors hover:border-hairline-2">
            <input
              type="checkbox"
              checked={p.preserveBW}
              onChange={(e) => p.setPreserveBW(e.target.checked)}
              className="h-4 w-4 accent-[oklch(0.83_0.085_78)]"
            />
            Normalise black &amp; white points (kills milky blacks)
          </label>
        )}

        {pro && (
          <SpaceNote space={p.space} size={p.size} />
        )}
      </div>
    </div>
  );
}

function SpaceNote({ space, size }: { space: Space; size: number }) {
  const isLog = space === "log";
  return (
    <div
      className={
        "rounded-[8px] border px-3.5 py-3 text-[12.5px] leading-relaxed " +
        (isLog
          ? "border-[oklch(0.82_0.11_80_/_0.28)] bg-[oklch(0.82_0.11_80_/_0.08)] text-warn"
          : "border-hairline bg-bg-2 text-muted")
      }
    >
      {isLog ? (
        <>
          Log frames detected. A LUT cannot guess your camera&apos;s log curve, so matching log
          directly is unreliable. Convert both frames to Rec.709 first, build the LUT, then put a
          Color Space Transform before this LUT in your editor. The exported .cube carries a
          reminder.
        </>
      ) : (
        <>
          Matching happens in sRGB / Rec.709. The exported LUT expects display-space input, which is
          what you want for most stills and screenshots.
        </>
      )}
      {size === 65 && (
        <>
          <br />
          <br />
          <b className="text-text">65³ note:</b> highest precision, but some older Premiere Pro builds
          reject LUTs above 33³. If it will not load, rebuild at 33³.
        </>
      )}
    </div>
  );
}
