import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { AccountMenu } from "./AccountMenu";
import { cn } from "../lib/cn";

/* The header. The guides at /guides are static pages with a header of their
   own that points back here, so every link is an in-page anchor except Guides. */
const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#editors", label: "Editors" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "/guides", label: "Guides" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-8 md:py-3.5">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <Logo size={30} />
          <span className="hidden font-display text-[16px] font-semibold tracking-tight sm:inline">
            ChromaMimic
          </span>
        </a>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13.5px] text-muted transition-colors hover:text-text"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5 sm:gap-4">
          <AccountMenu />
          <a href="#tool" className="btn btn-primary whitespace-nowrap px-4 py-2.5 text-[13px]">
            Build a LUT
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-[var(--radius)] border border-hairline-2 bg-surface-2 text-text md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      <nav
        id="mobile-nav"
        aria-label="Primary"
        className={cn(
          "border-t border-hairline bg-bg/95 backdrop-blur-xl md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <ul className="mx-auto flex max-w-[1180px] flex-col px-4 py-2 sm:px-5">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-[15px] text-text"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
