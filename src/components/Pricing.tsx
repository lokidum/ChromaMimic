import { useState } from "react";
import { Reveal } from "./ui/Reveal";
import { useEntitlements } from "../lib/entitlements";
import { PRICING, PRO_BENEFITS } from "../lib/entitlements/types";
import { cn } from "../lib/cn";

const FREE_BENEFITS = [
  "Full reference matching + grading",
  "Live before/after preview & scope",
  "3 downloads every month",
  "17³ and 33³ LUTs",
  "Runs in your browser, nothing uploaded",
];

export function Pricing() {
  const ent = useEntitlements();
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");
  const p = PRICING[plan];

  return (
    <section id="pricing" className="mx-auto max-w-[1080px] scroll-mt-24 px-5 md:px-8">
      <Reveal>
        <div className="text-center">
          <p className="eyebrow mb-3">Pricing</p>
          <h2 className="text-[clamp(28px,4vw,46px)]">Start free. Go Pro when it pays for itself.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
            Grade and preview for free, forever. Create an account for downloads. One LUT pack for a
            client covers a year of Pro.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mb-8 mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-hairline bg-bg-2 p-1">
            {(["monthly", "annual"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlan(id)}
                className={cn(
                  "rounded-full px-5 py-2 text-[13px] font-semibold capitalize transition-colors",
                  plan === id ? "bg-accent text-accent-ink" : "text-muted hover:text-text",
                )}
              >
                {id}
                {id === "annual" && (
                  <span className={cn("ml-1.5", plan === id ? "text-accent-ink/70" : "text-accent")}>
                    -35%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Reveal delay={0.12}>
          <div className="panel flex h-full flex-col p-7">
            <div className="text-[13px] font-medium text-muted">Free</div>
            <div className="mt-2 font-display text-[40px] font-semibold leading-none">$0</div>
            <p className="mt-2 text-[13px] text-faint">For trying it and the occasional grade.</p>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {FREE_BENEFITS.map((b) => (
                <Benefit key={b}>{b}</Benefit>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => (ent.status === "guest" ? ent.requireSignIn() : undefined)}
              disabled={ent.status !== "guest"}
              className="btn btn-ghost mt-7 w-full disabled:opacity-100"
            >
              {ent.status === "guest" ? "Create free account" : "You're on Free"}
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="relative flex h-full flex-col rounded-[12px] border border-accent/40 bg-surface p-7 shadow-[0_24px_60px_-30px_oklch(0.83_0.085_78/0.4)]">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-25 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--color-accent), transparent 70%)" }}
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between">
              <div className="text-[13px] font-medium text-accent">Pro</div>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                7-day free trial
              </span>
            </div>
            <div className="relative mt-2 flex items-end gap-1.5">
              <span className="font-display text-[40px] font-semibold leading-none">{p.price}</span>
              <span className="pb-1 text-[13px] text-faint">{p.period}</span>
            </div>
            <p className="relative mt-2 text-[13px] text-faint">
              For working filmmakers and colorists. Cancel anytime.
            </p>
            <ul className="relative mt-6 flex flex-1 flex-col gap-3">
              {PRO_BENEFITS.map((b) => (
                <Benefit key={b} accent>
                  {b}
                </Benefit>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => (ent.isPro ? void ent.manageBilling() : ent.openPaywall("upgrade"))}
              className="btn btn-primary relative mt-7 w-full"
            >
              {ent.isPro ? "Manage billing" : "Start free trial"}
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Benefit({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-[14px] text-text">
      <svg
        viewBox="0 0 20 20"
        className={cn("mt-0.5 h-4 w-4 shrink-0", accent ? "text-accent" : "text-muted")}
        aria-hidden="true"
      >
        <path fill="currentColor" d="M8.1 13.3 5 10.2l-1.2 1.2 4.3 4.3 8-8L14.9 6.5z" />
      </svg>
      {children}
    </li>
  );
}
