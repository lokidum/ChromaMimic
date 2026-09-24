---
project: ChromaMimic
type: research
created: 2026-09-24
tags: [seo, competitors, go-to-market, nunik-co]
---

# ChromaMimic, competitor analysis and SEO state, September 2026

Companion to Service_and_SEO_Plan.md. That plan's ten topic cluster was written in June. This note records what the market looks like now, what was built on 24 September, and the re-cut page list. Prices and limits below were read from each product's public pages on 24 September 2026 and will drift.

## What is built

- `scripts/build-seo.mjs` generates `public/guides/<slug>.html`, `public/guides/index.html` and `public/sitemap.xml`. It runs first in `npm run build` and alone as `npm run seo`. Vercel serves files from `public/` before the SPA rewrite, and `cleanUrls` drops the `.html`, so every guide is a real URL. The generated files are committed.
- Nine guides, each with Article or TechArticle, BreadcrumbList and FAQPage structured data (plus HowTo on the pillar), a mid page call to action to the tool, related guide links and a shared dark template that matches the app.
- The homepage title now leads with "Free LUT Generator from Two Frames, Nothing Uploaded" rather than "AI Colour-Grading LUT Maker". The audience is sceptical of AI LUT claims and the two frame, private, free angle is the one no competitor can copy cheaply. AI stays in the description as a secondary descriptor.
- `robots.txt` disallows `/api/` and lists the AI crawlers. `llms.txt` lists every guide. Nav and footer link to `/guides`.
- nunik.co links to ChromaMimic from every footer and its llms.txt.

## The direct competitors

| Tool | Match type | Free tier really gets you | Paid from | Account to grade | Where it runs | Exports |
|---|---|---|---|---|---|---|
| ChromaMimic | Two frames | Grade and preview, no account; 3 .cube a month with a free account | US$5/mo or $39/yr unlimited | No | Browser, nothing uploaded | .cube .dng .png .xmp, 17/33/65 |
| LUTBuilder.ai | Two frames plus text prompt | 5 generations, watermarked PNG, no .cube | $5.99/mo for 10 downloads, $14.99 for 50, $29.99 unlimited | Yes | Says browser; AI step undocumented | .cube (paid) |
| fylm.ai | Colour Match (two frames, paid), Colour Extract (one image) | 3 projects, no LUT export | $7/mo annual Lite, $15 Pro, $30 Team | Yes | Cloud | .cube .xmp ICC |
| Imagen AI LUT Generator | One image | Free .cube, no sign up | None | No | Not stated | .cube |
| Luttie | One image plus a full browser grader | Watermarked, no .cube | $12 week, $21.99/mo, $109 lifetime | Yes | Says client side | .cube (Pro) |
| SammaPix Color Match | One image | Free .cube, no sign up | Pro, price unshown | No | Browser, no upload | .cube 17 only |
| Picture Instruments Image 2 LUT | Two frames | Trial | $46 one off, desktop | No | Local | .3dl .cube .mga |
| AICreate LUT Generator | None, sliders | Everything | None | No | Browser | .cube 17/33 |

Color.io, which used to own "online LUT converter" and "lut previewer", announced a shutdown for the end of 2025 and its domain no longer resolves. Those rankings are open.

The content leader is Luttie: 58 posts since April 2026 covering every NLE install guide, every camera log guide, comparison pages against Colourlab, Dehancer and the editors, and eleven single free LUT pages that already rank for "teal and orange lut" and "kodak film emulation lut free". It proves a young site can rank in this niche on content velocity, and it means the generic "how to install a LUT in Resolve/Premiere/FCP" articles from the June plan are no longer first choices.

## Keyword groups and what is realistic

- Tool intent. "lut generator" is a head term (IWLTBAP, Imagen, Filmora): not yet. "create lut from image", "lut generator from image", "lut maker online free", "lut from two images", "match lut from reference": yes, the results include dead products and thin pages.
- How to. The bare NLE install queries are owned by gamut.io, Boris FX, Apple and Luttie. The sub queries are weak: "davinci resolve lut folder location", "lut not showing up davinci resolve", "custom lut not loading premiere pro", "65 point lut premiere". Built.
- "lut looks flat slog3" and "lut washed out log": forum results and one vendor sales page. The best opportunity in the set. Built.
- Comparison. "fylm.ai alternative", "lutbuilder.ai alternative", "best free lut generator": directory pages only, no editorial. Built.
- "cube to xmp", "lut to lightroom preset": two small converter sites and GitHub. Built, and ChromaMimic is the only tool with a native .dng.
- Adjacent head terms ("free luts", "cinematic luts", "sony slog3 lut"): library dominated. Only enter with an ungated single LUT page, the Luttie pattern.

