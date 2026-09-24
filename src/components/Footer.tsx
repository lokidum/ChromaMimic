import { Logo } from "./Logo";

const LINKS = [
  { href: "#tool", label: "Build a LUT" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "/guides", label: "Guides" },
  { href: "#studio", label: "Studio" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="mt-28 border-t border-hairline">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-5 py-12 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <a href="#top" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-[15px] font-semibold tracking-tight">ChromaMimic</span>
          </a>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-muted" aria-label="Footer">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="py-1 transition-colors hover:text-text">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <p className="text-[12.5px] text-faint">
          © {new Date().getFullYear()} ChromaMimic, by{" "}
          <a href="https://nunik.co" className="transition-colors hover:text-text">
            Nunik Co.
          </a>
        </p>
      </div>
    </footer>
  );
}
