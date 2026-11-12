/* ==========================================================================
   590 Craft Studio — BUSINESS DETAILS (edit this file first)
   --------------------------------------------------------------------------
   Every value below is a PLACEHOLDER. Replace with the real business details.
   The same placeholder number/email also appears as fallback text inside
   index.html, success.html and 404.html (for visitors without JavaScript) —
   do a project-wide find & replace for:
       919000000000        -> your WhatsApp number (country code + number, no +, no spaces)
       +91 90000 00000     -> your phone number as you want it displayed
       +919000000000       -> your phone number for tel: links
       hello@aluform.example -> your email
   ========================================================================== */

export const BUSINESS = {
  name: '590 Craft Studio',                          // brand name
  tagline: 'Aluminium & Signage · Surat & Rajkot',   // PLACEHOLDER tagline

  // WhatsApp click-to-chat number in international format WITHOUT "+" or spaces.
  // India example: 91 + 10-digit mobile  ->  "91XXXXXXXXXX"
  whatsappNumber: '919000000000',                    // PLACEHOLDER (not a real number)

  phoneDisplay: '+91 90000 00000',                   // PLACEHOLDER shown on the page
  phoneHref: '+919000000000',                        // PLACEHOLDER used in tel: links
  email: 'hello@aluform.example',                    // PLACEHOLDER (.example is a reserved, non-working domain)

  // Default text when someone taps a generic WhatsApp button.
  defaultWhatsAppMessage: 'Hi 590 Craft Studio, I would like a quote for aluminium / glass / signage work.',

  // Set to true once you have added real project photos to /assets/img/
  // (see README → "Photos"). While false, the original SVG illustrations are shown
  // and no image requests are made.
  useProjectPhotos: false,
};

/** Build a wa.me click-to-chat URL with a prefilled, URL-encoded message. */
export function waLink(text = BUSINESS.defaultWhatsAppMessage) {
  return `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
