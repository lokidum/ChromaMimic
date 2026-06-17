import { useState } from "react";
import { Modal } from "./Modal";
import { PRICING, PRO_BENEFITS, type Plan, type PaywallReason } from "../../lib/entitlements/types";
import { cn } from "../../lib/cn";

const HEADLINES: Record<PaywallReason, { title: string; body: string }> = {
  limit: {
    title: "You're out of free downloads this month",
    body: "Go Pro for unlimited exports in every format, plus Wheel mode and 65³ LUTs.",
  },
  "pro-feature": {
    title: "This is a Pro feature",
    body: "Wheel mode and 65³ high-precision LUTs are part of Pro. Unlock the full colorist toolkit.",
  },
  upgrade: {
    title: "Unlock the full colour suite",
    body: "Everything in ChromaMimic, no limits.",
  },
};

export function PaywallModal({
  open,
  onClose,
  reason = "upgrade",
  onUpgrade,
}: {
  open: boolean;
  onClose: () => void;
  reason?: PaywallReason;
  onUpgrade: (plan: Plan) => void;
}) {
  const [plan, setPlan] = useState<Plan>("annual");
  const head = HEADLINES[reason];

  return (
    <Modal open={open} onClose={onClose} labelledBy="paywall-title">
      <div className="p-7">
        <p className="eyebrow mb-2">ChromaMimic Pro</p>
        <h2 id="paywall-title" className="text-[24px]">
          {head.title}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{head.body}</p>

        <ul className="mt-5 flex flex-col gap-2.5">
          {PRO_BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-[14px] text-text">
              <Check />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {(["annual", "monthly"] as const).map((id) => {
            const p = PRICING[id];
            const active = plan === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPlan(id)}
                className={cn(
                  "relative rounded-[8px] border p-3.5 text-left transition-colors",
                  active
                    ? "border-accent bg-accent/10"
                    : "border-hairline-2 bg-bg-2 hover:border-hairline-2",
                )}
              >
                {p.note && (
                  <span className="absolute -top-2 right-2 rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent-ink">
                    {p.note}
                  </span>
                )}
                <div className="text-[12px] text-muted">{p.label}</div>
                <div className="mt-0.5 font-display text-[22px] font-semibold">
                  {p.price}
                  <span className="text-[12px] font-normal text-faint">{p.period}</span>
                </div>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => onUpgrade(plan)} className="btn btn-primary mt-5 w-full">
          Start 7-day free trial
        </button>
        <p className="mt-3 text-center text-[12px] text-faint">
          Then {PRICING[plan].price}{PRICING[plan].period}. Cancel anytime.
        </p>
      </div>
    </Modal>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.1 13.3 5 10.2l-1.2 1.2 4.3 4.3 8-8L14.9 6.5z"
      />
    </svg>
  );
}
