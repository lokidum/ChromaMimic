import { useEffect, useRef, useState } from "react";
import { useEntitlements } from "../lib/entitlements";
import { cn } from "../lib/cn";

export function AccountMenu() {
  const ent = useEntitlements();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!ent.loaded) return <div className="h-9 w-20" aria-hidden="true" />;

  if (ent.status === "guest") {
    return (
      <button
        type="button"
        onClick={() => ent.requireSignIn()}
        className="text-[13.5px] font-medium text-muted transition-colors hover:text-text"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-hairline-2 bg-bg-2 py-1.5 pl-3 pr-2 text-[13px] transition-colors hover:border-accent"
      >
        {ent.isPro ? (
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
            Pro
          </span>
        ) : (
          <span className="text-muted">
            <span className="font-semibold text-text">{ent.downloadsLeft}</span>
            <span className="text-faint">/{ent.freeLimit}</span> left
          </span>
        )}
        <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-[11px] text-muted">
          {(ent.email?.[0] ?? "?").toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-60 overflow-hidden rounded-[10px] border border-hairline-2 bg-surface shadow-[var(--shadow-lg)]">
          <div className="border-b border-hairline px-4 py-3">
            <div className="truncate text-[13px] text-text">{ent.email}</div>
            <div className="mt-0.5 text-[11.5px] text-faint">
              {ent.isPro
                ? "Pro — unlimited downloads"
                : `Free — ${ent.downloadsLeft} of ${ent.freeLimit} downloads left this month`}
            </div>
          </div>
          <div className="p-1.5">
            {!ent.isPro && (
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  ent.openPaywall("upgrade");
                }}
                className="text-accent"
              >
                Upgrade to Pro
              </MenuItem>
            )}
            {ent.isPro && (
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  void ent.manageBilling();
                }}
              >
                Manage billing
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setOpen(false);
                ent.signOut();
              }}
            >
              Sign out
            </MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[7px] px-2.5 py-2 text-left text-[13.5px] text-text transition-colors hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </button>
  );
}
