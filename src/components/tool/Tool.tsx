import { useCallback, useEffect, useRef, useState } from "react";
import { useLut } from "./useLut";
import { DropZone } from "./DropZone";
import { MatchControls } from "./MatchControls";
import { GradeSection } from "./GradeSection";
import { BuildBar, DownloadBar } from "./ExportBar";
import { ComparePreview } from "./ComparePreview";
import { useEntitlements } from "../../lib/entitlements";
import type { ExportFormat } from "../../lib/exporters";
import { cn } from "../../lib/cn";

export function Tool() {
  const t = useLut();
  const ent = useEntitlements();
  const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);
  const prevStatus = useRef(ent.status);

  const proFeatureActive = t.gradeMode === "wheels" || t.builtSize === 65;

  // Gate the download: Pro features (Wheels / 65³) require Pro; guests must
  // sign in; free accounts spend one of their monthly downloads.
  const doGatedExport = useCallback(
    async (fmt: ExportFormat) => {
      const usesPro = t.gradeMode === "wheels" || t.builtSize === 65;
      if (usesPro && !ent.isPro) {
        setPendingExport(fmt);
        ent.openPaywall("pro-feature");
        return;
      }
      if (ent.status === "guest") {
        setPendingExport(fmt);
        ent.requireSignIn({ pendingExport: fmt });
        return;
      }
      if (ent.status === "free") {
        const r = await ent.consumeDownload();
        if (!r.ok) {
          setPendingExport(fmt);
          ent.openPaywall("limit");
          return;
        }
      }
      t.doExport(fmt);
    },
    [ent, t],
  );

  // Resume the pending export once the user signs in or upgrades (status change).
  useEffect(() => {
    const changed = prevStatus.current !== ent.status;
    prevStatus.current = ent.status;
    if (changed && pendingExport && ent.status !== "guest") {
      const fmt = pendingExport;
      setPendingExport(null);
      void doGatedExport(fmt);
    }
  }, [ent.status, pendingExport, doGatedExport]);

  return (
    <section id="tool" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 md:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-2">The tool</p>
          <h2 className="text-[clamp(26px,3.4vw,38px)]">Build your LUT</h2>
        </div>
        <div className="inline-flex rounded-full border border-hairline bg-bg-2 p-1">
          {(["simple", "pro"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => t.setMode(m)}
              className={cn(
                "rounded-full px-5 py-2 text-[13px] font-semibold capitalize transition-colors",
                t.mode === m ? "bg-accent text-accent-ink" : "text-muted hover:text-text",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-6 max-w-2xl text-[13.5px] text-muted">
        {t.mode === "pro"
          ? "Pro mode: the full matching engine, colour space handling and fine controls are all visible."
          : "Simple mode keeps the smart defaults. Switch to Pro for the matching engine and fine controls."}
      </p>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <DropZone
            step={1}
            title="Original frame"
            sub="your source still"
            hintTitle="Drop your original frame"
            hintSub="the ungraded shot, JPG or PNG"
            icon="source"
            image={t.srcImg}
            onImage={t.setSrcImg}
            onError={(msg) => t.setStatus({ msg, kind: "err" })}
          />
          <DropZone
            step={2}
            title="Reference frame"
            sub="the look you want"
            hintTitle="Drop your reference frame"
            hintSub="a graded still or film screenshot"
            icon="reference"
            image={t.refImg}
            onImage={t.setRefImg}
            onError={(msg) => t.setStatus({ msg, kind: "err" })}
          />
        </div>

        <MatchControls
          mode={t.mode}
          method={t.method}
          setMethod={t.setMethod}
          size={t.size}
          setSize={t.setSize}
          space={t.space}
          setSpace={t.setSpace}
          strength={t.strength}
          setStrength={t.setStrength}
          smoothing={t.smoothing}
          setSmoothing={t.setSmoothing}
          iters={t.iters}
          setIters={t.setIters}
          preserveBW={t.preserveBW}
          setPreserveBW={t.setPreserveBW}
        />

        <BuildBar
          canBuild={t.canBuild}
          building={t.building}
          progress={t.progress}
          status={t.status}
          onBuild={t.build}
        />

        <GradeSection
          isPro={ent.isPro}
          gradeMode={t.gradeMode}
          setGradeMode={t.setGradeMode}
          grade={t.grade}
          updateGrade={t.updateGrade}
          resetGrade={t.resetGrade}
          colorGrade={t.colorGrade}
          updateWheel={t.updateWheel}
          setBlending={t.setBlending}
          setBalance={t.setBalance}
          resetColorGrade={t.resetColorGrade}
        />

        <ComparePreview srcImg={t.srcImg} lut={t.lut} builtSize={t.builtSize} />

        <DownloadBar
          step={6}
          hasLut={!!t.lut}
          proFeatureActive={proFeatureActive}
          onExport={doGatedExport}
        />
      </div>
    </section>
  );
}
