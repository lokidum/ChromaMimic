---
project: LUT Builder
type: project
status: MVP working
created: 2026-06-17
tags: [development, tooling, colour, web-app, nunik-potential]
---

# LUT Builder

A browser-based tool that takes an original frame and a reference (graded) frame, learns the colour transformation between them, and exports a `.cube` 3D LUT you can drop straight into DaVinci Resolve, Adobe Premiere, or Final Cut. Same core idea as lutbuilder.ai and fylm.ai, but running fully client-side so nothing leaves the machine.

## What is here

- [[index.html]] : the working app. Open it in any modern browser, no build step, no server.
- [[Architecture_and_Roadmap]] : how it works under the hood, the algorithm notes, and where it could go next.
- [[Service_and_SEO_Plan]] : go-to-market, freemium model, and a search content cluster to make the tool findable.
- `assets/` : screenshots, sample frames, exported sample LUTs.

## Status

Hardened build, functional and validated. Four colour matching methods, three LUT resolutions, strength slider, smoothing/regularisation, black-and-white normalisation, log colour-space guidance, before/after preview, and `.cube` download all work. Output and robustness were verified programmatically (27/27 checks across two suites: header, node counts per size, value ranges, red-fastest ordering, strength behaviour, optimal-transport convergence, NaN guard, black/white normalisation, and smoothing).

## What got hardened (after research)

- **Log footage warning.** Matching only makes sense in sRGB / Rec.709. A colour-space selector now warns when frames are log and bakes a "convert first, apply after a CST node" reminder into the exported `.cube`. This is the number one reason LUTs look wrong in the real world.
- **Optimal-transport regularisation.** OT mappings are mathematically irregular and create artefacts; a smoothing control applies a light 3D blur to the LUT grid to clean that up.
- **Milky-black fix.** A black-and-white normalisation toggle pins true black and white so grades do not come out washed out.
- **NaN guard.** Out-of-gamut maths can emit NaN that corrupts a `.cube`; bad nodes now fall back to identity.
- **Portability.** 33³ is the default for universal compatibility, with an in-app note that some older Premiere builds reject 65³.
- **Resilience.** File-type validation, friendly error messages, and chunked async generation with a progress bar so big builds never freeze the browser.

## How to use it right now

1. Open `index.html` in a browser.
2. Drop your original frame on the left, your reference look on the right.
3. Pick a method (start with Reinhard + Histogram blend) and resolution (33 is standard).
4. Press Build LUT, drag the compare handle to check it, then Download .cube.
5. Load the `.cube` in Resolve (right-click clip > LUT, or the Color page LUT browser), Premiere (Lumetri > Creative > Look, or Basic Correction > Input LUT), or Final Cut (Custom LUT effect).

## Reference points

- lutbuilder.ai : the direct inspiration, single-purpose frame-to-LUT matcher.
- fylm.ai : broader grading platform, LUT generation is one feature among many.
