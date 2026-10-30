# Eclipse Shield website: notes

A short dated entry for every change, newest first. Open issues are at the bottom.

## 2026-10-30: Look v2: glass cards, lifted photos, reveal-once, magnetic buttons, header no longer sticky

**Why:** Gab's call after the template's "modern" look (client-site-template PR #15): the key features on every client site, keeping each site's own sections and brand. The gold-on-black look is unchanged.

**What:**
- Cards (services, homes/businesses) are glass: white at 76% with blur over a soft gold glow behind the page, lifted with a shadow, a small rise on hover. The three steps in the dark "how it works" band get the same in dark glass. Solid fallbacks under `prefers-reduced-transparency`.
- Photos in figures lifted with a shadow. Cards, steps and photos fade up once as they come into view (never text; nothing hidden without the script; off under `prefers-reduced-motion`).
- Buttons drift towards the pointer on desktop only; the gold button has a soft glow.
- The header no longer sticks to the top (it took too much of a phone screen while scrolling). The existing phone bar (quote + call) stays and becomes glass.

**Tested:** `npm run build` (19 pages). Previewed at 375px and 1366px. One inline script, no new requests.

## 2026-10-18: Quote form honeypot no longer catches autofill

- Two test quotes on the new Worker returned "sent" but never reached Resend. The hidden spam trap field was named and labelled "Company website", so browser autofill filled it with saved company details, and the form silently treated real people as bots.
- The trap is now `qf_hp_x`, labelled "Leave this empty" (nothing autofill recognises), with password-manager ignore hints. A filled trap is now logged in the Worker logs ("quote: honeypot filled, not sent", no form contents), so this can't happen silently again.
- Checked locally: a filled trap returns the fake success and logs; an old-style `company_website` value and a normal quote both go through.

## 2026-10-18: Moving to the Nearside Digital Cloudflare account

- Repo transferred to `nearside-digital/client-eclipse-shield` (the old GitHub address redirects).
- `eclipseshield.co.uk` added to the Nearside Digital Cloudflare account (pending until the nameservers change to `coby` and `olga.ns.cloudflare.com` at Squarespace). All 12 email and verification records imported from the old zone's export, all DNS only: Google Workspace MX ×5, SPF, DKIM, DMARC, Search Console verification, and Resend's DKIM, `send` and `rsend`.
- Always Use HTTPS, minimum TLS 1.2, SSL Full, and the www → root 301 Redirect Rule recreated.
- New Turnstile widget "Eclipse Shield quote form" in the Nearside account; the site key in `src/config/site.ts` is updated to match. Its secret goes in the new Pages project's `TURNSTILE_SECRET_KEY`.
- **Now a Cloudflare Worker, not Pages** (as the other Nearside sites): `wrangler.jsonc` serves `dist` as static assets, and `worker/index.ts` runs only `/api/*`, passing `/api/quote` to the unchanged handler in `functions/api/quote.ts`. 404 page, trailing-slash handling and `_headers` work as before; `noindex` now covers the workers.dev copies. `npm run dev:functions` runs `wrangler dev`. Checked locally: pages 200, unknown page 404, `GET /api/quote` 405, missing spam check refused, and a full dry-run quote with a photo accepted.
- Worker `client-eclipse-shield` (Workers Builds from `main`) with secrets `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY`.
- Next: test on workers.dev, switch nameservers, attach the custom domains, send a test quote, then delete the old Pages project and Turnstile widget in the old account.

## 2026-10-12: Live on eclipseshield.co.uk

- DNS moved from Squarespace to Cloudflare. Squarespace remains the registrar. DNSSEC was turned off at Squarespace first, and the removal was confirmed at the .uk registry before switching nameservers to `raina` and `sid.ns.cloudflare.com`.
- All email records were carried over and checked on Cloudflare's nameserver: Google Workspace MX ×5, DMARC, and Resend's `resend._domainkey`, `send` and `rsend` (the scan missed the two Resend CNAMEs, which were added by hand as DNS only).
- Google Workspace email authentication added: SPF `v=spf1 include:_spf.google.com ~all` and DKIM (`google._domainkey`, 2048-bit, authentication started in Google Admin).
- Cloudflare Pages custom domains `eclipseshield.co.uk` and `www`. Redirect Rule www → root (301). Always Use HTTPS (http → https 301).
- Checked live: HTTPS on both hosts, www redirect, no `noindex` on the real domain, `robots.txt` and sitemap (18 URLs) served to a Googlebot user agent, the quote API configured in production, and a real test lead from the live quote page received at contact@.
- Google Search Console domain property added and sitemap submitted (`https://eclipseshield.co.uk/sitemap-index.xml`). "Couldn't fetch" at first is the usual delay for a new property.
- New `docs/dns-records.md`: every DNS record, what it is for, and what breaks if it is removed.

## 2026-10-12: Image brief and drop-in photos

- `IMAGES.md`: what images to make (subject, shape, pixel size, exact file name), ready-made AI prompts, Canva search terms, rules (honesty, privacy, location data) and a wish list of real job photos.
- Drop-in photos: `src/lib/images.ts` picks up `src/assets/photos/services/<service-slug>.jpg` and `src/assets/photos/pages/businesses.jpg` automatically. They replace the film illustrations with the planned alt text (in `src/data/services.ts`). Tested with stand-in photos (including an upper-case .JPG) and then removed.

## 2026-10-12: Cookie consent, GTM-ready analytics, privacy and terms

- **Consent Mode v2:** defaults set to "denied" on every page. "Basic" mode: Google Tag Manager only loads after the visitor allows analytics, so no Google requests happen before consent. The consent script sits at the end of `<head>` so it never delays the first paint.
- **Cookie banner:** Accept all, Reject all (equal weight) and Manage (Necessary always on, Analytics toggle). "Cookie settings" in the footer reopens it. The choice is stored in local storage for 12 months. Withdrawing consent deletes `_ga` cookies and reloads to stop running tags. The banner is in the HTML from the start (no pop-in) and hidden immediately for returning visitors.
- **Switched off until a GTM ID is added** (`gtmId` in `src/config/site.ts` or the `PUBLIC_GTM_ID` build variable). With no ID: no banner, no "Cookie settings" link, no Google code, and the privacy policy says no analytics is used. Adding the ID turns all of this on together. Preview the banner with `?cookie-demo`.
- **dataLayer events** for GTM: `quote_start`, `generate_lead` (no personal data) and `consent_update`.
- **`docs/analytics-setup.md`:** click-by-click GA4 and GTM setup (tags, triggers, variables, key event, data retention, testing).
- **Privacy policy:** new cookies section (necessary storage, Turnstile, and analytics details plus a cookie table that appear only when GTM is configured), Google Analytics added to processors when configured, date corrected.
- **Terms:** full website terms of use plus quotes and work (written quote applies, consumer rights, 14-day cancellation for off-premises or distance contracts, liability, law). Draft for review.
- **The `:has()` body selector** for the mobile bar padding was replaced with a class set at build time.
- **Tested in the browser:** no-GTM build (no banner, no Google scripts, consent defaults set); placeholder GTM build (banner on first visit, Accept loads GTM after a "granted" update, returning visitor loads GTM straight away with no banner, Cookie settings → untick analytics → saved, cookies deleted, page reloaded without GTM; Reject on first visit loads nothing); demo mode; phone-width layout.
- **Lighthouse (mobile):** `/privacy/`, `/terms/`, `/contact/` 100 / 100 / 100 / 100. Home 94 to 96 performance in this session, both with and without the banner. Back-to-back runs of `main` on the same machine also scored 94 to 96, so the drop from earlier runs is down to the machine, not this change.

## 2026-10-12: Quote form working end to end, mobile tweaks

- First real test lead received at contact@ from a phone (with 3 photos). Earlier failures were configuration: the Turnstile secret came from a different widget, then the Turnstile site key had been pasted into `RESEND_API_KEY` on Preview. Every failure message now ends with a code (Turnstile codes, `resend-<status>` plus error type, `config-missing`, `network`) so problems like this are quick to find.
- Removed the fixed mobile call bar from the quote page (it got in the way while typing; the page already shows the phone number). Page padding for the bar now only applies where the bar is shown.
- Fixed the date field overflowing the card on iPhone (Safari gives date inputs a fixed native width).
- UK postcodes are tidied in the email ("ch655by" becomes "CH65 5BY").
- Lighthouse (mobile): `/quote/` 100 / 100 / 100 / 100; home 97 to 98 performance (110 ms blocking time while the local Cloudflare runtime was also running), 100 for the rest.

## 2026-10-12: Quote form spam check fixes (after phone testing)

- Real-phone tests failed the Turnstile check. Two causes: the token (valid 5 minutes, single use) could expire while filling in the form, and when Cloudflare asked for a "Verify you are human" tick it appeared late (only on the last step) and sending didn't continue after ticking.
- The check now starts quietly on the first interaction with the form, so a token is normally ready by the last step. The box sits above the Next/Send buttons, and if Cloudflare wants a tick a hint appears straight away.
- Pressing Send waits for the token. If a tick is needed it says "Nearly there…" and sends automatically once ticked. Expired tokens refresh automatically, and a failed check is retried once with a fresh token.
- The server now logs and returns Cloudflare's Turnstile error codes (no personal data), and the form shows the code if a check ever fails. A fake-token test against the preview returned `invalid-input-response`, which confirms the secret key is valid.
- Tested locally: normal pass (token ready on step 1, send in about 0.1 s), forced "always needs a tick" key (hint on step 1, waiting message on Send), and a simulated expired token (automatic retry, success). Lighthouse `/quote/`: 100 / 100 / 100 / 100.

## 2026-10-13: Quote form, contact page and privacy policy

- **Delivery choice:** Cloudflare Pages Function (`functions/api/quote.ts`) plus Resend. Chosen over a form service because it is free at our volume (Resend: 3,000 emails a month), supports photo attachments, keeps the email layout ours, and adds no extra third party beyond Resend. Nothing is stored: the email is the only copy.
- **Spam protection:** hidden honeypot field plus Cloudflare Turnstile in "interaction-only" mode (invisible for most people). Turnstile only loads when someone starts the form, so it does not slow the page down. The server verifies the token before sending.
- **Multi-step form on `/quote/`** (7 steps, mobile-first): property type, what they want (multiple), windows (count, size or "not sure", glass type, position), photos, postcode and town, timing (flexible or a date), contact details. Only name, email and privacy consent are required (phone is required if they choose call or text). Progress bar, back/next, focus moves to each step's question, inline errors, thank-you state.
- **Photos:** up to 5, resized in the browser to 1600 px JPEG before upload (also strips location data). Server limits: 8 MB each, 20 MB total, images only.
- **Analytics events (no personal data):** `quote_start` on first interaction; `generate_lead` on success with `property_type`, `interests` and `photo_count`.
- **Pre-filled links:** service pages link to `/quote/?service=<slug>` (pre-ticks the matching option); Homes links to `/quote/?property=home`.
- **Email to contact@:** subject "Quote request: Name, Town (Property type)", a table of answers, photos attached, and Reply-To set to the customer.
- **Contact page** (`/contact/`) with quote, phone and email options, service area and company details. Menu: "FAQ" replaced by "Contact" (FAQs remain on the home and service pages).
- **Privacy policy** rewritten for UK GDPR: quote form data and lawful basis, Turnstile, hosting, processors (Cloudflare, Resend, Google Workspace), retention, rights, ICO. Cookies and analytics section to be completed with the consent banner.
- **Mobile bar** on the quote page offers "Call" instead of a link back to the form.
- **Turnstile keys:** the real site key is the default; local builds use the test key from `.env.local`. Local testing: `npm run dev:functions` (see README).
- **Tested locally with Cloudflare's runtime (wrangler):** validation errors (name, email, consent, phone when call or text is chosen), missing Turnstile token rejected, honeypot silently accepted, valid submission with photos (dry run), GET rejected. In the browser: pre-fill, step navigation, `quote_start` once, photo resize (a non-image was rejected), inline errors with focus, successful submit, thank-you state and `generate_lead`.
- **Lighthouse (mobile):** `/quote/`, `/contact/`, `/privacy/` and a service page all 100 / 100 / 100 / 100; home 99 to 100.

## 2026-10-12: Area pages

- Area pages for Merseyside, Cheshire and Flintshire from one template (`src/pages/areas/[slug].astro`, content in `src/data/areas.ts`), plus an `/areas/` overview.
- Each page has: towns covered (grouped), what the free 20-mile survey area means there, common local window problems linked to the right services, local "good to know" notes (conservation areas and listed buildings, flats, rural access, Welsh building regulations, business sites), a short how-it-works, local FAQs, links to the other areas and a quote call to action.
- Copy describes the area and the jobs film suits. It does not claim past jobs or customers in any area.
- Navigation "Areas" now goes to `/areas/`; the home page area list links to each area page.
- BreadcrumbList and FAQPage structured data on area pages. Sitemap now lists 17 pages.
- Lighthouse (mobile): `/areas/`, all three area pages and home 100 / 100 / 100 / 100. Link and JSON-LD check: 18 pages, no problems.

## 2026-10-12: Service pages, Homes and Businesses

- Six service pages from one template (`src/pages/services/[slug].astro`, content in `src/data/services.ts`): privacy and one-way mirror, solar and heat control, frosted and decorative, UV and fade protection, safety and security, anti-graffiti. Each has benefits, where it is used, film options, an honest "Good to know" box, FAQs, related services and a quote call to action.
- Services overview page (`/services/`) with a "start with the problem" guide.
- Homes (`/homes/`) and Businesses (`/businesses/`) landing pages: room-by-room and workplace-by-workplace uses linking to the right services, why film, what happens at the survey, FAQs.
- Service, BreadcrumbList and FAQPage structured data; visible breadcrumbs on inner pages.
- Services without a real photo use a simple illustration of the film effect (`FilmVisual`) until photos are ready. Solar control uses the glass room terrace photo.
- Navigation now links to Services, Homes and Businesses. Areas and FAQ still point at home page sections.
- Fixed the header phone icon size and number wrapping.
- Copy avoids promises not yet confirmed (for example, bringing film samples to surveys).
- Lighthouse (mobile): home, services, four service pages, homes and businesses all 100 / 100 / 100 / 100 (one run of frosted was 99 performance). Internal link and JSON-LD check: 14 pages, no problems.

## 2026-10-12: Cloudflare Pages connected

- Repo connected to Cloudflare Pages (production branch `main`, preset Astro, build `npm run build`, output `dist`). Pull requests get preview URLs.
- Fixed the first Cloudflare build: `npm ci` failed because the lock file was written by npm 11 (local Node 24) and Cloudflare uses npm 10 (Node 22), which also wants `@emnapi/core` and `@emnapi/runtime` listed. Lock file regenerated with npm 10; checked with both npm 10 and 11. If dependencies change, run `npx npm@10 install --package-lock-only` before committing.

## 2026-10-11: Phone number and company details

- Added the phone number (07592 196929). Call links now show in the header (wide screens), mobile quote bar, call-to-action band and quote page.
- Footer and privacy notice show "Registered in England and Wales, company number 17381324". Company number also added to the LocalBusiness structured data.
- Owner confirmed permission to use the glass room job photos.
- `npm run lh -- home quote` runs a mobile Lighthouse check. Result: home 99 / 100 / 100 / 100, quote 100 / 100 / 100 / 100.

## 2026-10-10: Scaffold, home page and first preview

- New Astro 7 static site (plain components and CSS, no UI framework), deployed with Cloudflare Pages.
- Branding uses the business colours from the logo: black, gold and silver. Font is Manrope (self-hosted, one variable font file).
- Header logo is an SVG redraw of the logo mark (arc, sun flare, shield) with the "Eclipse Shield" wordmark in text. The original PNG logo is used for the social sharing image and the touch icon.
- Home page: hero, services overview (6 films), homes and businesses, how it works, why us, service area, FAQ, quote call to action. The navigation points to home page sections until the dedicated pages exist.
- Real job photos from the glass room fit are used, resized and with phone location (EXIF/GPS) data removed, because the repo is public.
- Temporary quote page (email link with a pre-filled template) until the multi-step form is built.
- Interim privacy notice and terms (drafts, must be reviewed before launch).
- 404 page, sitemap (`/sitemap-index.xml`), `robots.txt`, canonical and Open Graph tags, LocalBusiness and FAQPage JSON-LD.
- Security headers and long caching for hashed assets in `public/_headers`. Preview and `*.pages.dev` URLs send `X-Robots-Tag: noindex`.
- Lighthouse (mobile, local production build): home 100 / 100 / 100 / 100, quote 100 / 100 / 100 / 100 (performance / accessibility / best practices / SEO).

## Open issues

- **WhatsApp** is switched off for now (set `whatsapp` in `src/config/site.ts` to enable it later).
- **Registered office address.** Company number is shown; UK limited companies must also show their registered office address on the website (a registered office service address is fine). Set `registeredOffice` in `src/config/site.ts` before launch.
- **ICO data protection fee.** Needed now: the quote form is live and collects customer details. Register at ico.org.uk (tier 1 for a small company) and send the ZA… reference so it can go in the privacy policy.
- **Insurance.** None yet, so the site makes no insurance claims. Add it to "Why us" once it is in place (public liability is worth having for fitting work).
- **3M film warranty.** Unknown, so not mentioned yet.
- **Opening hours.** Shown as "Open 7 days a week"; the structured data currently says open 24 hours, 7 days. Confirm what hours customers can actually call.
- **Photo captions.** Permission confirmed. Tell us which film was fitted on the glass room job so captions can be more specific.
- **Images:** see `IMAGES.md` for the images to make and where to save them.
- **AI-edited images** in `Web Images` (privacy glass outside, exterior privacy glass) are not used. If they are used later, they must be labelled as illustrations, not real jobs.
- **Logo files.** A vector (SVG) or high-resolution transparent PNG of the final logo would help for print and future pages.
- **Film samples.** If you carry 3M sample swatches to surveys, tell us and the copy can say so (it currently only says "ask us about samples").
- **Service copy review.** Please read the service pages for anything you don't offer or would describe differently (for example edge attachment for security film, custom logos, fitting on conservatory roofs).
- **Area copy review.** Check the town lists and local notes on the area pages, and tell us about any towns you would rather not list or want to add.
- **Privacy policy:** draft. Confirm the retention periods (12 months for enquiries that don't go ahead, 6 years for customers) and add the ICO registration number once registered.
- **Terms:** draft. Check the quotes and work section matches how you actually work (quote validity, deposits, guarantees), ideally with a solicitor.
- **Analytics:** when ready, follow `docs/analytics-setup.md` and add the GTM ID. The banner and privacy wording switch on automatically.
- **Search Console:** check the sitemap status changes from "Couldn't fetch" to "Success" within a few days, and request indexing of the home page.
- **Google Business Profile:** set up as a service-area business (address hidden), category "Window tinting service", linked to the website.
- **Optional:** turn DNSSEC back on through Cloudflare (see `docs/dns-records.md`).
- **Optional:** automatic confirmation email to the customer after they submit the form.