## Guides shipped, in priority order

1. `/guides/lut-looks-flat-slog3`
2. `/guides/create-lut-from-reference-image` (the pillar, HowTo schema)
3. `/guides/best-free-lut-generator` (comparison, seven tools)
4. `/guides/nothing-uploaded` (privacy proof, with the network tab and offline test)
5. `/guides/davinci-resolve-lut-folder-location` (all four builds, App Store sandbox path)
6. `/guides/premiere-pro-lut-not-loading` (65 versus 33, Input LUT versus Creative Look)
7. `/guides/custom-lut-final-cut-pro` (Camera LUT versus Custom LUT)
8. `/guides/cube-to-xmp-dng` (Lightroom via a Camera Raw profile, what the .dng is for)
9. `/guides/what-is-a-cube-lut` (format, sizes, a look inside the file)

## Not built yet, in order

1. A free, ungated S-Log3 to Rec.709 conversion LUT download page. Needs a technically correct conversion LUT, which the matcher does not produce; generate it from Resolve's CST or a manufacturer table. The pattern that earned Noam Kroll, Kondor Blue and Alister Chapman their links. Apple Log and C-Log3 next.
2. A wedding worked example: a real original and reference, before and after frames, the downloadable .cube. Needs real footage. Highly shareable in wedding videography groups.
3. "We tested eight free LUT generators on the same frame pair": same frames through every tool, scopes and the resulting files published. Nobody has produced this data and the reviewers and roundup writers want it.
4. A short YouTube walkthrough. LUTBuilder.ai and fylm.ai get their tutorial traffic from two or three videos each and there is no video for the two frame browser workflow.
5. The June plan's generic NLE how-tos and "7 mistakes" as supporting pages, once the above exist.

## Where to get listed

1. AlternativeTo, as an alternative to fylm.ai, Color.io (dead, its alternatives page will be visited), 3D LUT Creator (discontinued), lutCreator.js and Video LUT.
2. There's An AI For That, Toolify, Stork.ai, AI Tools Forest. fylm.ai is on all four, LUTBuilder.ai is not.
3. Product Hunt. No LUT generator has launched there.
4. G2. fylm.ai's alternatives page is thin; a handful of genuine reviews gets ChromaMimic onto it.
5. A Hugging Face Space or GitHub Pages demo of the engine, to make the client side claim visibly true to developers.
6. r/davinciresolve and r/premiere, framed as a question and honest about log limits. Post the S-Log3 guide, not the tool. r/colorists is hostile to tool promotion; participate, do not launch.
7. Blackmagic Design forum, Colour section, with a signature link and useful answers.
8. Facebook wedding videographer groups and Sony Alpha communities, with the wedding example and the free S-Log3 LUT.
9. Jonny Elwyn's free LUTs roundup and New32's "151+ free LUTs" accept submissions.
10. CineD, No Film School and RedShark have each covered fylm.ai or Image 2 LUT before.

## Press angles

1. The Color.io gap: the free browser LUT tool the press pointed people to shut down. Pitch ChromaMimic as the free, private, browser native successor.
2. Privacy for unreleased footage: why colour tools should not upload client frames. Only ChromaMimic can run this because the others upload.
3. The free S-Log3 conversion LUT with the "convert, then match" workflow.
4. The eight tool test, offered to Shotkit, Freelance Video Collective, Fstoppers and pixflow.net.
5. Local: a Canberra studio shipping a free tool used by wedding videographers, for Australian Cinematographer, Inside Film and Startup Daily.

## Unverified

Numeric volumes and difficulty (no Semrush or Ahrefs access), AI Overview presence per query, Reddit thread history and current subreddit rules, whether LUTBuilder.ai's AI step is really client side, whether Imagen's tool uploads, and every competitor's traffic figure.
