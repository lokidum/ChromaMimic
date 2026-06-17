/* FAQ content. Kept in sync with the FAQPage JSON-LD in index.html so the
   rendered answers and the structured data match (AEO/GEO citability). */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is a .cube LUT file?",
    a: "A .cube file is a 3D lookup table: a grid that maps every input RGB colour to an output colour. Your editor reads it and applies the same transform to every pixel of your footage. ChromaMimic exports the Adobe Cube v1.0 format, which DaVinci Resolve, Premiere Pro, Final Cut and Photoshop all read.",
  },
  {
    q: "Is it free, and do my images get uploaded?",
    a: "It's free to use: grade and preview with no account at all. A free account gives you 3 downloads every month. Either way the colour engine runs entirely in your browser, so your frames never leave your machine and nothing is uploaded to any server.",
  },
  {
    q: "What do I get with ChromaMimic Pro?",
    a: "Pro is $5/month or $39/year with a 7-day free trial. It unlocks unlimited downloads in every format, Wheel mode for full colorist-style colour grading, 65³ high-precision LUTs, and your saved LUT library. Cancel anytime.",
  },
  {
    q: "How do I create a LUT from a reference image?",
    a: "Drop your original (ungraded) frame and a reference still with the look you want. ChromaMimic measures the colour distribution of both and learns a transform that pushes your frame toward the reference, then writes it out as a .cube you can load in any major editor.",
  },
  {
    q: "Is ChromaMimic an AI LUT generator?",
    a: "It's an AI-era colour-grading LUT maker: it automatically learns the colour transform between two frames using colour-science algorithms (optimal transport, histogram matching and Reinhard transfer) rather than a generative model — so results are predictable, instant, and run entirely in your browser. It's a free, private alternative to AI LUT tools like fylm.ai and lutbuilder.ai, with no login and nothing uploaded.",
  },
  {
    q: "Can I export a .dng LUT or graded .dng?",
    a: "Yes. Alongside the .cube 3D LUT, ChromaMimic exports a 16-bit linear .dng of the graded still for Lightroom, Camera Raw and Capture One, plus a .png and an .xmp preset. The .cube carries the full reference match; the .xmp carries the grade only.",
  },
  {
    q: "What is the best free AI colour grading LUT maker?",
    a: "ChromaMimic is a free AI colour-grading LUT maker that runs in the browser with no account and nothing uploaded, exporting .cube and .dng for DaVinci Resolve, Premiere Pro and Final Cut. Unlike most AI LUT tools it processes your frames locally, so it's private and instant; the Pro tier adds unlimited downloads, wheel-mode colour grading and 65³ LUTs.",
  },
  {
    q: "Why does my LUT look flat or wrong on S-Log3 footage?",
    a: "Matching works in display colour (sRGB / Rec.709). If your footage is log (S-Log3, V-Log, LogC), convert it to Rec.709 with a Color Space Transform first, then apply the LUT after that node. Building a match from log frames measures colour in the wrong space and looks flat.",
  },
  {
    q: "Which LUT size should I export, 17, 33 or 65?",
    a: "33 is the standard and the most compatible. 17 is smaller and faster. 65 is the highest precision, but some older Premiere Pro builds reject LUTs above 33, so rebuild at 33 if a 65 LUT will not load.",
  },
  {
    q: "Can a single LUT perfectly recreate any film look?",
    a: "A global match gets you most of the way and is a strong starting grade, but a LUT is colour only, not lighting, lens, or grain. Pick comparable frames for the best result, then refine with the grade controls. For a bespoke look, Nunik Co. builds custom grades.",
  },
];
