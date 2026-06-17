import { useState } from "react";
import type { ExportFormat } from "../../lib/exporters";
import type { Status } from "./useLut";
import { StepHeader } from "./StepHeader";
import { useEntitlements } from "../../lib/entitlements";
import { cn } from "../../lib/cn";

/* The Build action: primary CTA + progress + status. Sits between
   Match & build and the grade so the workflow reads top to bottom. */
export function BuildBar({
  canBuild,
  building,
  progress,
  status,
  onBuild,
}: {
  canBuild: boolean;
  building: boolean;
  progress: number;
  status: Status;
  onBuild: () => void;
}) {
  return (
    <div className="panel p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-primary px-6"
          disabled={!canBuild || building}
          onClick={onBuild}
        >
          {building && <span className="spinner" />}
          {building ? "Building…" : "Build LUT"}
        </button>
        <div
          className={cn(
            "flex min-h-[20px] flex-1 items-center gap-2 text-[13px]",
            status.kind === "ok" && "text-ok",
            status.kind === "err" && "text-danger",
            status.kind === "warn" && "text-warn",
            status.kind === "" && "text-muted",
          )}
          role="status"
          aria-live="polite"
        >
          {status.busy && <span className="spinner" />}
          {canBuild ? status.msg : "Load both frames to begin."}
        </div>
      </div>
      {building && (
        <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-bg-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-100"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* The Download step: pick a format, export. Sits after the preview.
   Entitlement-aware: the CTA + hint reflect guest / free (n left) / pro and
   whether the current export needs Pro (Wheel mode or 65³). */
export function DownloadBar({
  hasLut,
  step,
  proFeatureActive,
  onExport,
}: {
  hasLut: boolean;
  step: number;
  proFeatureActive: boolean;
  onExport: (fmt: ExportFormat) => void;
}) {
  const ent = useEntitlements();
  const [fmt, setFmt] = useState<ExportFormat>("cube");

  const proLocked = proFeatureActive && !ent.isPro;
  const label = proLocked
    ? "Unlock with Pro"
    : ent.status === "guest"
      ? "Sign in to download"
      : "Download";

  const hint = !hasLut
    ? "Build a LUT first to enable downloads."
    : proLocked
      ? "Wheel mode and 65³ exports are a Pro feature."
      : ent.status === "guest"
        ? "Create a free account to download. Your frames stay in your browser."
        : ent.isPro
          ? "Pro — unlimited downloads, every format."
          : `${ent.downloadsLeft} of ${ent.freeLimit} free downloads left this month.`;

  return (
    <div className="panel p-5 md:p-6">
      <StepHeader step={step} title="Download" sub="choose a format" />
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="field-select max-w-[300px] flex-1"
          value={fmt}
          onChange={(e) => setFmt(e.target.value as ExportFormat)}
        >
          <option value="cube">.cube — Resolve / Premiere / FCP / Photoshop</option>
          <option value="png">.png — graded still</option>
          <option value="dng">.dng — graded still, photo apps</option>
          <option value="xmp">.xmp — Lightroom / ACR preset, grade only</option>
        </select>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!hasLut}
          onClick={() => onExport(fmt)}
        >
          {label}
        </button>
      </div>
      <p
        className={cn(
          "mt-3 text-[12.5px]",
          proLocked ? "text-accent" : "text-faint",
        )}
      >
        {hint}
      </p>
    </div>
  );
}
