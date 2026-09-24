#!/usr/bin/env node
// Generates the static, crawlable pages that sit next to the single page
// app: public/guides/<slug>.html, public/guides/index.html and
// public/sitemap.xml. Vite copies public/ into dist/ verbatim, and Vercel
// serves a file from the filesystem before it applies the SPA rewrite in
// vercel.json, so every guide is a real URL with real HTML for a crawler,
// with cleanUrls turning /guides/foo.html into /guides/foo.
//
// Runs as the first step of `npm run build` and on its own as
// `npm run seo`. The generated files are committed so a deploy that skips
// the build step still ships them.
//
// Adding a guide: append to GUIDES below. Keep the body in the same voice
// as the app (precise, honest, no hype) and end every guide with a path
// back to the tool. Australian English.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const SITE = "https://chromamimic.nunik.co";
const OG_IMAGE = `${SITE}/og-image.png`;
// Bump by hand when a guide materially changes. Never the build clock.
const UPDATED = "2026-09-24";

const PRICE_NOTE =
  "Prices, limits and features were checked on each product's public pages on 24 September 2026. They change. Check before you buy.";

// ---------------------------------------------------------------------------
// Content

const GUIDES = [
  {
    slug: "lut-looks-flat-slog3",
    title: "Why your LUT looks flat on S-Log3 (and how to fix it in Resolve, Premiere and Final Cut)",
    metaTitle: "LUT looks flat on S-Log3? The colour space step you are missing",
    description:
      "A creative LUT built in Rec.709 will look flat, milky or blown out on S-Log3, V-Log, C-Log or LogC footage. Here is exactly why, and the one node to add in DaVinci Resolve, Premiere Pro and Final Cut so the LUT lands the way it was designed.",
    keywords: ["lut looks flat slog3", "lut washed out log footage", "s-log3 lut flat", "colour space transform lut", "why does my lut look wrong"],
    type: "TechArticle",
    minutes: 6,
    body: `
<p class="lede">You built a LUT from a reference you love, dropped it on your S-Log3 clip, and the picture went milky: lifted blacks, grey highlights, colours that sit in the wrong place. The LUT is not broken. It was measured in one colour space and you applied it in another.</p>

<h2>What log footage actually is</h2>
<p>S-Log3, V-Log, C-Log3, N-Log, Apple Log and ARRI LogC are all ways of storing more dynamic range than a display can show. The camera squeezes fourteen or more stops into a flat, low contrast, low saturation image so that nothing clips in the file. Nothing about that picture is meant to be looked at. It is a container.</p>
<p>A Rec.709 image is the opposite: it is already display referred. The blacks are black, the whites are white, the saturation is where your eye expects it. Almost every reference still you will ever match to (a film frame, a graded screenshot, a photo you like) is Rec.709 or sRGB.</p>

<h2>Why the LUT looks wrong</h2>
<p>A 3D LUT is a lookup table. It says "when the input pixel is this RGB value, output that RGB value". It has no idea what the input represents. If you build the LUT from a Rec.709 original and a Rec.709 reference, every entry in the table assumes Rec.709 input.</p>
<p>Feed it S-Log3 and the table is answering the wrong question. Mid grey in S-Log3 sits around 41 percent; in Rec.709 it sits around 18 to 20 percent. So the LUT reads your properly exposed midtones as bright highlights and your shadows as midtones. Everything shifts up and flattens. Saturation goes the same way, because log encodes chroma in a compressed gamut the LUT never saw.</p>
<p>The same thing happens in reverse if you build a LUT from log frames. ChromaMimic measures colour distributions to learn the transform, and a log frame has a distribution that means nothing in display space. Match two log frames and the LUT will be flat by construction.</p>

<h2>The fix, in one sentence</h2>
<p>Convert log to Rec.709 first, then apply the creative LUT after that conversion. Two steps, in that order, every time.</p>
<p>The conversion is called a colour space transform (CST), or sometimes a technical LUT or input LUT. The camera manufacturer's official log to Rec.709 LUT is one; Resolve's built in Color Space Transform effect is a better one because it is maths rather than a fixed table.</p>

<h2>DaVinci Resolve</h2>
<ol>
<li>On the Color page, add a node before your creative node.</li>
<li>Open the Effects panel, find <strong>Color Space Transform</strong> under Resolve FX Color, and drag it onto that first node.</li>
<li>Set Input Color Space and Input Gamma to match the camera. For Sony that is S-Gamut3.Cine and S-Log3. Panasonic is V-Gamut and V-Log. Canon is Cinema Gamut and Canon Log 3.</li>
<li>Set Output Color Space to Rec.709 and Output Gamma to Rec.709 (or Gamma 2.4 if you monitor that way). Leave tone mapping on its default unless the highlights clip.</li>
<li>On the next node, apply your ChromaMimic .cube. Right click the node, choose 3D LUT, and pick it.</li>
</ol>
<p>If you are using Resolve Color Management (DaVinci YRGB Color Managed) the CST is done for you at the timeline level and you can skip the node, as long as the clip's input colour space is set correctly in the Media pool.</p>

<h2>Premiere Pro</h2>
<ol>
<li>Open Lumetri Color on the clip.</li>
<li>In <strong>Basic Correction</strong>, set Input LUT to the camera manufacturer's log to Rec.709 conversion. Sony publishes these for S-Log3, Panasonic for V-Log, Canon for C-Log. Browse to the file the first time; it is remembered afterwards.</li>
<li>In <strong>Creative</strong>, set Look to your ChromaMimic .cube.</li>
</ol>
<p>Lumetri applies Input LUT before everything else and the Creative Look after the basic corrections, which is exactly the order you want. Newer Premiere builds can also detect log footage automatically in the sequence settings; if that is on, the Input LUT step is already handled and you only add the Look.</p>

<h2>Final Cut Pro</h2>
<ol>
<li>Select the clip and open the Inspector, Info tab. Switch the metadata view to Settings if you cannot see it.</li>
<li>Set <strong>Camera LUT</strong> to the matching log profile. Final Cut ships Sony, Panasonic, Canon, ARRI and others built in. This is your conversion step.</li>
<li>From the Effects browser, drag the <strong>Custom LUT</strong> effect (under Color) onto the clip, then in the Video Inspector choose your ChromaMimic .cube from its LUT menu.</li>
</ol>
<p>The Camera LUT is applied first, at the clip level, and effects run after it. That is the correct order.</p>

<h2>Building the match correctly in the first place</h2>
<p>Do the conversion before you export the still you feed to ChromaMimic. Grab your original frame from a clip that already has the CST or Camera LUT applied, so the still is Rec.709. Match that to your Rec.709 reference. The .cube you get back is now a Rec.709 to Rec.709 creative LUT, which is exactly what belongs after the conversion node.</p>
<p>ChromaMimic has a colour space selector next to the frames. If you tell it the frames are log it warns you, and it writes a reminder into the exported .cube header so the file itself says "apply after a CST". It cannot convert log for you, because the maths depends on the camera, and pretending otherwise is how tools produce LUTs that look right on the sample and wrong on the job.</p>

<h2>A quick sanity check on the scopes</h2>
<p>After the CST node, before the LUT, a correctly converted log clip should show skin tones around 60 to 70 percent on the waveform and mid grey around 40 percent. If your waveform is bunched in the middle third with nothing near the top or bottom, the conversion has not happened. Fix that before you judge the LUT.</p>
`,
    faq: [
      {
        q: "Can I just build the LUT from the log frame and skip the conversion?",
        a: "You can, and it will look flat. Colour matching measures the distribution of the frame, and a log frame's distribution is compressed by design. Convert to Rec.709 first, then match, then apply the LUT after a colour space transform in your editor.",
      },
      {
        q: "Do I need the manufacturer's LUT or will Resolve's Color Space Transform do?",
        a: "Resolve's CST is better because it is a calculation, not a fixed table, and it handles highlights more gracefully. In Premiere and Final Cut the manufacturer LUT or the built in Camera LUT is the practical choice.",
      },
      {
        q: "Does this apply to iPhone Apple Log footage?",
        a: "Yes. Apple Log is a log curve like any other. Convert it to Rec.709 with Apple's LUT or Final Cut's Camera LUT setting first, then apply your creative LUT.",
      },
    ],
    related: ["create-lut-from-reference-image", "davinci-resolve-lut-folder-location", "premiere-pro-lut-not-loading"],
  },

  {
    slug: "create-lut-from-reference-image",
    title: "How to create a LUT from a reference image, in your browser, for free",
    metaTitle: "Create a LUT from a reference image (free, in browser, nothing uploaded)",
    description:
      "Step by step: turn an original frame and a reference still into a .cube 3D LUT you can load in DaVinci Resolve, Premiere Pro or Final Cut. Free, runs in your browser, no account needed to grade, nothing uploaded.",
    keywords: ["create lut from image", "lut generator from image", "image to lut", "lut from two images", "match colour grade from reference", "make a lut from a photo"],
    type: "HowTo",
    minutes: 7,
    body: `
<p class="lede">You have a still that looks the way you want your footage to look. This is how to turn that into a LUT you can drop on a whole timeline, without Photoshop, without a plugin, and without sending a single frame to a server.</p>

<h2>Why two frames, not one</h2>
<p>Most "LUT from image" tools take a single reference and hand you a LUT. That LUT knows what the destination looks like but has no idea what your footage looks like to begin with, so it applies the same push to every camera and every exposure and hopes.</p>
<p>ChromaMimic takes two frames: your original (the ungraded still from your footage) and the reference (the look you want). It measures the colour distribution of both and learns the transform between them. The .cube it writes is specific to your camera's starting point, which is the difference between a LUT that lands and a LUT you spend an hour fixing.</p>

<h2>Step 1: pick the right frames</h2>
<ul>
<li><strong>Original:</strong> export a still from your footage as a JPG or PNG. Choose a frame that represents the shot: a face if there are faces, the dominant colours of the scene, a normal exposure.</li>
<li><strong>Reference:</strong> a film frame, a graded still, a photo. Anything you can screenshot. Higher resolution helps but is not essential; the distribution is what matters.</li>
<li><strong>Match the content.</strong> A daytime exterior original and a night interior reference will produce a LUT that fights itself. Similar lighting, similar subject, similar exposure gives a clean match.</li>
<li><strong>Convert log first.</strong> If your footage is S-Log3, V-Log, C-Log or any other log profile, apply the colour space transform in your editor before you export the original still. <a href="/guides/lut-looks-flat-slog3">Here is why that matters.</a></li>
</ul>

<h2>Step 2: load them</h2>
<p>Open <a href="/#tool">ChromaMimic</a>. Drop the original on the left and the reference on the right. Nothing happens on a server at this point or any other: the whole engine runs in your browser tab. You can turn your wifi off and it keeps working.</p>

<h2>Step 3: build</h2>
<p>Press Build. ChromaMimic runs three colour science methods and blends them: Reinhard transfer (matches the mean and spread of each channel in LAB), per channel histogram matching (matches the full tonal distribution), and optimal transport (moves colour mass from one distribution to the other with the least total change). The result is a transform that pushes your original towards the reference.</p>
<p>Drag the before and after handle across the preview. If it is close, move on. If it is too strong, lower the strength slider. If it has artefacts in flat areas, raise smoothing. If the blacks look lifted, turn on black and white normalisation, which pins true black and true white so the grade does not go milky.</p>

<h2>Step 4: refine</h2>
<p>The grade controls (temperature, tint, exposure, contrast, saturation, vibrance, shadows, highlights, fade) let you adjust the match before you export. This is where you take a 90 percent match to 100. The adjustments are baked into the .cube, so what you see in the preview is what your editor will apply.</p>

<h2>Step 5: export</h2>
<p>Download the .cube. The default size is 33, which every current editor accepts. 17 is smaller and faster to build. 65 is highest precision but some older Premiere Pro builds reject it, so if a 65 LUT will not load, rebuild at 33.</p>
<p>You can also export a .png of the graded still, an .xmp preset for Lightroom and Camera Raw, and a 16 bit .dng of the graded frame. <a href="/guides/cube-to-xmp-dng">What each of those is for.</a></p>

<h2>Step 6: apply it</h2>
<ul>
<li><strong>DaVinci Resolve:</strong> put the .cube in the LUT folder (Project Settings, Color Management, Open LUT Folder), press Update Lists, then right click a node and choose it under 3D LUT. <a href="/guides/davinci-resolve-lut-folder-location">Folder locations and the "not showing up" fixes.</a></li>
<li><strong>Premiere Pro:</strong> Lumetri Color, Creative, Look, Browse to the file. <a href="/guides/premiere-pro-lut-not-loading">If it will not load.</a></li>
<li><strong>Final Cut Pro:</strong> drag the Custom LUT effect onto the clip and choose the file. <a href="/guides/custom-lut-final-cut-pro">The Camera LUT versus Custom LUT distinction.</a></li>
</ul>

<h2>What a matched LUT can and cannot do</h2>
<p>A LUT is a global colour transform. It changes every pixel by its colour value and nothing else. It cannot add the lens, the lighting, the grain, the diffusion or the composition that made the reference look the way it does. It will get the palette and the tonal shape, which is most of the feeling, and it will get them consistently across every clip you apply it to.</p>
<p>For a look that needs per shot work, a matched LUT is the starting grade, not the finished one. That is honest, and it is also how professional colourists use LUTs.</p>
`,
    faq: [
      {
        q: "Do I need an account?",
        a: "No account is needed to load frames, build, preview and refine. A free account gives you three .cube downloads a month. Pro is $5 a month or $39 a year for unlimited downloads, 65 point LUTs, wheel mode grading and a saved library.",
      },
      {
        q: "Are my frames uploaded anywhere?",
        a: "No. The colour engine is JavaScript and WebGL running in your browser. The frames never leave your machine. You can verify this in your browser's network inspector, and the tool keeps working with the connection off.",
      },
      {
        q: "What formats can I load?",
        a: "JPG and PNG stills. Export a frame from your editor, or screenshot the reference.",
      },
      {
        q: "Will it work with log footage?",
        a: "Only if you convert the original frame to Rec.709 first. Matching in log space produces a flat LUT. ChromaMimic warns you when you flag the frames as log and writes a reminder into the .cube header.",
      },
    ],
    howToSteps: [
      { name: "Pick and export your frames", text: "Export a representative still from your footage (Rec.709, after any log conversion) and grab a reference still with the look you want." },
      { name: "Load both frames", text: "Drop the original on the left and the reference on the right in ChromaMimic. Everything runs in your browser." },
      { name: "Build the LUT", text: "Press Build. ChromaMimic learns the colour transform between the frames and shows a before and after preview." },
      { name: "Refine", text: "Adjust strength, smoothing and the grade controls until the preview is right. Adjustments are baked into the export." },
      { name: "Export the .cube", text: "Download at 33 for universal compatibility, or 17 and 65 as needed. Load it in Resolve, Premiere or Final Cut after any colour space transform." },
    ],
    related: ["lut-looks-flat-slog3", "what-is-a-cube-lut", "best-free-lut-generator"],
  },

  {
    slug: "best-free-lut-generator",
    title: "Free LUT generators compared: ChromaMimic, fylm.ai, LUTBuilder.ai, Imagen, Luttie and SammaPix",
    metaTitle: "Best free LUT generator in 2026: 7 tools compared honestly",
    description:
      "An honest comparison of the LUT from image tools: what is actually free, whether you need an account, whether your frames are uploaded, which formats and LUT sizes you get, and which match a pair of frames versus a single reference.",
    keywords: ["best free lut generator", "fylm.ai alternative", "lutbuilder.ai alternative", "lut generator comparison", "free lut maker online", "ai lut generator free"],
    type: "Article",
    minutes: 8,
    body: `
<p class="lede">Every tool on this page says it is free. What "free" gets you varies from unlimited .cube downloads to a watermarked preview and a sign up wall. This is the comparison we wished existed when we built ChromaMimic, so it includes the things that make ChromaMimic look worse as well as better.</p>
<p class="note">${PRICE_NOTE}</p>

<h2>The short version</h2>
<ul>
<li><strong>You want a .cube for free without making an account:</strong> ChromaMimic (grade and preview with no account, three downloads a month with a free account), Imagen's tool, SammaPix (17 point only), AICreate (sliders, no image matching).</li>
<li><strong>You want to match your footage to a reference, not just extract a look from one image:</strong> ChromaMimic, LUTBuilder.ai (paid for .cube), fylm.ai Colour Match (paid), Picture Instruments Image 2 LUT (desktop, one off purchase).</li>
<li><strong>You need your frames to stay on your machine:</strong> ChromaMimic, SammaPix, AICreate and the desktop apps. fylm.ai and Mitte are cloud by design. Others do not say.</li>
<li><strong>You want a full grading suite with collaboration and storage:</strong> fylm.ai. It is a different kind of product and this page is not the place to pick it.</li>
</ul>

<h2>The table</h2>
<div class="table-wrap">
<table>
<thead><tr><th>Tool</th><th>Match type</th><th>Free tier gets you</th><th>Paid from</th><th>Account to grade?</th><th>Where it runs</th><th>Exports</th><th>LUT sizes</th></tr></thead>
<tbody>
<tr><td><strong>ChromaMimic</strong></td><td>Two frames: original plus reference</td><td>Grade and preview, no account. 3 .cube downloads a month with a free account</td><td>US$5 a month or $39 a year, unlimited</td><td>No</td><td>In your browser, nothing uploaded</td><td>.cube, .dng, .png, .xmp</td><td>17, 33, 65 (Pro)</td></tr>
<tr><td>LUTBuilder.ai</td><td>Two frames, plus text prompt</td><td>5 generations, watermarked PNG preview, no .cube</td><td>US$5.99 a month for 10 downloads; $14.99 for 50; $29.99 unlimited</td><td>Yes for the free tier as far as we can tell</td><td>Homepage says frames stay in the browser; the AI step is not documented</td><td>.cube (paid), PNG</td><td>Not stated</td></tr>
<tr><td>fylm.ai</td><td>Colour Match (two frames, paid) and Colour Extract (one image)</td><td>3 projects, 1 GB, images capped at 2048 px, no LUT import or export</td><td>US$7 a month billed annually (Lite), $15 (Pro), $30 (Team)</td><td>Yes</td><td>Cloud</td><td>.cube, .xmp, ICC, camera log outputs</td><td>Not stated</td></tr>
<tr><td>Imagen AI LUT Generator</td><td>One reference image</td><td>Free .cube, no sign up</td><td>None for this tool</td><td>No</td><td>Not stated (Imagen is a cloud photo company)</td><td>.cube</td><td>Not stated</td></tr>
<tr><td>Luttie</td><td>One reference image, plus curves, wheels and a text prompt grader</td><td>Grade in browser, watermarked exports, no .cube</td><td>US$12 week pass, $21.99 a month, $109 lifetime</td><td>Yes, even for free</td><td>Says client side</td><td>.cube (Pro), PNG, JPEG</td><td>Not stated</td></tr>
<tr><td>SammaPix Color Match</td><td>One reference image</td><td>Free .cube, 50 photos a session, no sign up</td><td>Pro tier, price not shown</td><td>No</td><td>In your browser, states no upload</td><td>.cube</td><td>17 only</td></tr>
<tr><td>Picture Instruments Image 2 LUT</td><td>Two frames</td><td>Trial</td><td>US$46 one off, desktop</td><td>No</td><td>Local desktop app</td><td>.3dl, .cube 17, .cube 32, .mga</td><td>17, 32</td></tr>
<tr><td>AICreate LUT Generator</td><td>None (eight sliders on a test image)</td><td>Everything, unlimited, no sign up</td><td>None</td><td>No</td><td>In your browser</td><td>.cube</td><td>17, 33</td></tr>
</tbody>
</table>
</div>

<h2>What each one is actually for</h2>
<h3>ChromaMimic</h3>
<p>A frame pair matcher that runs entirely in the browser. You drop an original and a reference, it learns the transform with three colour science methods (Reinhard, histogram matching, optimal transport), you refine with grade controls, and you export. The free tier is real: you can do the whole job without an account and only need one to download. It is honest about log footage and writes a reminder into the .cube. It is not a full grading suite and does not pretend to be. Built by Nunik Co. in Canberra.</p>
<h3>LUTBuilder.ai</h3>
<p>The closest product in mechanism: two frames in, LUT out, with a text prompt option and a chat assistant on higher tiers. The free tier is a demo. You cannot get a .cube without paying, and the cheapest plan caps you at ten downloads a month. If you make a lot of LUTs the Pro tier is competitive; if you make a few, ChromaMimic's free tier covers you.</p>
<h3>fylm.ai</h3>
<p>A cloud colour grading platform where LUT generation is one feature among many. Colour Extract pulls a look from a single image; Colour Match learns from a pair. The free plan lets you try the interface but not export a LUT. It stores your projects in the cloud, which is the point of the product and also the reason it is the wrong choice if your footage is under NDA.</p>
<h3>Imagen AI LUT Generator</h3>
<p>A free single image tool on a large photography company's site. No account, straight to a .cube. Because it is single reference it cannot know your starting point, so results vary by camera. Processing location is not stated.</p>
<h3>Luttie</h3>
<p>A browser colour grader with curves, wheels, grain and halation, plus a reference match feature and a text prompt grader. It has the best written guides in the category. It requires an account for everything, including the free tier, and .cube export is Pro only. Good if you want to grade in the browser; expensive if you only want a LUT.</p>
<h3>SammaPix Color Match</h3>
<p>Free, no account, client side, single reference, 17 point only. Built for photographers batch matching stills rather than for video. Fine for a quick look, limited for a timeline.</p>
<h3>Picture Instruments Image 2 LUT</h3>
<p>The original two frame matcher, as a desktop app. One off price, runs locally, exports several formats. If you want a permanent desktop tool and do not mind paying up front, it is a sound choice. It is not in a browser and it is not free.</p>
<h3>AICreate LUT Generator</h3>
<p>Not a matcher at all: eight Lightroom style sliders that you adjust on a preview, exported as a .cube. Genuinely free and unlimited. Useful when you know the look you want and do not have a reference frame.</p>

<h2>How to choose</h2>
<p>Ask three questions. Do you have both an original and a reference, or only a reference? Does your footage have to stay on your machine? How many LUTs will you actually make this month? If the answers are "both", "yes" and "a few", ChromaMimic is the free option that fits. If the answers are "only a reference", "no" and "one", Imagen's tool is a fine free choice. If you make dozens a month, compare ChromaMimic Pro at $39 a year against LUTBuilder.ai Pro at $29.99 a month.</p>
`,
    faq: [
      {
        q: "Is there a free LUT generator with no sign up at all?",
        a: "Yes. ChromaMimic lets you load frames, build, preview and refine with no account, and needs one only to download. Imagen's tool, SammaPix and AICreate export with no sign up. fylm.ai, LUTBuilder.ai and Luttie require an account and none of them export a .cube on their free tier.",
      },
      {
        q: "What is the difference between an AI LUT generator and a colour matcher?",
        a: "Marketing, mostly. ChromaMimic, Image 2 LUT and SammaPix use colour science (statistics of the two images) which is deterministic and instant. LUTBuilder.ai and Luttie add text prompt generation on top. Neither approach is better in every case; the pair match is more predictable and the prompt approach is more flexible when you have no reference.",
      },
      {
        q: "Which tool is best for wedding videographers?",
        a: "One that keeps client footage private, works fast, and does not charge per LUT. ChromaMimic was built for that brief. If you grade every wedding from scratch in a browser, Luttie's suite is worth a look.",
      },
    ],
    related: ["create-lut-from-reference-image", "nothing-uploaded", "what-is-a-cube-lut"],
  },

  {
    slug: "nothing-uploaded",
    title: "How ChromaMimic keeps your frames on your machine, and how to check for yourself",
    metaTitle: "Private LUT generator: nothing uploaded, and how to verify it",
    description:
      "ChromaMimic's colour engine runs entirely in your browser. No frame, thumbnail or histogram is sent to a server. Here is how that works technically, why it matters for client and unreleased footage, and a two minute test you can run to prove it.",
    keywords: ["private lut generator", "lut generator no upload", "colour grade without uploading", "offline lut maker", "client footage privacy"],
    type: "TechArticle",
    minutes: 4,
    body: `
<p class="lede">"Nothing uploaded" is an easy thing to write on a landing page. This is what it means in ChromaMimic's case, in enough detail that you can check it rather than take our word.</p>

<h2>Why it matters</h2>
<p>If you shoot weddings, the frames are someone's private day. If you shoot commercial work, the frames are under NDA until launch. If you grade a feature, a still from the timeline on a third party server is a leak waiting to happen. Most LUT tools ask you to upload your footage because their processing runs on their servers, and their terms of service say what they can do with what you upload. Read them.</p>

<h2>How ChromaMimic works instead</h2>
<p>The site is a static bundle of HTML, CSS and JavaScript served from a CDN. When you drop a frame, the browser reads the file into memory from your disk. The colour analysis (Reinhard transfer, histogram matching, optimal transport) runs in a Web Worker, which is a background thread inside your browser tab. The preview is drawn by WebGL on your graphics card. The .cube is assembled as text in memory and handed to your browser's download function.</p>
<p>At no point in that chain is there a network request carrying image data. There is no upload endpoint to send it to. The only server side code in the product is the account and billing layer (sign in, subscription status, a download counter), and that layer never receives a frame.</p>

<h2>The two minute test</h2>
<ol>
<li>Open <a href="/#tool">ChromaMimic</a> and let it load.</li>
<li>Open your browser's developer tools (F12, or Cmd Option I on a Mac) and switch to the Network tab. Tick "preserve log".</li>
<li>Drop an original and a reference frame, press Build, and download the .cube.</li>
<li>Look at the Network tab. You will see the fonts, the script chunks, and, if you are signed in, a small JSON call to the entitlements endpoint that carries your account state and nothing else. You will not see a request whose payload is an image.</li>
</ol>
<p>Then the stronger version: load the page, turn your wifi off or set the Network tab to Offline, and repeat step 3. The build still runs and the download still works. A tool that uploads cannot do that.</p>

<h2>What we do store</h2>
<ul>
<li>If you sign in: your account (through Clerk), your subscription state (through Stripe) and a count of downloads this month.</li>
<li>If you are on Pro and use the saved LUT library: the .cube files you choose to save, which are small text files, not your frames.</li>
<li>Nothing else. No frames, no thumbnails, no histograms, no analytics that fingerprint your images.</li>
</ul>
<p>The full detail is in the <a href="/privacy">privacy policy</a>, which is short enough to read.</p>

<h2>The trade off</h2>
<p>Running in your browser means the tool is bounded by your machine. A 65 point LUT with optimal transport on a very large frame takes a few seconds on a laptop and longer on an old phone. Server side tools can throw more hardware at it. We think a few seconds is a fair price for never handing a frame to anyone, and the progress bar is there so the tab never appears frozen.</p>
`,
    faq: [
      {
        q: "Does ChromaMimic use my images to train anything?",
        a: "No. It never receives them. The colour matching is classical colour science, not a model that learns from users.",
      },
      {
        q: "Can I use it on a machine with no internet at all?",
        a: "Once the page has loaded, yes. It needs a connection to load the first time and to check a signed in account's download allowance.",
      },
      {
        q: "Where is the account data hosted?",
        a: "Authentication is handled by Clerk and billing by Stripe. ChromaMimic's own server functions run on Vercel and hold only your entitlement state.",
      },
    ],
    related: ["best-free-lut-generator", "create-lut-from-reference-image"],
  },

  {
    slug: "davinci-resolve-lut-folder-location",
    title: "DaVinci Resolve LUT folder location on Mac, Windows and Linux, and why your LUT is not showing up",
    metaTitle: "DaVinci Resolve LUT folder location (Mac, Windows, App Store) and fixes",
    description:
      "Exact paths to the DaVinci Resolve LUT folder on macOS, Windows, Linux and the Mac App Store build, how to open it from inside Resolve, the Update Lists step everyone forgets, and the fixes when a .cube still will not appear.",
    keywords: ["davinci resolve lut folder location", "lut not showing up davinci resolve", "where to put luts davinci resolve", "davinci resolve lut folder mac", "davinci resolve lut folder windows"],
    type: "TechArticle",
    minutes: 5,
    body: `
<p class="lede">Resolve only lists LUTs it finds in its own LUT folder. Put the file there, tell Resolve to look again, and it appears. This is where that folder is and what to do when it still does not show.</p>

<h2>Open it from inside Resolve (the reliable way)</h2>
<ol>
<li>Open the project and go to <strong>Project Settings</strong> (the cog, bottom right, or Shift 9).</li>
<li>Choose <strong>Color Management</strong> in the left list.</li>
<li>Scroll to <strong>Lookup Tables</strong> and click <strong>Open LUT Folder</strong>. Resolve opens the exact folder it reads from, on whichever build and OS you have.</li>
<li>Copy your .cube in. Subfolders are fine and appear as groups in the LUT browser.</li>
<li>Back in Project Settings, click <strong>Update Lists</strong>, then Save.</li>
</ol>
<p>That Update Lists click is the step most guides skip and the reason most "it is not showing up" questions exist. Resolve does not watch the folder; it scans it when asked, and at launch.</p>

<h2>The paths, if you want to go direct</h2>
<div class="table-wrap">
<table>
<thead><tr><th>Build</th><th>Path</th></tr></thead>
<tbody>
<tr><td>macOS, download from Blackmagic</td><td><code>/Library/Application Support/Blackmagic Design/DaVinci Resolve/LUT</code></td></tr>
<tr><td>macOS, Mac App Store build</td><td><code>~/Library/Containers/com.blackmagic-design.DaVinciResolveAppStore/Data/Library/Application Support/Blackmagic Design/DaVinci Resolve/LUT</code></td></tr>
<tr><td>Windows</td><td><code>C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Support\\LUT</code></td></tr>
<tr><td>Linux</td><td><code>/opt/resolve/LUT</code> (some installs use <code>/home/resolve/LUT</code>)</td></tr>
</tbody>
</table>
</div>
<p>The App Store build is the one that catches people: it is sandboxed, so the folder lives inside a Containers directory under your user Library, not the system Library. If you installed from the App Store and copied a LUT into the system path, Resolve never sees it. Use Open LUT Folder and let Resolve show you.</p>
<p>On macOS, <code>/Library</code> is the system library at the root of the disk, not the one inside your home folder, and it is hidden by default. In Finder, use Go to Folder (Shift Cmd G) and paste the path.</p>

<h2>Applying the LUT</h2>
<ul>
<li>On the Color page, open the <strong>LUTs</strong> panel (top left), find the file, and drag it onto a node. Or right click the node, choose <strong>3D LUT</strong>, and pick it from the list.</li>
<li>Or on any page, right click a clip thumbnail, choose <strong>LUT</strong>, and pick it. That applies it at the clip level before your node grade.</li>
<li>A LUT built in Rec.709 belongs <em>after</em> your colour space transform node if the footage is log. <a href="/guides/lut-looks-flat-slog3">Why.</a></li>
</ul>

<h2>When it still will not show</h2>
<ul>
<li><strong>Wrong folder.</strong> App Store versus download build, above. Open LUT Folder settles it.</li>
<li><strong>Did not Update Lists.</strong> Do it, or restart Resolve.</li>
<li><strong>Wrong extension.</strong> The file must end in <code>.cube</code>, not <code>.cube.txt</code>. Windows hides known extensions by default; turn that off in File Explorer's View options and check.</li>
<li><strong>Not really a cube file.</strong> Open it in a text editor. The first lines should read <code>TITLE</code> and <code>LUT_3D_SIZE 33</code> (or 17 or 65), followed by thousands of lines of three numbers. If it is a PNG or a zip renamed, Resolve ignores it.</li>
<li><strong>Permissions.</strong> On macOS the system Library folder can need an admin password to write to. If Finder refused the copy, the file is not there.</li>
<li><strong>It shows but does nothing.</strong> Check the node is enabled, the LUT is on the node you think it is on, and the input is Rec.709. A creative LUT on raw log footage looks like almost nothing, which reads as "not working".</li>
</ul>

<h2>Making a LUT to put there</h2>
<p><a href="/#tool">ChromaMimic</a> builds a .cube from an original frame and a reference still in your browser, with nothing uploaded, at 17, 33 or 65 points. It writes a standard Adobe Cube v1.0 file with the TITLE and LUT_3D_SIZE header Resolve expects, so it appears in the list the moment you Update Lists.</p>
`,
    faq: [
      {
        q: "Can I keep LUTs somewhere other than the Resolve folder?",
        a: "Yes. In the LUTs panel on the Color page, right click and choose Add LUT Folder to register any folder. The default folder is simpler and survives project moves.",
      },
      {
        q: "Does Resolve need a restart after adding a LUT?",
        a: "No. Update Lists in Project Settings, Color Management is enough. A restart also works.",
      },
      {
        q: "Which LUT size should I use in Resolve?",
        a: "Resolve reads 17, 33 and 65 point cube files without complaint. 33 is the standard. Use 65 for a high precision grade on well exposed footage.",
      },
    ],
    related: ["lut-looks-flat-slog3", "premiere-pro-lut-not-loading", "custom-lut-final-cut-pro"],
  },

  {
    slug: "premiere-pro-lut-not-loading",
    title: "Custom .cube LUT not loading in Premiere Pro: the 65 point problem and every other fix",
    metaTitle: "LUT not loading in Premiere Pro? 65 vs 33 point and other fixes",
    description:
      "Premiere Pro refuses some .cube files silently. The usual cause is a 65 point LUT on an older build. Here are the fixes, the right Lumetri slot for a creative LUT versus a log conversion, and where to put files so they appear in the dropdown permanently.",
    keywords: ["lut not loading premiere pro", "65 point lut premiere pro", "apply custom lut premiere pro", "premiere pro lut folder", "lumetri lut not working"],
    type: "TechArticle",
    minutes: 5,
    body: `
<p class="lede">You browse to your .cube in Lumetri, nothing happens, or the picture does not change, or the dropdown forgets it next time. Premiere is fussier about LUT files than Resolve is, and it does not tell you why. These are the causes in the order they usually turn out to be.</p>

<h2>1. It is a 65 point LUT on a build that rejects them</h2>
<p>Some older Premiere Pro versions refuse cube files larger than 33 points. Nothing loads and no error appears. If your LUT was exported at 65, rebuild it at 33. ChromaMimic defaults to 33 for exactly this reason, and 33 is indistinguishable from 65 on all but the most extreme grades.</p>
<p>To check the size, open the .cube in a text editor and look for the line <code>LUT_3D_SIZE 65</code>.</p>

<h2>2. It is in the wrong Lumetri slot</h2>
<p>Lumetri has two LUT slots and they do different jobs.</p>
<ul>
<li><strong>Basic Correction, Input LUT.</strong> Applied first, before every other adjustment. This is for technical conversions: the camera manufacturer's S-Log3 to Rec.709, V-Log to Rec.709 and so on.</li>
<li><strong>Creative, Look.</strong> Applied after the basic corrections. This is for creative LUTs, including anything from ChromaMimic.</li>
</ul>
<p>Put a creative LUT in the Input slot on log footage and it applies before the conversion, so it looks wrong. Put the conversion LUT in the Creative slot and your basic corrections happen in log space, which is also wrong. Conversion in Input, creative in Look. <a href="/guides/lut-looks-flat-slog3">The longer version.</a></p>

<h2>3. The file is not really a .cube</h2>
<ul>
<li>The name must end in <code>.cube</code>. Windows hides extensions by default, so <code>mylook.cube.txt</code> shows as <code>mylook.cube</code>. Turn on file name extensions in Explorer's View menu.</li>
<li>Open it in a text editor. It must start with a header including <code>LUT_3D_SIZE</code> and then contain only lines of three numbers. Anything else (HTML from a failed download, a zip, an image) will not load.</li>
<li>Non ASCII characters in the file name or path can trip some builds. Keep it plain.</li>
</ul>

<h2>4. It loaded once and vanished</h2>
<p>Browse in Lumetri points at the file where it sits. Move or rename the file, or open the project on another machine, and the reference breaks. To make a LUT permanent, put it in Premiere's own LUT folder and restart:</p>
<div class="table-wrap">
<table>
<thead><tr><th>OS</th><th>Creative LUTs (Look dropdown)</th><th>Technical LUTs (Input LUT dropdown)</th></tr></thead>
<tbody>
<tr><td>macOS</td><td><code>/Library/Application Support/Adobe/Common/LUTs/Creative</code></td><td><code>/Library/Application Support/Adobe/Common/LUTs/Technical</code></td></tr>
<tr><td>Windows</td><td><code>C:\\Program Files\\Adobe\\Common\\LUTs\\Creative</code></td><td><code>C:\\Program Files\\Adobe\\Common\\LUTs\\Technical</code></td></tr>
</tbody>
</table>
</div>
<p>Create the folders if they do not exist. Both locations need admin rights to write to. Restart Premiere and the LUTs appear in the dropdown by name, on every project.</p>

<h2>5. It is applied but you cannot see it</h2>
<ul>
<li>The Lumetri effect is bypassed (the fx toggle in Effect Controls).</li>
<li>Intensity in the Creative section is at zero.</li>
<li>Program monitor is showing a different clip, or you applied it to the wrong one of two stacked clips.</li>
<li>The footage is log and there is no Input LUT, so the creative LUT lands on a flat image and barely registers. Add the conversion.</li>
</ul>

<h2>6. It loads but looks different from the preview</h2>
<p>Premiere's default colour management and a display profile mismatch can shift the picture. Check Sequence Settings for the working colour space (Rec.709 for most delivery) and make sure the Lumetri scopes agree with what you saw when you built the LUT. If ChromaMimic's preview and Premiere disagree, Premiere is applying something else in the chain, usually an automatic log detection or a clip level colour space override. Look in Modify, Interpret Footage, Color Management for the clip.</p>

<h2>Building a Premiere friendly LUT</h2>
<p><a href="/#tool">ChromaMimic</a> exports a standard Adobe Cube v1.0 file at 33 points by default, with a TITLE line and no exotic headers, which is the safest possible file for Lumetri. If you export at 65 for a Resolve grade and also need it in Premiere, export both sizes; the free tier's downloads reset monthly and Pro is unlimited.</p>
`,
    faq: [
      {
        q: "Does Premiere Pro support 65 point LUTs at all?",
        a: "Current builds do. Older builds silently reject them. If a 65 point file does nothing, rebuild at 33 and it will load.",
      },
      {
        q: "Should the ChromaMimic LUT go in Input LUT or Creative Look?",
        a: "Creative Look. Input LUT is for the camera's log to Rec.709 conversion, which runs first.",
      },
      {
        q: "Can I apply one LUT to a whole sequence?",
        a: "Yes. Put an adjustment layer over the sequence and apply Lumetri with the LUT to that layer. Clip level conversions (Input LUT) still go on each clip.",
      },
    ],
    related: ["lut-looks-flat-slog3", "davinci-resolve-lut-folder-location", "what-is-a-cube-lut"],
  },

  {
    slug: "custom-lut-final-cut-pro",
    title: "How to use a custom .cube LUT in Final Cut Pro: Camera LUT versus Custom LUT",
    metaTitle: "Custom LUT in Final Cut Pro: import a .cube the right way",
    description:
      "Final Cut Pro has two LUT mechanisms and they are not interchangeable. The Camera LUT converts log footage; the Custom LUT effect applies a creative look. How to load a .cube into each, in what order, and what to do when it does not appear.",
    keywords: ["custom lut final cut pro", "import lut final cut pro", "final cut pro cube lut", "camera lut final cut", "final cut pro lut not showing"],
    type: "TechArticle",
    minutes: 4,
    body: `
<p class="lede">Final Cut supports .cube files directly, no conversion needed, but it has two separate places to load one and people routinely put the creative LUT in the technical slot. Here is the distinction and the exact clicks.</p>

<h2>The two mechanisms</h2>
<ul>
<li><strong>Camera LUT</strong> lives in the clip's metadata (Inspector, Info tab). It is a technical conversion: log to Rec.709. Final Cut ships built in profiles for Sony S-Log2 and S-Log3, Panasonic V-Log, Canon Log, ARRI LogC, Blackmagic Film, Apple Log and more. It is applied first, at the clip level, before any effect.</li>
<li><strong>Custom LUT</strong> is an effect in the Effects browser under Color. It applies a creative look and runs in the effects stack after the Camera LUT. This is where a ChromaMimic .cube belongs.</li>
</ul>

<h2>Step 1: set the Camera LUT if the footage is log</h2>
<ol>
<li>Select the clip in the browser or timeline and open the Inspector (Cmd 4).</li>
<li>Click the <strong>Info</strong> tab. If you cannot see Camera LUT, change the metadata view at the bottom of the Inspector to <strong>Settings</strong>.</li>
<li>Choose the profile that matches the camera from the <strong>Camera LUT</strong> menu. For a manufacturer LUT that is not built in, choose <strong>Add Custom Camera LUT</strong> and pick the file.</li>
</ol>
<p>Select all the clips from that camera and set it once. The picture should immediately look like normal video rather than flat log. If your footage is already Rec.709, leave Camera LUT on None.</p>

<h2>Step 2: apply the creative LUT</h2>
<ol>
<li>Open the Effects browser (Cmd 5) and find <strong>Custom LUT</strong> in the Color category.</li>
<li>Drag it onto the clip, or select the clips and double click the effect.</li>
<li>In the Video Inspector, find the Custom LUT section and open the <strong>LUT</strong> menu. Choose <strong>Choose Custom LUT</strong> and pick your .cube. Final Cut copies it into the library, so it stays available for every clip in that library.</li>
<li>Use the <strong>Mix</strong> slider to blend the strength if the look is too strong.</li>
</ol>
<p>Final Cut accepts .cube and .mga files. Once a LUT has been chosen it appears in the LUT menu by name for the rest of that library, so you only browse for it once.</p>

<h2>Order and colour space</h2>
<p>Camera LUT first, effects after, is the fixed order and it is the right one. Set the library and project colour space to Rec.709 (Library Properties, Modify, Color Processing: Standard) for a Rec.709 LUT. If the project is set to Wide Gamut HDR, a Rec.709 creative LUT will look wrong, because the values it expects are not the values it receives. <a href="/guides/lut-looks-flat-slog3">Why colour space matters to a LUT.</a></p>

<h2>When the LUT does not show or does nothing</h2>
<ul>
<li><strong>Chosen in the wrong place.</strong> A creative LUT set as the Camera LUT applies before conversion and on log footage looks nearly invisible. Move it to the Custom LUT effect.</li>
<li><strong>Wrong extension or a bad file.</strong> Must be <code>.cube</code> or <code>.mga</code>, with a valid LUT_3D_SIZE header. Open it in a text editor to check.</li>
<li><strong>Effect disabled.</strong> The checkbox next to Custom LUT in the Video Inspector.</li>
<li><strong>Mix at zero.</strong> Slide it up.</li>
<li><strong>Different library.</strong> Custom LUTs are stored per library. Choose it again in a new library.</li>
</ul>

<h2>Building one for Final Cut</h2>
<p><a href="/#tool">ChromaMimic</a> exports a standard .cube that Final Cut's Custom LUT effect reads directly. Export the original still after the Camera LUT is set, so the match is built in Rec.709, and the result will look in Final Cut exactly as it did in the preview.</p>
`,
    faq: [
      {
        q: "Does Final Cut Pro accept 65 point LUTs?",
        a: "Yes. 17, 33 and 65 point cube files all load in the Custom LUT effect.",
      },
      {
        q: "Can I apply a LUT to the whole timeline in Final Cut?",
        a: "Use an adjustment layer (a title or a generator laid over the timeline with the Custom LUT effect on it), or select all clips and apply the effect to each. Camera LUTs stay per clip.",
      },
      {
        q: "Where does Final Cut store the custom LUT after I choose it?",
        a: "Inside the library bundle. Moving the library keeps the LUT; opening the .cube in a different library requires choosing it again.",
      },
    ],
    related: ["lut-looks-flat-slog3", "davinci-resolve-lut-folder-location", "create-lut-from-reference-image"],
  },

  {
    slug: "cube-to-xmp-dng",
    title: "Export a LUT as a Lightroom preset: what the .xmp and .dng from ChromaMimic are for",
    metaTitle: "LUT to Lightroom preset: .cube to .xmp and .dng explained",
    description:
      "Lightroom cannot load a .cube directly. ChromaMimic exports an .xmp preset that carries the grade for Lightroom and Camera Raw, a 16 bit .dng of the graded still, and the .cube for video. What each file contains, where to import it, and how to get a real LUT into Lightroom via a profile.",
    keywords: ["cube to xmp", "lut to lightroom preset", "lut to dng", "xmp preset from lut", "use video lut in lightroom", "camera raw lut profile"],
    type: "TechArticle",
    minutes: 5,
    body: `
<p class="lede">You matched a look for your footage and now you want the stills from the same shoot to agree with it. Lightroom does not open .cube files, so ChromaMimic gives you two other files alongside the LUT. Here is what each one is, and the one Adobe workflow that does put a real .cube inside Lightroom.</p>

<h2>The four exports</h2>
<div class="table-wrap">
<table>
<thead><tr><th>File</th><th>What it contains</th><th>Where it goes</th></tr></thead>
<tbody>
<tr><td><strong>.cube</strong></td><td>The full 3D LUT: the reference match plus every grade control adjustment, baked in</td><td>DaVinci Resolve, Premiere Pro, Final Cut Pro, Photoshop (Color Lookup layer), CapCut, OBS</td></tr>
<tr><td><strong>.xmp</strong></td><td>A Lightroom and Camera Raw develop preset carrying the grade control values (temperature, tint, exposure, contrast, saturation, vibrance, shadows, highlights, fade). Not the reference match itself, which has no slider equivalent</td><td>Lightroom Classic, Lightroom, Camera Raw, Photoshop's Camera Raw filter</td></tr>
<tr><td><strong>.dng</strong></td><td>A 16 bit linear DNG of your graded original still, with the full match and grade applied</td><td>Lightroom, Camera Raw, Capture One, any raw editor, as a reference or a deliverable</td></tr>
<tr><td><strong>.png</strong></td><td>The graded still as an 8 bit image</td><td>Anywhere, for sharing and comparison</td></tr>
</tbody>
</table>
</div>

<h2>Why the .xmp is "grade only"</h2>
<p>A Lightroom preset is a list of slider positions. The reference match in ChromaMimic is a 3D transform (every colour moves independently) and there is no set of sliders that reproduces it exactly. So the .xmp carries the part that maps cleanly, the grade controls, and leaves the match to the .cube. Apply the .xmp to your stills and they will share the exposure, contrast and colour balance of the footage grade; they will not carry the full palette shift unless you also bring in the LUT as a profile, below.</p>

<h2>Importing the .xmp</h2>
<ul>
<li><strong>Lightroom Classic:</strong> Develop module, Presets panel, click the plus, <strong>Import Presets</strong>, choose the .xmp.</li>
<li><strong>Lightroom (cloud):</strong> Edit panel, Presets, the three dot menu, <strong>Import Presets</strong>.</li>
<li><strong>Camera Raw:</strong> Presets tab, the three dot menu, <strong>Import Profiles and Presets</strong>.</li>
</ul>

<h2>Getting the actual .cube into Lightroom: a profile</h2>
<p>Adobe supports LUTs inside Camera Raw profiles, and profiles work in Lightroom. This is the one route that carries the full match:</p>
<ol>
<li>Open any raw image in Camera Raw (Photoshop, File, Open, choose a raw file, or Filter, Camera Raw Filter on a smart object).</li>
<li>Go to the Presets panel. Hold <strong>Alt</strong> (Windows) or <strong>Option</strong> (Mac) and click the new preset button. The dialog that opens is <strong>New Profile</strong> instead of New Preset.</li>
<li>Under <strong>Color Lookup Table</strong>, tick the box and choose your ChromaMimic .cube. Set the space to sRGB or Adobe RGB to match how the LUT was built (ChromaMimic builds in sRGB / Rec.709).</li>
<li>Name it and save. It appears under Profiles in Camera Raw and, after a restart, in Lightroom's Profile browser.</li>
</ol>
<p>Apply the profile and the .xmp preset together and your stills carry the whole footage grade.</p>

<h2>What the .dng is for</h2>
<p>The .dng is not a preset. It is your original frame, graded, as a 16 bit linear file. Three uses:</p>
<ul>
<li><strong>A reference in your raw editor.</strong> Open it next to the stills and match by eye or by sampling, with far more precision than an 8 bit PNG.</li>
<li><strong>A deliverable.</strong> A frame grab from the film that prints and edits like a photograph.</li>
<li><strong>A check.</strong> Compare the .dng with the footage after the LUT is applied in your editor. If they differ, the editor is doing something else in the chain, usually colour management.</li>
</ul>

<h2>Build the set</h2>
<p><a href="/#tool">ChromaMimic</a> exports all four from one match. The .cube and .png are on the free tier; the .dng and .xmp export alongside them in every format on Pro, and the free account's three monthly downloads can be spent on any of them.</p>
`,
    faq: [
      {
        q: "Can Lightroom open a .cube file directly?",
        a: "No. Lightroom and Camera Raw accept LUTs only inside a profile. Create the profile in Camera Raw with Alt or Option click on the new preset button, tick Color Lookup Table, and choose the .cube.",
      },
      {
        q: "Why not just convert the .cube to an .xmp?",
        a: "Because an .xmp preset is sliders and a .cube is a full 3D transform. A converter has to approximate, and the approximation is often worse than no conversion. The profile route carries the real LUT.",
      },
      {
        q: "Will the .dng open in Capture One?",
        a: "Yes. It is a standard 16 bit linear DNG. Capture One does not read Adobe profiles or .xmp presets, so the .dng is the way to carry a ChromaMimic look into that workflow.",
      },
    ],
    related: ["create-lut-from-reference-image", "what-is-a-cube-lut", "best-free-lut-generator"],
  },

  {
    slug: "what-is-a-cube-lut",
    title: "What is a .cube LUT file? 17, 33 and 65 point LUTs explained, with a look inside the file",
    metaTitle: "What is a .cube LUT file? Sizes, format and compatibility",
    description:
      "A .cube file is a 3D lookup table: a grid that maps every input colour to an output colour. What the file actually contains, what 17, 33 and 65 mean, which editors read it, and how to tell a good one from a broken one.",
    keywords: ["what is a cube lut", "what is a .cube file", "3d lut explained", "17 vs 33 vs 65 lut", "lut file format", "cube lut size"],
    type: "TechArticle",
    minutes: 5,
    body: `
<p class="lede">A LUT is the most used and least understood file in video colour. This is the whole thing in five minutes, including what is inside the file when you open it in a text editor.</p>

<h2>What a lookup table does</h2>
<p>Every pixel in your footage is a red, green and blue value. A 3D LUT is a table that says, for a grid of input RGB values, what output RGB value to produce. Your editor looks up each pixel's colour in the table and replaces it. That is it. No adjustment layers, no sliders, no maths at playback beyond finding the nearest grid points and blending between them.</p>
<p>Because the table maps colours independently, a LUT can do things sliders cannot: shift one hue without touching its neighbours, bend the shadows blue while leaving highlights warm, reproduce a film stock's non linear response. That is why film emulations and reference matches ship as LUTs.</p>

<h2>1D versus 3D</h2>
<p>A 1D LUT has three separate curves, one per channel. Each channel is adjusted on its own, so it can change contrast and colour balance but cannot change one colour based on another. A 3D LUT has a single cube where every combination of R, G and B maps to its own output. Creative looks are almost always 3D. The .cube format can hold either; the header tells you which.</p>

<h2>What 17, 33 and 65 mean</h2>
<p>The number is the grid size along each axis. A 33 point LUT samples 33 red values, 33 green and 33 blue, giving 33 cubed, or 35,937, entries. Colours between grid points are interpolated.</p>
<div class="table-wrap">
<table>
<thead><tr><th>Size</th><th>Entries</th><th>Typical file size</th><th>Use it when</th></tr></thead>
<tbody>
<tr><td>17</td><td>4,913</td><td>about 150 KB</td><td>Real time preview, monitors, very subtle looks. Can band on strong grades</td></tr>
<tr><td>33</td><td>35,937</td><td>about 1 MB</td><td>The standard. Every current editor accepts it, and it is precise enough for nearly all creative work</td></tr>
<tr><td>65</td><td>274,625</td><td>about 8 MB</td><td>Extreme grades, technical conversions, high bit depth pipelines. Some older Premiere builds reject it</td></tr>
</tbody>
</table>
</div>
<p>Bigger is not automatically better. A 65 point LUT built from a noisy match carries the noise into the grade at higher resolution. ChromaMimic offers all three and defaults to 33.</p>

<h2>Inside the file</h2>
<p>A .cube is plain text. Open one and you will see something like this:</p>
<pre><code>TITLE "ChromaMimic match"
LUT_3D_SIZE 33
DOMAIN_MIN 0.0 0.0 0.0
DOMAIN_MAX 1.0 1.0 1.0
0.000000 0.000000 0.000000
0.031250 0.000000 0.000000
0.062500 0.000000 0.000000
...</code></pre>
<p>After the header comes one line per grid entry: the output R, G and B for that input point, as decimals from 0 to 1. The lines are ordered with red changing fastest, then green, then blue. So the first 33 lines walk red from black to full red with green and blue at zero, the next 33 do the same with green one step up, and so on for all 35,937.</p>
<p>The <code>DOMAIN</code> lines are optional and almost always 0 to 1. Comments start with <code>#</code>. That is the entire format, which is why nearly every tool reads it.</p>

<h2>Which software reads .cube</h2>
<p>DaVinci Resolve, Premiere Pro, After Effects, Final Cut Pro, Avid Media Composer, Photoshop (as a Color Lookup adjustment layer), CapCut, OBS, most camera monitors and most colour plugins. Lightroom and Camera Raw read it only inside a profile. <a href="/guides/cube-to-xmp-dng">How to do that.</a></p>

<h2>What a LUT does not know</h2>
<p>A LUT maps colours. It does not know what colour space the input is in. A LUT built for Rec.709 applied to S-Log3 produces a flat, milky image, because the input values mean something different. Convert first, then apply. <a href="/guides/lut-looks-flat-slog3">This is the most common LUT problem there is.</a></p>

<h2>Spotting a broken one</h2>
<ul>
<li>No <code>LUT_3D_SIZE</code> line: not a 3D cube file.</li>
<li>The wrong number of lines after the header (size cubed): truncated download.</li>
<li>Values outside 0 to 1, or the word <code>NaN</code>: a generator that did not guard its maths. ChromaMimic clamps values and replaces any invalid entry with identity, so its files never contain either.</li>
<li>Ends in <code>.cube.txt</code>: rename it.</li>
</ul>

<h2>Make one</h2>
<p><a href="/#tool">ChromaMimic</a> writes a standard Adobe Cube v1.0 file from an original frame and a reference still, in your browser, at 17, 33 or 65 points. Open the result in a text editor and you will see exactly the structure above.</p>
`,
    faq: [
      {
        q: "Is a .cube LUT the same as a preset?",
        a: "No. A preset is a list of slider settings for one application. A LUT is a colour transform any application can apply. Presets are editable after the fact; a LUT is baked.",
      },
      {
        q: "Can a LUT reduce quality?",
        a: "A small LUT on a strong grade can band in gradients, and any LUT applied in the wrong colour space looks wrong. Applied correctly at 33 points or above on 10 bit footage, a LUT is visually lossless.",
      },
      {
        q: "What is the difference between .cube and .3dl?",
        a: "Both hold a 3D LUT. .cube is Adobe's text format and the most widely read. .3dl is the Autodesk format, with integer values and a different header. Resolve reads both; Premiere and Final Cut prefer .cube.",
      },
    ],
    related: ["create-lut-from-reference-image", "lut-looks-flat-slog3", "cube-to-xmp-dng"],
  },
];

