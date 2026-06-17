import { Reveal } from "./ui/Reveal";

const CONTACT = "mailto:hello@nunik.co?subject=Custom%20grade%20or%20LUT%20pack";

export function ServiceCTA() {
  return (
    <section id="studio" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 md:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[12px] border border-hairline-2 bg-surface px-6 py-12 md:px-14 md:py-16">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--color-accent), transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative max-w-2xl">
            <p className="eyebrow mb-3">Beyond the tool</p>
            <h2 className="text-[clamp(26px,3.6vw,42px)]">
              Need a bespoke look, or a branded LUT pack?
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
              ChromaMimic is built by Nunik Co., a studio that designs custom colour pipelines, LUT
              libraries and bespoke creative tools for filmmakers and brands. If a global match is
              not enough, we grade it properly.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href={CONTACT} className="btn btn-primary px-6 py-3 text-[15px]">
                Work with the studio
              </a>
              <a href="#tool" className="btn btn-ghost px-6 py-3 text-[15px]">
                Or build one free
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
