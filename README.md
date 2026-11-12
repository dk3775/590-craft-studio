# 590 Craft Studio — landing page (Surat & Rajkot)

This is a one-page static landing site for an aluminium fabrication and signage business. It is built for ad traffic, and the main call to action is WhatsApp click-to-chat.

- **Desktop:** a 3D apartment building drawn with Three.js and driven by scroll. As you scroll, the camera circles the building and stops at hotspots for each product (windows, doors, glass partitions, ACP elevation, signboard, society name board, glass railings). For each hotspot, an HTML card fades in with that product's options.
- **Mobile, reduced motion, or no WebGL:** an inline SVG building that pans and zooms to the same hotspots as you scroll, with the same cards. Three.js is never downloaded on these devices.
- **Below the 3D section:** product detail sections (fabrication, signboards, name plates, railings), the Surat & Rajkot service area, how the work is done, a quote form that opens WhatsApp and is also captured by Netlify Forms, and a footer.

Plain HTML/CSS/JS. There is no build step and no framework. Only GSAP 3.12.5 (core + ScrollTrigger) and Three.js r160 load from the jsDelivr CDN, at pinned versions. Fonts come from Google Fonts.

## Folder structure

```
alufab-landing/
├── index.html            # the whole page (all text lives here)
├── success.html          # thank-you page for no-JS form posts (Netlify)
├── 404.html              # not-found page
├── css/styles.css        # all styles; colours/fonts in :root at the top
├── js/
│   ├── config.js         # ★ business details: name, WhatsApp, phone, email, photos flag
│   ├── mode.js           # picks "3d" or "lite" layout before first paint
│   ├── main.js           # GSAP/ScrollTrigger setup, matchMedia, form → WhatsApp
│   ├── building-scene.js # procedural Three.js building, camera views, hotspots
│   └── mobile-scene.js   # SVG building journey for mobile / fallback
├── assets/
│   ├── logo.svg          # placeholder logo (header + footer)
│   ├── favicon.svg       # placeholder favicon
│   ├── og-image.png      # 1200×630 link-preview image (screenshot of the 3D hero)
│   └── img/              # put real project photos here (see "Photos")
├── netlify.toml          # Netlify: publish root, security + cache headers
├── vercel.json           # Vercel: same headers (if you host on Vercel instead)
├── robots.txt
└── README.md
```

## Preview locally

Use a local web server. Opening `index.html` directly (`file://`) won't work properly, because ES modules (`type="module"`) are blocked on `file://`.

```bash
cd alufab-landing
npx serve .                 # → http://localhost:3000
# or
python3 -m http.server 8080 # → http://localhost:8080
```

- To check the mobile version, use the browser DevTools device toolbar (a width under 900px). You can also turn on "prefers-reduced-motion: reduce" under DevTools → Rendering.
- On `localhost`, the form opens WhatsApp but skips the Netlify submit (Netlify Forms only works once deployed).

## Deploy to Netlify

The site deploys as-is. `netlify.toml` sets `publish = "."` and has no build command.

**Option A: drag and drop**
1. Go to https://app.netlify.com/drop.
2. Drag the whole `alufab-landing` folder onto the page. You get a `https://<random>.netlify.app` URL.

**Option B: Netlify CLI**
```bash
cd alufab-landing
npx netlify-cli login
npx netlify-cli deploy            # draft URL to check first
npx netlify-cli deploy --prod     # live URL
```
The first `deploy` asks you to create or link a site. Choose `.` as the publish directory.

**Option C: Git continuous deploy (recommended)**
1. Push this folder to a GitHub/GitLab repo. It can be the repo root or a subfolder.
2. In Netlify, go to **Add new site → Import an existing project** and pick the repo.
3. Leave the build command empty. Set the publish directory to `.`. If the site is in a subfolder, set **Base directory** to that folder.
4. Every push to the main branch redeploys the site.

**Enable Netlify Forms (one time)**
- Go to Site configuration → **Forms** → **Enable form detection**, then redeploy. The `quote` form is detected from `index.html` (`data-netlify="true"`, honeypot `bot-field`).
- Submissions appear under **Forms → quote**. Add email notifications under Forms → Form notifications.
- How submitting works:
  - **With JS:** WhatsApp opens with the message pre-filled, and a copy is posted to Netlify in the background.
  - **Without JS:** the form posts normally and Netlify shows `/success.html`.

**Custom domain for ads**
- Go to Domain management → **Add a domain** (e.g. `590craftstudio.in`). Follow the DNS steps (Netlify DNS, or a CNAME to `<site>.netlify.app`). HTTPS is issued automatically.
- Then update `og:url` in `index.html` and use the custom domain as your ad destination URL.

**Vercel instead?** Import the repo as a project with Framework preset "Other". Leave the build command empty and set the output directory to `.`. `vercel.json` adds the same headers.
- Netlify Forms does not work on Vercel. The WhatsApp flow still works fully, and the background POST fails silently.
- To capture submissions on Vercel, change the form handler to a service such as Formspree (see "Form destination" below).

## Customize these (all placeholders)

