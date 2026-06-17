import { cn } from "../../lib/cn";

export function Slider({
  label,
  value,
  min,
  max,
  onChange,
  suffix = "",
  tip,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
  tip?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 min-w-[160px]", className)}>
      <label className="mb-2 flex items-center justify-between text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          {label}
          {tip && (
            <span
              title={tip}
              className="inline-grid h-[15px] w-[15px] cursor-help place-items-center rounded-full border border-hairline-2 font-mono text-[9px] text-faint"
            >
              ?
            </span>
          )}
        </span>
        <span className="rounded-[6px] bg-surface-2 px-2 py-0.5 font-mono text-[12px] tabular-nums text-text">
          {value}
          {suffix}
        </span>
      </label>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
    </div>
  );
}
