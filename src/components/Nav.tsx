import { Logo } from "./Logo";
import { AccountMenu } from "./AccountMenu";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#uses", label: "Use cases" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="font-display text-[16px] font-semibold tracking-tight">ChromaMimic</span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
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
        <div className="flex items-center gap-4">
          <AccountMenu />
          <a href="#tool" className="btn btn-primary px-4 py-2 text-[13px]">
            Build a LUT
          </a>
        </div>
      </div>
    </header>
  );
}
