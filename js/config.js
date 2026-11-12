/* ==========================================================================
   590 Craft Studio — BUSINESS DETAILS (edit this file first)
   --------------------------------------------------------------------------
   Phone and WhatsApp are live. Email is still a placeholder.
   The same values also appear as fallback text inside index.html,
   success.html and 404.html (for visitors without JavaScript).
   ========================================================================== */

export const BUSINESS = {
  name: '590 Craft Studio',
  tagline: 'Aluminium & Signage · Surat & Rajkot',

  // WhatsApp click-to-chat number in international format WITHOUT "+" or spaces.
  whatsappNumber: '917201936675',

  phoneDisplay: '+91 72019 36675',
  phoneHref: '+917201936675',
  email: 'hello@aluform.example',                    // PLACEHOLDER (.example is a reserved, non-working domain)

  instagramHandle: '590craftstudio',
  instagramUrl: 'https://www.instagram.com/590craftstudio/',

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
