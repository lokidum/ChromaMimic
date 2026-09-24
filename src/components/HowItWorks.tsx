import { Reveal } from "./ui/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Load your original",
    body: "A JPG or PNG of the ungraded shot, straight off your timeline.",
  },
  {
    n: "02",
    title: "Load the reference",
    body: "The look you are chasing: a film still, a frame grab, a screenshot you love.",
  },
  {
    n: "03",
    title: "Set the strength",
    body: "The LUT builds on its own. Pull the match back if it overshoots, nudge the grade, drag to compare.",
  },
  {
    n: "04",
    title: "Download the .cube",
    body: "Load it in Resolve, Premiere or Final Cut. Free account, three downloads a month.",
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
          ChromaMimic reads the colour of both frames, solves the transform between them and bakes
          it into a LUT. No node trees, no presets to buy.
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

      <Reveal delay={0.2}>
        <p className="mt-10 text-[14px] text-faint">
          The long version, with what to check before you export:{" "}
          <a
            href="/guides/create-lut-from-reference-image"
            className="text-muted underline decoration-hairline-2 underline-offset-4 transition-colors hover:text-text"
          >
            how to create a LUT from a reference image
          </a>
          .
        </p>
      </Reveal>
    </section>
  );
}
