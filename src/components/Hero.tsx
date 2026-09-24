import GlassHeadlineHero from "./ui/glass-headline-hero";

const NLES = ["DaVinci Resolve", "Premiere Pro", "Final Cut"];

/* The headline is thick glass over a slow cool-to-warm colour field: the two
   poles of a colour match, bending through the type. Everything under it is
   ordinary DOM, so the copy stays selectable and indexable. */
export function Hero() {
  return (
    <GlassHeadlineHero
      id="top"
      eyebrow="Reference match · grade · export"
      title="Match any film look."
      description="Drop an original and a reference still. ChromaMimic learns the colour transform and exports a free .cube LUT for Resolve, Premiere and Final Cut."
      primaryAction={{ label: "Build a LUT, free", href: "#tool" }}
      secondaryAction={{ label: "See it on a real frame", href: "#demo" }}
      height="clamp(600px, 90svh, 920px)"
      className="border-b border-hairline"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-faint">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_10px_var(--color-ok)]" />
          Runs locally, nothing uploaded
        </span>
        <span className="hidden text-hairline-2 sm:inline">·</span>
        <span className="flex flex-wrap justify-center gap-x-3 font-mono text-[11.5px] uppercase tracking-wider">
          {NLES.map((n, i) => (
            <span key={n} className="whitespace-nowrap">
              {n}
              {i < NLES.length - 1 ? <span className="ml-3 text-hairline-2">·</span> : null}
            </span>
          ))}
        </span>
      </div>
    </GlassHeadlineHero>
  );
}
