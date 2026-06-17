import { Reveal } from "./ui/Reveal";

const NLES = [
  {
    app: "DaVinci Resolve",
    steps: [
      "Drop the .cube in your LUT folder, then right-click the LUTs panel and Refresh.",
      "On the Color page, right-click the clip, choose LUT, and pick it. Or drag it from the LUT browser.",
    ],
  },
  {
    app: "Premiere Pro",
    steps: [
      "Open Lumetri Color, then Creative, and load it under Look.",
      "Or use Basic Correction, Input LUT, Browse, and select the .cube.",
    ],
  },
  {
    app: "Final Cut Pro",
    steps: [
      "Add the Custom LUT effect to the clip in the inspector.",
      "Set LUT to Choose, then select your exported .cube.",
    ],
  },
];

export function UseCases() {
  return (
    <section id="uses" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 md:px-8">
      <Reveal>
        <p className="eyebrow mb-3">Where it lands</p>
        <h2 className="max-w-2xl text-[clamp(28px,4vw,46px)]">Made to drop into your edit.</h2>
        <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
          The export is a standard Adobe Cube v1.0 file. Here is exactly where it goes, plus the one
          step beginners miss on log footage.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {NLES.map((n, i) => (
          <Reveal key={n.app} delay={i * 0.07}>
            <div className="panel h-full p-6">
              <h3 className="text-[17px] font-semibold tracking-tight">{n.app}</h3>
              <ol className="mt-4 flex flex-col gap-3">
                {n.steps.map((s, j) => (
                  <li key={j} className="flex gap-3 text-[13.5px] leading-relaxed text-muted">
                    <span className="font-mono text-[12px] text-accent">{j + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-5 rounded-[8px] border border-[oklch(0.82_0.11_80_/_0.28)] bg-[oklch(0.82_0.11_80_/_0.06)] p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-warn">
            The step everyone misses
          </p>
          <h3 className="mt-3 max-w-3xl text-[20px] font-semibold tracking-tight md:text-[24px]">
            Shooting log? Convert to Rec.709 before you apply the LUT.
          </h3>
          <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-muted">
            S-Log3, V-Log and LogC are flat on purpose. A reference match is measured in display
            colour, so build it from Rec.709 frames, then place a Color Space Transform (log to
            Rec.709) before this LUT in your node or effect order. Skip that and even a perfect match
            looks washed out. Every ChromaMimic export carries this reminder in its header.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
