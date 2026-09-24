import { Reveal } from "./ui/Reveal";

/* Where the .cube goes. One line per editor and a link to the guide that
   carries the detail, instead of three cards repeating the manuals. */
const EDITORS = [
  {
    app: "DaVinci Resolve",
    how: "Copy the .cube into the LUT folder, refresh the LUT panel, drag it onto a node.",
    href: "/guides/davinci-resolve-lut-folder-location",
    label: "LUT folder location",
  },
  {
    app: "Premiere Pro",
    how: "Lumetri Color, Creative, Look, Browse. Export at 33 points if it will not load.",
    href: "/guides/premiere-pro-lut-not-loading",
    label: "When it will not load",
  },
  {
    app: "Final Cut Pro",
    how: "Add the Custom LUT effect from the Color category and choose the file.",
    href: "/guides/custom-lut-final-cut-pro",
    label: "Custom LUT vs Camera LUT",
  },
];

export function Editors() {
  return (
    <section id="editors" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 md:px-8">
      <Reveal>
        <p className="eyebrow mb-3">In your editor</p>
        <h2 className="max-w-2xl text-[clamp(28px,4vw,46px)]">A standard .cube. It loads everywhere.</h2>
      </Reveal>

      <Reveal delay={0.08}>
        <ul className="mt-10 flex flex-col divide-y divide-hairline border-y border-hairline">
          {EDITORS.map((e) => (
            <li
              key={e.app}
              className="grid gap-2 py-5 sm:grid-cols-[180px_1fr_auto] sm:items-baseline sm:gap-8"
            >
              <h3 className="text-[17px] font-semibold tracking-tight">{e.app}</h3>
              <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-muted">{e.how}</p>
              <a
                href={e.href}
                className="text-[13.5px] text-accent transition-colors hover:text-accent-hi sm:justify-self-end sm:whitespace-nowrap"
              >
                {e.label} →
              </a>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.14}>
        <p className="mt-6 max-w-[68ch] text-[14.5px] leading-relaxed text-muted">
          <span className="text-warn">Shooting log?</span> Convert to Rec.709 before the LUT, or it
          looks flat.{" "}
          <a
            href="/guides/lut-looks-flat-slog3"
            className="text-text underline decoration-hairline-2 underline-offset-4 transition-colors hover:decoration-accent"
          >
            The one-node fix in each editor.
          </a>
        </p>
      </Reveal>
    </section>
  );
}
