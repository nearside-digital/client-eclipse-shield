# eclipseshield-website

Website for [Eclipse Shield](https://eclipseshield.co.uk): window film for homes and businesses in Cheshire, Merseyside and Flintshire.

Built with [Astro](https://astro.build) as a static site and hosted on Cloudflare Pages.

## Run it locally

Needs Node.js 22.12 or newer.

```bash
npm install
npm run dev        # http://localhost:4321 with live reload
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run lh -- home quote   # mobile Lighthouse against the running preview
```

## Test the quote form locally

The form posts to a Cloudflare Pages Function (`functions/api/quote.ts`), which only runs under Cloudflare's local runtime:

1. Copy `.env.example` to `.env.local` (uses the Turnstile test site key).
2. Copy `.dev.vars.example` to `.dev.vars` (Turnstile test secret, and a dry run that logs instead of emailing).
3. Run `npm run dev:functions` and open http://localhost:8788/quote/.

To send a real test email, remove `EMAIL_DRY_RUN` from `.dev.vars` and add `RESEND_API_KEY` (and `LEAD_TO` if you want it sent somewhere other than contact@).

## Where things live

- `src/config/site.ts`: business details (phone, email, service area). Change them here, not in pages.
- `src/data/`: services and FAQ content.
- `src/pages/`: one file per page.
- `src/components/`, `src/layouts/`: shared header, footer, layout and SEO tags.
- `src/assets/photos/`: photos (converted to responsive AVIF and WebP at build time).
- `public/`: files served as-is (favicon, social image, `_headers`).
- `functions/`: Cloudflare Pages Functions (the quote form endpoint).
- `NOTES.md`: change log and open issues.
- `docs/analytics-setup.md`: how to set up GA4 and Google Tag Manager (the site is ready; add the GTM ID to switch it on).
- `IMAGES.md`: image brief and where to drop new photos.
- `docs/dns-records.md`: the domain's DNS records in Cloudflare and what each one does.

## Cloudflare Pages settings

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main` (every pull request gets its own preview URL)
- Secrets (Settings > Variables and Secrets, for Production and Preview): `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`. Optional: `LEAD_TO`, `LEAD_FROM`.
