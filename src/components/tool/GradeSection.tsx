import type { ColorGrade, Wheel } from "../../lib/color-engine";
import type { GradeMode } from "../../workers/lut.worker";
import type { GradeRaw, WheelRange } from "./useLut";
import { StepHeader } from "./StepHeader";
import { SliderGrades } from "./GradePanel";
import { WheelGrades } from "./WheelGradePanel";
import { cn } from "../../lib/cn";

export function GradeSection(p: {
  isPro: boolean;
  gradeMode: GradeMode;
  setGradeMode: (m: GradeMode) => void;
  grade: GradeRaw;
  updateGrade: (k: keyof GradeRaw, v: number) => void;
  resetGrade: () => void;
  colorGrade: ColorGrade;
  updateWheel: (range: WheelRange, patch: Partial<Wheel>) => void;
  setBlending: (v: number) => void;
  setBalance: (v: number) => void;
  resetColorGrade: () => void;
}) {
  const wheels = p.gradeMode === "wheels";
  return (
    <div className="panel p-5 md:p-6">
      <StepHeader
        step={4}
        title="Colour grade"
        sub="bakes on top of the match, into the LUT"
        action={
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex rounded-full border border-hairline bg-bg-2 p-0.5">
              {(["sliders", "wheels"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => p.setGradeMode(m)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold capitalize transition-colors",
                    p.gradeMode === m ? "bg-accent text-accent-ink" : "text-muted hover:text-text",
                  )}
                >
                  {m}
                  {m === "wheels" && !p.isPro && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider",
                        p.gradeMode === m
                          ? "bg-accent-ink/15 text-accent-ink"
                          : "bg-accent/15 text-accent",
                      )}
                    >
                      Pro
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={wheels ? p.resetColorGrade : p.resetGrade}
              className="btn btn-ghost px-3 py-1.5 text-[12.5px]"
            >
              Reset
            </button>
          </div>
        }
      />

      {wheels ? (
        <WheelGrades
          colorGrade={p.colorGrade}
          updateWheel={p.updateWheel}
          setBlending={p.setBlending}
          setBalance={p.setBalance}
        />
      ) : (
        <SliderGrades grade={p.grade} updateGrade={p.updateGrade} />
      )}
    </div>
  );
}