// ---------------------------------------------------------------------------
// Template

const CSS = `
:root { color-scheme: dark; --bg:#0a0a0b; --surface:#111113; --hair:#232326; --text:#e9e8e3; --head:#f4f3ef; --muted:#b5b3ab; --faint:#7d7b74; --accent:#e8c9a0; --ok:#7fc99a; }
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.7 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--accent)}
a:hover{color:var(--head)}
.wrap{max-width:820px;margin:0 auto;padding:0 24px 96px}
header.site{position:sticky;top:0;z-index:5;background:rgba(10,10,11,.8);backdrop-filter:blur(14px);border-bottom:1px solid var(--hair)}
header.site .row{max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.brand{display:flex;align-items:center;gap:10px;color:var(--head);text-decoration:none;font-weight:600;letter-spacing:-.01em}
.brand svg{width:26px;height:26px}
nav.top{display:flex;gap:22px;font-size:13.5px}
nav.top a{color:var(--muted);text-decoration:none}
nav.top a:hover,nav.top a[aria-current]{color:var(--head)}
.btn{display:inline-block;padding:9px 16px;border-radius:8px;font-size:13.5px;font-weight:600;text-decoration:none;background:var(--accent);color:#141210;border:1px solid transparent}
.btn:hover{background:#f0d7b6;color:#141210}
.btn.ghost{background:transparent;color:var(--head);border-color:var(--hair)}
.btn.ghost:hover{border-color:var(--muted)}
.crumbs{font-size:12.5px;color:var(--faint);margin:32px 0 18px}
.crumbs a{color:var(--faint);text-decoration:none}
.crumbs a:hover{color:var(--muted)}
h1{font-size:clamp(30px,4.4vw,42px);line-height:1.12;letter-spacing:-.02em;margin:0 0 14px;color:var(--head);font-family:"Inter Tight","Inter",sans-serif}
.meta{font-size:12.5px;color:var(--faint);font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:34px}
h2{font-size:22px;line-height:1.3;margin:42px 0 12px;color:var(--head);letter-spacing:-.01em}
h3{font-size:17px;margin:26px 0 8px;color:var(--head)}
p,li{color:var(--text)}
p.lede{font-size:18.5px;line-height:1.6;color:var(--muted)}
p.note{font-size:13.5px;color:var(--faint);border-left:2px solid var(--hair);padding-left:14px}
ul,ol{padding-left:22px}
li{margin:6px 0}
li::marker{color:var(--faint)}
code{font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;background:var(--surface);border:1px solid var(--hair);border-radius:5px;padding:1px 6px;color:var(--head);word-break:break-all}
pre{background:var(--surface);border:1px solid var(--hair);border-radius:10px;padding:16px 18px;overflow:auto}
pre code{border:0;background:none;padding:0;font-size:12.5px;line-height:1.6}
.table-wrap{overflow-x:auto;margin:18px 0;border:1px solid var(--hair);border-radius:10px}
table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:560px}
th,td{text-align:left;vertical-align:top;padding:10px 12px;border-bottom:1px solid var(--hair)}
th{color:var(--faint);font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:.06em;background:var(--surface)}
tr:last-child td{border-bottom:0}
td strong{color:var(--head)}
.cta{margin:48px 0 0;padding:26px 26px;border:1px solid var(--hair);border-radius:12px;background:var(--surface)}
.cta h2{margin:0 0 6px;font-size:20px}
.cta p{margin:0 0 16px;color:var(--muted);font-size:15px}
.cta .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cta .pill{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;color:var(--faint)}
.cta .pill i{width:6px;height:6px;border-radius:50%;background:var(--ok);box-shadow:0 0 10px var(--ok)}
.faq dt{font-weight:600;color:var(--head);margin-top:18px}
.faq dd{margin:6px 0 0;color:var(--muted)}
.related{margin-top:48px}
.related ul{list-style:none;padding:0;display:grid;gap:10px}
.related li{margin:0}
.related a{display:block;padding:14px 16px;border:1px solid var(--hair);border-radius:10px;text-decoration:none;color:var(--head);background:var(--surface)}
.related a:hover{border-color:var(--muted)}
.related small{display:block;color:var(--faint);font-size:12.5px;margin-top:3px}
.guides-list{list-style:none;padding:0;display:grid;gap:14px;margin-top:28px}
.guides-list li{margin:0}
.guides-list a{display:block;padding:20px 22px;border:1px solid var(--hair);border-radius:12px;text-decoration:none;background:var(--surface)}
.guides-list a:hover{border-color:var(--muted)}
.guides-list h2{margin:0 0 6px;font-size:19px}
.guides-list p{margin:0;color:var(--muted);font-size:14.5px}
.guides-list small{display:block;margin-top:8px;color:var(--faint);font-size:12px;font-family:"JetBrains Mono",ui-monospace,monospace}
footer.site{border-top:1px solid var(--hair);margin-top:72px}
footer.site .row{max-width:1180px;margin:0 auto;padding:36px 24px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;font-size:12.5px;color:var(--faint)}
footer.site nav{display:flex;flex-wrap:wrap;gap:18px}
footer.site a{color:var(--faint);text-decoration:none}
footer.site a:hover{color:var(--muted)}
@media (max-width:640px){nav.top{display:none}.wrap{padding:0 18px 72px}h2{margin-top:34px}}
`;

