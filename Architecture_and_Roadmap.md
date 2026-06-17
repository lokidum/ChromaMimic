---
project: LUT Builder
type: reference
created: 2026-06-17
tags: [development, architecture, colour-science]
---

# LUT Builder, architecture and roadmap

## The core idea in one paragraph

A 3D LUT is just a function from input RGB to output RGB, stored as a lookup grid. To build one from two photos, you take an original frame and a graded reference frame, measure how colour is distributed in each, and learn a mapping that pushes the original's colour distribution toward the reference's. Then you sample that mapping across a regular grid of the whole RGB cube and write the results out as a `.cube` file. The grading software reads that file and applies the same mapping to every pixel of your footage.

The important design point: the mapping has to be defined for any RGB value, not just the colours that happen to appear in the two photos, because the LUT grid asks for colours the photos never contained. That constraint is what rules some naive approaches in and others out.

## How it works under the hood

Everything runs client-side in `index.html`. No server, no upload, no dependencies. The pipeline:

1. **Sample both frames.** Each image is drawn to an offscreen canvas, downsampled (256px long edge, 180px for optimal transport to keep it quick), and read into a flat array of RGB values in the 0 to 1 range. Downsampling is fine because we only need the colour distribution, not detail.

2. **Build a transform** from the chosen method (see below). The transform is a plain function `(r,g,b) -> (r,g,b)`.

3. **Generate the LUT grid.** For a size N LUT we walk an N by N by N grid of input colours, run each through the transform, blend with identity by the strength slider, clamp to 0 to 1, and store. Nodes are written red-fastest (red index changes first, then green, then blue), which is what the Adobe Cube spec requires.

4. **Preview.** The generated LUT is applied back to a downsized copy of the original via trilinear interpolation, so the before/after preview shows exactly what the exported `.cube` will do, not a separate approximation.

5. **Export.** The grid is serialised to Adobe Cube LUT format v1.0: a `TITLE`, `LUT_3D_SIZE`, domain min/max, then one `R G B` line per node.

## The four matching methods

**Reinhard (LAB mean and standard deviation).** Converts to CIELAB, then per channel shifts and scales so the original's mean and spread match the reference's. Closed-form and parametric, so it extends to any RGB value for free. Fast, stable, and good for matching overall tone and colour balance. It is the classic Reinhard et al. colour transfer, just done in LAB rather than the original lαβ.

**Histogram match (per channel).** Builds the cumulative distribution of each RGB channel for both frames and remaps the original's channel values so their distribution matches the reference's. Stronger at matching contrast and tonal shape than Reinhard, but treats channels independently so it can shift hue in ways that occasionally look off. Generalises to any RGB because the per-channel curves are defined across the full 0 to 1 range.

**Reinhard + Histogram blend (default).** Averages the two above. In practice this is the most reliable general-purpose result: Reinhard handles the colour cast, histogram handles the tonal shape, and averaging softens the failure modes of each. This is the recommended starting point.

**Optimal transport (sliced / Iterative Distribution Transfer).** The advanced option, based on Pitié et al. It repeatedly rotates the RGB cloud by a random orthonormal rotation, does a 1D histogram match along each rotated axis, and rotates back, iterating until the two 3D distributions align. Because it is a stored chain of (rotation, 1D map, inverse rotation) steps, the exact same chain replays on the LUT grid, so it generalises correctly. It captures cross-channel relationships the simpler methods miss, at the cost of speed and a bit of noise. Iteration count is exposed as a control (default 12).

## Validation

A headless port of the math (`outputs/test_lut.js` during the build, results in the project history) runs 18 checks:

- Reinhard returns near-identity when the reference equals the original (max grid error under 0.02).
- A warm reference shifts mid-grey warmer for all four methods.
- `.cube` structure is correct at sizes 17, 33, 65: right header, exactly N³ data lines, every line three floats in 0 to 1.
- Node ordering is red-fastest.
- Strength 0 produces a true identity LUT.
- Optimal transport measurably moves the source mean toward the reference mean.

All 18 passed.

## Known limits (honest list)

- Input is assumed sRGB / Rec.709 display gamut. Log footage (S-Log, V-Log, etc.) needs a conversion to a viewing space first, or the match will be measured in the wrong space. A "footage is log" toggle that applies a transfer-function conversion before matching is the obvious next feature.
- The match is global, not spatial. Two frames with very different framing or content can still match well on colour, but a frame with a huge red object and one without will pull the whole grade. Choosing comparable frames matters.
- No gamut mapping on export; out-of-range results are hard-clamped. Fine for delivery LUTs, less ideal as a creative starting grade.
- Large frames at 65³ with optimal transport can take a few seconds. It is single-threaded JS.

## Roadmap

**Phase 1 (done): working MVP.** Frame-to-frame matching, four methods, three sizes, strength, preview, `.cube` export, all client-side.

**Phase 2: make it production-quality.**
- Log / colour space input handling (toggle plus common camera presets).
- Web Worker so the UI never blocks, plus a progress bar.
- A neutral-grey / white-balance pick to anchor the match.
- Export presets: `.cube` at multiple sizes, plus `.3dl` and `.look` for wider tool support.
- Save and name LUTs in-session, batch a folder of frames.

**Phase 3: turn it into a product (optional, Nunik Co. angle).**
- Hosted version at a clean domain, freemium like the references (free at 17/33, paid at 65 plus log support and batch).
- Accounts and a LUT library, shareable links.
- A small backend only if needed for accounts and storage; the colour engine stays client-side so compute cost stays near zero.
- Lightweight API so it can plug into the n8n automation work as a service.

## Tech notes for whoever builds Phase 2

- The whole colour engine is in the `<script>` block of `index.html`, framework-free, so it can be lifted into a Worker or an npm module with no rewrite.
- Colour space helpers (`s2l`, `rgb2lab`, etc.) are standard sRGB and CIELAB D65, easy to swap for Rec.709 or DaVinci Wide Gamut later.
- For a hosted build, wrap it in any static-site setup (Vite, plain HTML on a CDN). No server needed for the core feature.
