# ChromaMimic — Design System

## Theme (justified, not reflexive)

Scene: a videographer at 1am in a dim grading suite, matching a client's footage to a film still on a calibrated monitor. The surround must be dark so the on-screen frames read true. **Dark is correct here**, not decorative.

## Color strategy: Restrained

Tinted near-black neutrals + **one** accent used ≤10% of the surface. The accent is a warm champagne (the "warm" pole of a color grade), reserved for the primary action, focus rings, and a few load-bearing highlights. A cool steel is used **only** inside the hero shader as the opposing pole of the "match." No neon. No rainbow. No gradient text.

All values OKLCH. Neutrals tinted warm (hue ~75) at near-zero chroma so the dark never goes clinical blue-gray. Never `#000` / `#fff`.

| Token | OKLCH | Role |
|---|---|---|
| `--bg` | `oklch(0.145 0.004 75)` | page base (warm near-black) |
| `--bg-2` | `oklch(0.175 0.005 75)` | recessed wells |
| `--surface` | `oklch(0.205 0.006 75)` | raised panels |
| `--surface-2` | `oklch(0.245 0.007 75)` | controls, inputs |
| `--hairline` | `oklch(1 0 0 / 0.08)` | borders |
| `--hairline-2` | `oklch(1 0 0 / 0.14)` | stronger borders / hover |
| `--text` | `oklch(0.965 0.004 80)` | primary text |
| `--muted` | `oklch(0.72 0.006 80)` | secondary text |
| `--faint` | `oklch(0.55 0.006 80)` | tertiary / captions |
| `--accent` | `oklch(0.83 0.085 78)` | champagne accent (CTA, focus) |
| `--accent-soft` | `oklch(0.83 0.085 78 / 0.12)` | accent wash |
| `--accent-ink` | `oklch(0.2 0.02 75)` | text on accent |
| `--cool` (hero only) | `oklch(0.55 0.05 250)` | shader cool pole |
| `--ok` | `oklch(0.78 0.11 165)` | success status |
| `--warn` | `oklch(0.82 0.11 80)` | warning status |
| `--danger` | `oklch(0.68 0.16 25)` | error status |

## Typography

- **Display:** "Inter Tight" — tight tracking, weights 500–700, used large and confident. Cinematic, not quirky.
- **Body / UI:** "Inter".
- **Mono:** "JetBrains Mono" — uppercase tracked eyebrows, technical labels, LUT values, spec lines. The mono is the signature: it reads "color engineering," which separates us from the neon-color-tool reflex.
- Scale ratio ≥1.25. Body line length 65–75ch. Headlines may go wide; never let body wrap to 6+ short lines.

## Elevation (soft layered shadows)

- `--shadow-sm`: `0 1px 2px oklch(0 0 0 / 0.3)`
- `--shadow`: `0 8px 24px -12px oklch(0 0 0 / 0.55), 0 2px 6px -3px oklch(0 0 0 / 0.4)`
- `--shadow-lg`: `0 24px 60px -28px oklch(0 0 0 / 0.7), 0 8px 20px -12px oklch(0 0 0 / 0.5)`
- Accent glow (used sparingly on primary CTA only): `0 8px 30px -10px oklch(0.83 0.085 78 / 0.35)`

## Geometry

- Radius: **8px** everywhere (`--radius: 8px`); pills for toggles only.
- 8px spacing grid. Vary section rhythm; generous vertical breathing between sections (96–160px).
- Hairline borders + soft shadow define surfaces. **No glassmorphism by default.**

## Motion

- Ease-out only, exponential: `cubic-bezier(0.16, 1, 0.3, 1)`. No bounce, no elastic.
- Animate `transform` / `opacity` only (GPU). Never animate layout props.
- Section reveals: short translate-up + fade, staggered. Respect `prefers-reduced-motion` (disable shader + reveals).

## Bans (enforced)

Gradient text, side-stripe borders, default glassmorphism, hero-metric template, identical 3-card grids, modal-first, em dashes in copy.