const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#39506b"/><stop offset="1" stop-color="#e8c9a0"/></linearGradient></defs><rect x="2" y="2" width="28" height="28" rx="7" fill="url(#g)"/><path d="M9 16a7 7 0 0 1 14 0" fill="none" stroke="#0a0a0b" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="20" r="2.2" fill="#0a0a0b"/></svg>`;

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsonLd(obj) {
  const json = JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  return `<script type="application/ld+json">${json}</script>`;
}

function head({ title, description, canonical, keywords, extraLd }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#0a0a0b" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    ${keywords ? `<meta name="keywords" content="${esc(keywords.join(", "))}" />` : ""}
    <link rel="canonical" href="${canonical}" />
    <meta name="author" content="Nunik Co." />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="ChromaMimic" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <style>${CSS}</style>
    ${extraLd.map(jsonLd).join("\n    ")}
  </head>`;
}

function siteHeader(current) {
  const link = (href, label) =>
    `<a href="${href}"${current === href ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="site"><div class="row">
    <a class="brand" href="/">${LOGO}<span>ChromaMimic</span></a>
    <nav class="top" aria-label="Site">${link("/#how", "How it works")}${link("/guides", "Guides")}${link("/#pricing", "Pricing")}${link("/#faq", "FAQ")}</nav>
    <a class="btn" href="/#tool">Build a LUT</a>
  </div></header>`;
}

function siteFooter() {
  return `<footer class="site"><div class="row">
    <nav aria-label="Footer"><a href="/#tool">Build a LUT</a><a href="/guides">Guides</a><a href="/#pricing">Pricing</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://nunik.co" rel="noopener">Nunik Co.</a></nav>
    <span>&copy; ${UPDATED.slice(0, 4)} ChromaMimic, a tool by Nunik Co. Runs client side, nothing uploaded.</span>
  </div></footer>`;
}

function ctaBlock() {
  return `<aside class="cta" aria-label="Try ChromaMimic">
    <h2>Build the LUT, free, in your browser</h2>
    <p>Drop an original frame and a reference still. ChromaMimic learns the colour transform and exports a .cube for Resolve, Premiere and Final Cut. Nothing is uploaded.</p>
    <div class="row"><a class="btn" href="/#tool">Open ChromaMimic</a><a class="btn ghost" href="/guides/create-lut-from-reference-image">How it works</a><span class="pill"><i></i>Runs locally, no account to grade</span></div>
  </aside>`;
}

function guidePage(guide) {
  const url = `${SITE}/guides/${guide.slug}`;
  const related = guide.related
    .map((slug) => GUIDES.find((g) => g.slug === slug))
    .filter(Boolean);

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": guide.type === "HowTo" ? "TechArticle" : guide.type,
      headline: guide.title,
      description: guide.description,
      url,
      image: OG_IMAGE,
      datePublished: UPDATED,
      dateModified: UPDATED,
      inLanguage: "en-AU",
      author: { "@type": "Organization", name: "Nunik Co.", url: "https://nunik.co" },
      publisher: { "@type": "Organization", name: "Nunik Co.", url: "https://nunik.co" },
      isPartOf: { "@type": "WebSite", name: "ChromaMimic", url: `${SITE}/` },
      about: { "@type": "SoftwareApplication", name: "ChromaMimic", url: `${SITE}/` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ChromaMimic", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` },
        { "@type": "ListItem", position: 3, name: guide.title, item: url },
      ],
    },
  ];
  if (guide.faq?.length) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  if (guide.howToSteps?.length) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: guide.title,
      description: guide.description,
      totalTime: "PT5M",
      tool: [{ "@type": "HowToTool", name: "ChromaMimic" }],
      step: guide.howToSteps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    });
  }

  return `${head({ title: guide.metaTitle, description: guide.description, canonical: url, keywords: guide.keywords, extraLd: ld })}
  <body>
    ${siteHeader("/guides")}
    <main class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">ChromaMimic</a> / <a href="/guides">Guides</a></nav>
      <article>
        <h1>${esc(guide.title)}</h1>
        <p class="meta">Updated ${UPDATED} · ${guide.minutes} min read · by Nunik Co.</p>
        ${guide.body.trim()}
        ${ctaBlock()}
        ${
          guide.faq?.length
            ? `<section class="faq" aria-labelledby="faq"><h2 id="faq">Questions</h2><dl>${guide.faq
                .map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`)
                .join("")}</dl></section>`
            : ""
        }
      </article>
      ${
        related.length
          ? `<section class="related" aria-labelledby="related"><h2 id="related">Related guides</h2><ul>${related
              .map((r) => `<li><a href="/guides/${r.slug}">${esc(r.title)}<small>${r.minutes} min read</small></a></li>`)
              .join("")}</ul></section>`
          : ""
      }
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

