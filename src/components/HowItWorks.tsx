import { Reveal } from "./ui/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Load your original frame",
    body: "Drop the ungraded shot straight off your timeline. A JPG or PNG export is all it needs.",
  },
  {
    n: "02",
    title: "Load the reference",
    body: "The look you are chasing: a film still, a frame grab, a graded screenshot you love.",
  },
  {
    n: "03",
    title: "Match and refine",
    body: "ChromaMimic measures both frames and learns the colour transform. Nudge it with the grade controls and compare before and after, live.",
  },
  {
    n: "04",
    title: "Export the .cube",
    body: "Download and drop it into Resolve, Premiere or Final Cut. Three minutes, no account, no upload.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 md:px-8">
      <Reveal>
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="max-w-2xl text-[clamp(28px,4vw,46px)]">
          A film look, learned from two frames.
        </h2>
        <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
          No node trees, no presets to buy. ChromaMimic reads the colour distribution of both frames
          and solves the transform between them, then bakes it into a LUT.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <div className="border-t border-hairline-2 pt-5">
              <div className="font-mono text-[13px] text-accent">{s.n}</div>
              <h3 className="mt-3 text-[18px] font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
