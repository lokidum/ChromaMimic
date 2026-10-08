/* The ChromaMimic mark: the CM monogram from assets/brand, rendered from
   the PNG that scripts/gen-brand.mjs derives. It is a dark tile with the
   glow baked in, so it sits on the page as an app icon does. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo-mark.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      decoding="async"
      className="shrink-0 rounded-[7px] ring-1 ring-hairline"
      style={{ width: size, height: size }}
    />
  );
}