function indexPage() {
  const url = `${SITE}/guides`;
  const title = "ChromaMimic guides: LUTs, colour matching and log footage, explained honestly";
  const description =
    "Practical guides for filmmakers and colourists: why LUTs look flat on log footage, where each editor keeps its LUT folder, what a .cube file actually contains, how the free LUT generators compare, and how to keep client frames off other people's servers.";
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url,
      inLanguage: "en-AU",
      isPartOf: { "@type": "WebSite", name: "ChromaMimic", url: `${SITE}/` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: GUIDES.length,
        itemListElement: GUIDES.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: g.title,
          url: `${SITE}/guides/${g.slug}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ChromaMimic", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Guides", item: url },
      ],
    },
  ];
  return `${head({ title, description, canonical: url, keywords: ["lut guides", "colour grading guides", "cube lut", "log footage lut"], extraLd: ld })}
  <body>
    ${siteHeader("/guides")}
    <main class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">ChromaMimic</a> / Guides</nav>
      <h1>Guides</h1>
      <p class="lede">Short, honest answers to the questions that come up every time someone applies a LUT. Written by the people who built ChromaMimic, and updated when the editors change.</p>
      <ul class="guides-list">
        ${GUIDES.map(
          (g) => `<li><a href="/guides/${g.slug}"><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p><small>${g.minutes} min read</small></a></li>`
        ).join("\n        ")}
      </ul>
      ${ctaBlock()}
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

function sitemap() {
  const entries = [
    { loc: `${SITE}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${SITE}/guides`, priority: "0.8", changefreq: "weekly" },
    ...GUIDES.map((g) => ({ loc: `${SITE}/guides/${g.slug}`, priority: "0.7", changefreq: "monthly" })),
    { loc: `${SITE}/privacy`, priority: "0.2", changefreq: "yearly" },
    { loc: `${SITE}/terms`, priority: "0.2", changefreq: "yearly" },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${UPDATED}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

// ---------------------------------------------------------------------------
// Write

mkdirSync(join(PUBLIC, "guides"), { recursive: true });
for (const guide of GUIDES) {
  writeFileSync(join(PUBLIC, "guides", `${guide.slug}.html`), guidePage(guide));
}
writeFileSync(join(PUBLIC, "guides", "index.html"), indexPage());
writeFileSync(join(PUBLIC, "sitemap.xml"), sitemap());

console.log(`seo: wrote ${GUIDES.length} guides, guides/index.html and sitemap.xml (${GUIDES.length + 4} urls)`);
