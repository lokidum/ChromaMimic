import type { ReactNode } from "react";

export function StepHeader({
  step,
  title,
  sub,
  action,
}: {
  step: string | number;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] border border-hairline-2 font-mono text-[12px] text-accent">
        {step}
      </span>
      <h3 className="text-[14px] font-semibold tracking-tight text-text">{title}</h3>
      {sub && <span className="ml-auto text-[12px] text-faint">{sub}</span>}
      {action}
    </div>
  );
}
