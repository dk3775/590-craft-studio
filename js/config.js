/* ==========================================================================
   590 Craft Studio — BUSINESS DETAILS (edit this file first)
   --------------------------------------------------------------------------
   Phone, WhatsApp, Instagram and email are live.
   The same values also appear as fallback text inside index.html,
   success.html and 404.html (for visitors without JavaScript).
   ========================================================================== */

export const BUSINESS = {
  name: '590 Craft Studio',
  tagline: 'Fabrication & Signage · Gota, Ahmedabad',

  // WhatsApp click-to-chat number in international format WITHOUT "+" or spaces.
  whatsappNumber: '917201936675',

  phoneDisplay: '+91 72019 36675',
  phoneHref: '+917201936675',
  email: '590craftstudio@gmail.com',

  instagramHandle: '590craftstudio',
  instagramUrl: 'https://www.instagram.com/590craftstudio/',

  // Default text when someone taps a generic WhatsApp button.
  defaultWhatsAppMessage: 'Hi 590 Craft Studio, I would like a quote for fabrication / signage work in Ahmedabad.',

  // Set to true once real project photos (completed work, not brand marks)
  // have been added to /assets/img/ — see README → "Photos".
  // Brand graphics live in the studio section and do not use this flag.
  useProjectPhotos: true,
};

/** Build a wa.me click-to-chat URL with a prefilled, URL-encoded message. */
export function waLink(text = BUSINESS.defaultWhatsAppMessage) {
  return `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
