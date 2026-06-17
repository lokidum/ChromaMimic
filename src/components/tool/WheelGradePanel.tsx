import type { ColorGrade, Wheel } from "../../lib/color-engine";
import type { WheelRange } from "./useLut";
import { ColorWheel } from "../ui/ColorWheel";
import { Slider } from "../ui/Slider";

const RANGES: { key: WheelRange; label: string }[] = [
  { key: "shadows", label: "Shadows" },
  { key: "midtones", label: "Midtones" },
  { key: "highlights", label: "Highlights" },
  { key: "global", label: "Global" },
];

/* Header-less colour-wheel grid; wrapped by GradeSection. */
export function WheelGrades({
  colorGrade,
  updateWheel,
  setBlending,
  setBalance,
}: {
  colorGrade: ColorGrade;
  updateWheel: (range: WheelRange, patch: Partial<Wheel>) => void;
  setBlending: (v: number) => void;
  setBalance: (v: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 lg:grid-cols-4">
        {RANGES.map((r) => (
          <ColorWheel
            key={r.key}
            label={r.label}
            value={colorGrade[r.key]}
            onChange={(patch) => updateWheel(r.key, patch)}
          />
        ))}
      </div>

      <div className="mt-9 flex flex-col gap-5 border-t border-hairline pt-7 sm:flex-row sm:gap-8">
        <Slider
          label="Blending"
          value={colorGrade.blending}
          min={0}
          max={100}
          tip="How much the tonal ranges overlap. Lower keeps shadows, midtones and highlights distinct; higher blends them."
          onChange={setBlending}
        />
        <Slider
          label="Balance"
          value={colorGrade.balance}
          min={-100}
          max={100}
          tip="Shifts the split between shadows and highlights. Negative favours shadows, positive favours highlights."
          onChange={setBalance}
        />
      </div>
    </div>
  );
}
