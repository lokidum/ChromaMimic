import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "../../lib/cn";

/* Scroll/entrance reveal via IntersectionObserver + CSS transition.
   Robust and SEO-safe: content lives in the DOM, degrades to visible if JS or
   IO is unavailable, and animates with GPU transforms (ease-out-expo).
   Above-the-fold elements reveal immediately since IO reports them on observe. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const Tag = as as ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", shown && "reveal-in", className)}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </Tag>
  );
}
