import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-28 border-t border-hairline">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-5 py-12 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <a href="#top" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-[15px] font-semibold tracking-tight">ChromaMimic</span>
          </a>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
            <a href="#tool" className="transition-colors hover:text-text">Build a LUT</a>
            <a href="#how" className="transition-colors hover:text-text">How it works</a>
            <a href="#uses" className="transition-colors hover:text-text">Use cases</a>
            <a href="#faq" className="transition-colors hover:text-text">FAQ</a>
            <a href="#studio" className="transition-colors hover:text-text">Studio</a>
            <a href="/privacy" className="transition-colors hover:text-text">Privacy</a>
            <a href="/terms" className="transition-colors hover:text-text">Terms</a>
          </nav>
        </div>
        <p className="font-mono text-[11.5px] leading-relaxed text-faint">
          Adobe Cube LUT spec v1.0 · grade baked into export · sRGB / Rec.709 domain · runs
          client-side, nothing uploaded
        </p>
        <p className="text-[12.5px] text-faint">
          © {new Date().getFullYear()} ChromaMimic, a tool by Nunik Co. Built for filmmakers and
          colourists.
        </p>
      </div>
    </footer>
  );
}
