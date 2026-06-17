import type { GradeRaw } from "./useLut";
import { Slider } from "../ui/Slider";

const SLIDERS: { key: keyof GradeRaw; label: string; min: number; max: number }[] = [
  { key: "temp", label: "Temperature", min: -100, max: 100 },
  { key: "tint", label: "Tint", min: -100, max: 100 },
  { key: "exp", label: "Exposure", min: -100, max: 100 },
  { key: "con", label: "Contrast", min: -100, max: 100 },
  { key: "sat", label: "Saturation", min: -100, max: 100 },
  { key: "vib", label: "Vibrance", min: -100, max: 100 },
  { key: "sha", label: "Shadows", min: -100, max: 100 },
  { key: "hig", label: "Highlights", min: -100, max: 100 },
  { key: "fad", label: "Fade / lifted blacks", min: 0, max: 100 },
];

/* Header-less sliders grid; wrapped by GradeSection. */
export function SliderGrades({
  grade,
  updateGrade,
}: {
  grade: GradeRaw;
  updateGrade: (k: keyof GradeRaw, v: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {SLIDERS.map((s) => (
        <Slider
          key={s.key}
          label={s.label}
          value={grade[s.key]}
          min={s.min}
          max={s.max}
          onChange={(v) => updateGrade(s.key, v)}
        />
      ))}
    </div>
  );
}
