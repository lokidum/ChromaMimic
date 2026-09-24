import { FAQ as ITEMS } from "../content/faq";
import { Reveal } from "./ui/Reveal";

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-[860px] scroll-mt-24 px-5 md:px-8">
      <Reveal>
        <p className="eyebrow mb-3">FAQ</p>
        <h2 className="text-[clamp(28px,4vw,46px)]">Questions, answered straight.</h2>
      </Reveal>

      <div className="mt-10 divide-y divide-hairline border-y border-hairline">
        {ITEMS.map((item, i) => (
          <Reveal key={item.q} delay={Math.min(i * 0.05, 0.2)}>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-[16px] font-medium tracking-tight text-text marker:hidden">
                {item.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hairline-2 text-muted transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[68ch] text-[14.5px] leading-relaxed text-muted">{item.a}</p>
              {item.more && (
                <a
                  href={item.more.href}
                  className="mt-3 inline-block text-[13.5px] text-accent transition-colors hover:text-accent-hi"
                >
                  {item.more.label} →
                </a>
              )}
            </details>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="mt-8 text-[14px] text-faint">
          Longer answers, for when you are stuck at 1am:{" "}
          <a href="/guides" className="text-muted underline decoration-hairline-2 underline-offset-4 transition-colors hover:text-text">
            all guides
          </a>
          .
        </p>
      </Reveal>
    </section>
  );
}
