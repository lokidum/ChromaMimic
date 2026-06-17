/* ChromaMimic mark: two overlapping color fields converging through a lens
   aperture, the "match". Monochrome by default; uses the accent on the
   convergence. Replaces the old gradient "L" square. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-surface)" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7.5"
        stroke="var(--color-hairline-2)"
      />
      <circle cx="13" cy="16" r="6.5" stroke="var(--color-muted)" strokeWidth="1.6" />
      <circle cx="19" cy="16" r="6.5" stroke="var(--color-accent)" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="2" fill="var(--color-accent)" />
    </svg>
  );
}
