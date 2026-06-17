import { useEffect, useRef } from "react";
import { HeroShader } from "../webgl/hero-shader";
import { Reveal } from "./ui/Reveal";

const NLES = ["DaVinci Resolve", "Premiere Pro", "Final Cut"];

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !HeroShader.isSupported()) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shader: HeroShader | null = null;
    try {
      shader = new HeroShader(canvas, { cool: "#39506b", warm: "#7d5a39" });
    } catch {
      return;
    }
    const onResize = () => shader?.resize();
    window.addEventListener("resize", onResize);

    let io: IntersectionObserver | null = null;
    if (reduce) {
      shader.renderStatic();
    } else {
      io = new IntersectionObserver(
        ([e]) => (e.isIntersecting ? shader?.start() : shader?.stop()),
        { threshold: 0.02 },
      );
      io.observe(canvas);
    }
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", onResize);
      shader?.dispose();
    };
  }, []);

  return (
    <section id="top" className="relative overflow-hidden border-b border-hairline">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/55 to-bg" />

      <div className="relative mx-auto grid max-w-[1180px] gap-7 px-5 pb-24 pt-24 text-center md:px-8 md:pb-32 md:pt-32">
        <Reveal as="p" className="eyebrow">
          Reference match · grade · export
        </Reveal>

        <Reveal
          as="h1"
          delay={0.06}
          className="mx-auto max-w-4xl text-[clamp(38px,6.5vw,76px)] font-semibold leading-[1.02]"
        >
          Match any film look.
          <br />
          Export a <span className="text-accent">free .cube LUT.</span>
        </Reveal>

        <Reveal
          as="p"
          delay={0.12}
          className="mx-auto max-w-xl text-[16px] leading-relaxed text-muted md:text-[17px]"
        >
          Drop an original and a reference still. ChromaMimic learns the colour transform and writes
          a .cube for Resolve, Premiere and Final Cut. In your browser, nothing uploaded.
        </Reveal>

        <Reveal
          as="div"
          delay={0.18}
          className="mx-auto flex flex-wrap items-center justify-center gap-3"
        >
          <a href="#tool" className="btn btn-primary px-6 py-3 text-[15px]">
            Build a LUT, free
          </a>
          <a href="#how" className="btn btn-ghost px-6 py-3 text-[15px]">
            See how it works
          </a>
        </Reveal>

        <Reveal
          as="div"
          delay={0.26}
          className="mx-auto mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-faint"
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_10px_var(--color-ok)]" />
            Runs locally, nothing uploaded
          </span>
          <span className="hidden text-hairline-2 sm:inline">·</span>
          <span className="font-mono uppercase tracking-wider">{NLES.join("  ·  ")}</span>
        </Reveal>
      </div>
    </section>
  );
}