| What | Where | Current placeholder |
|---|---|---|
| **WhatsApp number** | `js/config.js` → `whatsappNumber` (format `91XXXXXXXXXX`, no `+`/spaces). Also find & replace `919000000000` in `index.html`, `success.html`, `404.html` (no-JS fallback links). | `919000000000` |
| **Phone** | `js/config.js` → `phoneDisplay`, `phoneHref`. Also find & replace `+91 90000 00000` / `+919000000000` in `index.html` and `+91-90000-00000` in the JSON-LD. | `+91 90000 00000` |
| **Email** | `js/config.js` → `email`. Also find & replace `hello@aluform.example` in `index.html`. | `hello@aluform.example` |
| **Default WhatsApp message** | `js/config.js` → `defaultWhatsAppMessage`. Per-button messages are in the `data-wa-text="…"` attributes in `index.html`. | "Hi 590 Craft Studio, …" |
| **Business name / tagline** | `js/config.js` → `name`, `tagline`; `index.html` `<title>`, meta/OG tags, JSON-LD, header `.brand__name`, footer | 590 Craft Studio · Aluminium & Signage · Surat & Rajkot |
| **Logo / favicon** | Replace `assets/logo.svg` and `assets/favicon.svg` (keep the file names) | placeholder art |
| **Addresses** | `index.html` footer `<address class="site-footer__addr">` | "Workshop address, Area, Surat/Rajkot (placeholder)" |
| **All page text** | `index.html`. Journey cards are the `<article class="step">` blocks. Details are the `<section class="product">` blocks. | — |
| **Text on the 3D building** | `js/building-scene.js` top: `SIGN_TEXT` (shop sign), `SOCIETY_TEXT` (gate board). The small pillar plate text ("A-Wing / FLATS 101–704") is in `makePlateTexture()`. | `590 CRAFT STUDIO`, `Sample Residency` |
| **Text on the mobile SVG building** | `index.html`, the two `<text class="lite-signtext">` elements | `590 CRAFT STUDIO` |
| **Link preview image** | `assets/og-image.png` (1200×630). Set `og:url` to your live URL. | screenshot |
| **Colours** | `css/styles.css` `:root`: `--gold` / `--gold-2` (accent), `--bg`, `--wa` | dark charcoal + warm gold |
| **Fonts** | Google Fonts `<link>` in `index.html` + `--font-*` in `:root` | Fraunces / Manrope / IBM Plex Mono |
| **Form destination** | Netlify Forms by default (`name="quote"`). For another service (e.g. Formspree), set the form `action` to its URL and change the `fetch('/', …)` call in `initForm()` in `js/main.js`. | Netlify Forms |
| **Product wording** | Series, glass and material descriptions in `index.html` are general. **Confirm them with the owner** (e.g. which name-plate materials, railing fittings, glass thicknesses are offered). | — |

### Photos
No real client photos are included. The product sections use original SVG illustrations instead. To add real project photos:
1. Put JPGs (about 1600px wide, 4:3, under 300 KB each) at these exact paths:
   - `assets/img/fabrication-1.jpg`, `fabrication-2.jpg`, `fabrication-3.jpg`
   - `assets/img/signboard-1.jpg`, `signboard-2.jpg`, `signboard-3.jpg`
   - `assets/img/nameplate-1.jpg`, `nameplate-2.jpg`
   - `assets/img/railing-1.jpg`, `railing-2.jpg`
2. Set `useProjectPhotos: true` in `js/config.js`.
3. Edit each `<img alt="…">` in the `.photo-row` blocks in `index.html` to describe the real photo.

The images lazy-load, and any missing file is simply skipped. To add or remove photos, add or remove `<img data-src="…">` tags inside the `.photo-row` for that section.

## How the 3D scroll and fallback work

- **Choosing a mode:** `js/mode.js` runs in `<head>` and sets `<html data-mode="3d|lite">` before first paint. It decides based on WebGL support, `Save-Data`, low `deviceMemory`, viewport size (≥900×560) and `prefers-reduced-motion`. It does not sniff the user agent. In `main.js`, `gsap.matchMedia()` re-checks the same conditions when the viewport or motion setting changes, and cleanly reverts and rebuilds.
- **3D mode:** `building-scene.js` is loaded with a dynamic `import()` only in this mode.
  - The building is made from boxes and planes. Repeated parts use `InstancedMesh`. The environment lighting is generated in code (no HDR file), and the sign and name-board text are drawn on canvas textures.
  - Pixel ratio is capped at 2. Shadows render once and then freeze, since the scene is static.
  - The render loop runs only while the journey is on screen and the tab is visible. Everything is disposed when the mode switches.
- **Scroll:** a single GSAP timeline is attached to a pinned ScrollTrigger (`pin: true`, `scrub: 0.7`). It tweens a camera-state object between the views in `VIEWS` and cross-fades the cards. It snaps to timeline labels (`snap: { snapTo: "labels" }`), so each scroll gesture settles on one product.
- **Hotspots:** each hotspot's 3D point is projected to the screen every frame and moved with `transform` only (no layout reads). Hotspots hide when they face away from the camera. They are focusable buttons, and clicking one scrolls to its step.
- **Lite mode:** `mobile-scene.js` uses ScrollTrigger on each card to pan and zoom the SVG building (`#lite-world`) to the matching hotspot, and to fade cards in. With reduced motion, changes apply instantly and nothing animates or is pinned.
- **Other animation:** reveals use `ScrollTrigger.batch` with transform and opacity only.
- **Plugins:** only free GSAP core and ScrollTrigger are used. **No Club/bonus plugins** (no ScrollSmoother, SplitText, etc.).
- **If a CDN fails:** if Three.js can't load, the page switches to lite mode. If GSAP can't load, all content is still shown in a static layout.

## Known limitations
- All contact details, addresses, logo and photos are placeholders (see the table above).
- The 3D building is a stylized illustration, not the client's real project.
- Netlify Forms only works on Netlify. On Vercel, use a form service if you need submissions stored.
- The `Content-Security-Policy` in `netlify.toml` / `vercel.json` allows only `self`, jsDelivr and Google Fonts. If you add analytics (e.g. a Meta Pixel or Google Ads tag for your campaigns), add their domains to `script-src`, `img-src` and `connect-src`.
