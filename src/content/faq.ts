/* FAQ content. Kept in sync with the FAQPage JSON-LD in index.html so the
   rendered answers and the structured data match. Short answers here; the
   long form lives in /guides, which each answer links to where it helps. */
export type FaqItem = { q: string; a: string; more?: { href: string; label: string } };

export const FAQ: FaqItem[] = [
  {
    q: "What is a .cube LUT file?",
    a: "A 3D lookup table: a grid that maps every input colour to an output colour. Your editor applies the same map to every pixel. DaVinci Resolve, Premiere Pro, Final Cut Pro and Photoshop all read it.",
    more: { href: "/guides/what-is-a-cube-lut", label: "What is inside a .cube, and 17 vs 33 vs 65" },
  },
  {
    q: "Is it free, and do my images get uploaded?",
    a: "Grading and previewing are free with no account. A free account gives you three downloads a month. The colour engine runs in your browser, so your frames never leave your machine.",
    more: { href: "/guides/nothing-uploaded", label: "How to verify nothing is uploaded" },
  },
  {
    q: "How do I create a LUT from a reference image?",
    a: "Load your ungraded frame and a still with the look you want. ChromaMimic measures both, learns the transform between them and writes it out as a .cube. Set the strength, nudge the grade, download.",
    more: { href: "/guides/create-lut-from-reference-image", label: "The full walkthrough, with what to check" },
  },
  {
    q: "Why does my LUT look flat on S-Log3 footage?",
    a: "The LUT expects Rec.709 and is being fed log. Convert the footage first, with a Color Space Transform in Resolve, the Input LUT slot in Premiere or the Camera LUT in Final Cut, then apply the LUT after it.",
    more: { href: "/guides/lut-looks-flat-slog3", label: "The fix in each editor" },
  },
  {
    q: "Is ChromaMimic an AI LUT generator?",
    a: "It learns the colour transform between two frames automatically, using colour science rather than a generative model. So it is instant and predictable, and it runs entirely on your machine.",
  },
  {
    q: "Can one LUT recreate any film look?",
    a: "It gets you the palette and tonal feel in one move, which is most of the distance. A LUT is a global map, so it cannot isolate a sky or track a face. For that, the studio behind ChromaMimic grades it properly.",
    more: { href: "#studio", label: "Work with Nunik Co." },
  },
];
