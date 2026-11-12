# 590 Craft Studio

Single-page landing site for 590 Craft Studio, an aluminium fabrication and signage business serving Surat and Rajkot, Gujarat.

The page is a scroll-driven experience: on capable desktop browsers it uses a Three.js building with product hotspots; on mobile and reduced-motion setups it falls back to a lighter image/CSS version. Motion uses GSAP ScrollTrigger. The primary quote path is WhatsApp click-to-chat, with a contact form as well.

The header and footer logo is a placeholder mark (an aluminium frame with “590” in gold). Replace `assets/logo.svg` when the real logo is ready.

## Preview locally

Serve the folder over HTTP (opening `index.html` as a file can block ES modules):

```bash
python3 -m http.server 8080 --directory .
```

Then open http://localhost:8080/

## Customize

Edit `js/config.js` first:

- `name`, `tagline`
- `whatsappNumber` (digits only, with country code, e.g. `9198xxxxxxxx`)
- `phoneDisplay`, `email`
- `defaultWhatsAppMessage`
- `useProjectPhotos` — set to `true` after you add real photos

Also update the same details in `index.html` (title, meta tags, JSON-LD, footer address, and any leftover placeholder copy). Phone, WhatsApp, email, and workshop addresses currently use placeholders (`+91 90000 00000`, `hello@aluform.example`).

To swap the logo, replace `assets/logo.svg` (and `assets/favicon.svg` if you have a favicon). Keep the same file names, or update the paths in the header, footer, and `<link rel="icon">`.

Project photos go in `assets/img/` using the filenames already referenced in `index.html` (for example `fabrication-1.jpg`, `signboard-1.jpg`, `nameplate-1.jpg`, `railing-1.jpg`). After adding them, set `useProjectPhotos: true` in `js/config.js`.

After you have a live URL, replace the placeholder `og:url` in `index.html` so link previews work.

## Deploy

This is a static site (HTML, CSS, and JS). It is set up to deploy on Vercel from the GitHub repository, automatically on every push to the default branch.

You can also drop the folder onto Netlify Drop or connect the same repo to Netlify. If you use Netlify Forms, the contact form already includes `data-netlify="true"` and a honeypot field.

## License

Project source is provided for 590 Craft Studio. Third-party libraries (Three.js, GSAP) remain under their own licenses.
