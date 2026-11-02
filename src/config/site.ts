// Single source of truth for business details used across the site.
// Anything set to null is hidden until it is filled in.

export const site = {
  name: 'Eclipse Shield',
  legalName: 'Eclipse Shield Ltd',
  companyNumber: '17381324',
  registeredIn: 'England and Wales',
  // TODO: registered office address (legally required on the site before launch).
  registeredOffice: null as string | null,
  url: 'https://eclipseshield.co.uk',
  email: 'contact@eclipseshield.co.uk',
  phone: '07592 196929' as string | null,
  // WhatsApp is switched off for now. Set to an international number without '+' (e.g. '447123456789') to enable.
  whatsapp: null as string | null,
  base: 'Bromborough',
  region: 'Wirral, Merseyside',
  serviceAreaLine:
    'Based in Bromborough, covering Cheshire, Merseyside and Flintshire, and further afield for larger projects',
  areasServed: ['Cheshire', 'Merseyside', 'Flintshire'],
  hours: 'Open 7 days a week',
  filmBrand: '3M',
  freeSurveyRadiusMiles: 20,
  // Public Turnstile site key (safe to publish). For local testing, set PUBLIC_TURNSTILE_SITE_KEY to
  // Cloudflare's test key 1x00000000000000000000AA in .env.local (see .env.example).
  turnstileSiteKey: (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined) || '0x4AAAAAAFaaZAbadz4JSA3s',
  // Google Tag Manager container ID, e.g. 'GTM-ABC1234' (public). Leave empty until analytics is set up:
  // while empty, no tags load, no cookie banner shows and the privacy policy says no analytics is used.
  // Can also be set with the PUBLIC_GTM_ID build variable.
  gtmId: ((import.meta.env.PUBLIC_GTM_ID as string | undefined) || '').trim(),
  // Google Analytics 4 measurement ID, e.g. 'G-AB12CD34EF' (public), for the tag straight from Google without a
  // Tag Manager container. The Nearside engine creates the property and tells Gabriel the ID; it goes here or in
  // the PUBLIC_GA4_ID build variable. Loads only after the visitor allows analytics, like the container.
  ga4Id: ((import.meta.env.PUBLIC_GA4_ID as string | undefined) || '').trim(),
  // Any tracking at all? While false: no tags load, no cookie banner, and the privacy policy says so.
  get tracking() {
    return Boolean(this.gtmId || this.ga4Id);
  },
} as const;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '').replace(/^0/, '+44')}`;

export const nav = [
  { href: '/services/', label: 'Services' },
  { href: '/homes/', label: 'Homes' },
  { href: '/businesses/', label: 'Businesses' },
  { href: '/areas/', label: 'Areas' },
  { href: '/contact/', label: 'Contact' },
];
