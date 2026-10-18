# Domain and DNS records

`eclipseshield.co.uk` is **registered with Squarespace** (renewals are paid there). Its **DNS is managed in Cloudflare, in the Nearside Digital account** (agency@nearsidedigital.com), under nameservers `coby.ns.cloudflare.com` and `olga.ns.cloudflare.com`. (Until 18 Oct 2026 it was in Eclipse Shield's own Cloudflare account, nameservers `raina`/`sid`.) Add or change DNS records in **Cloudflare → eclipseshield.co.uk → DNS → Records**. Changes made in Squarespace's DNS settings no longer have any effect.

## Records and what they do

| Type | Name | Value | Proxy | Used for |
|---|---|---|---|---|
| AAAA | `eclipseshield.co.uk` | `100::` | Proxied | Placeholder: the website is the `client-eclipse-shield` Worker, on the route `eclipseshield.co.uk/*` (in `wrangler.jsonc`) |
| AAAA | `www` | `100::` | Proxied | Placeholder: `www` is redirected to the main address by a Redirect Rule |
| MX ×5 | `@` | `aspmx.l.google.com` (1), `alt1`/`alt2.aspmx.l.google.com` (5), `alt3`/`alt4.aspmx.l.google.com` (10) | DNS only | **Google Workspace email.** Never delete these. |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | DNS only | SPF: allows Google to send as @eclipseshield.co.uk |
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=…` | DNS only | DKIM signature for Google Workspace email |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DNS only | DMARC policy (monitoring only) |
| TXT | `resend._domainkey` | `p=MIGfMA0…` | DNS only | DKIM for Resend (quote form emails) |
| CNAME | `send` | `send.forge.rmta.net` | **DNS only** | Resend sending (return path) |
| CNAME | `rsend` | `rsend-euw1.forge.rmta.net` | **DNS only** | Resend sending |
| TXT | `@` | `google-site-verification=…` | DNS only | Google Search Console ownership (if verified by DNS) |

Email-related records must stay **DNS only** (grey cloud). Proxying them breaks email.

## Other Cloudflare settings

- **Redirect Rule** "Redirect from WWW to root": `https://www.…` gets a 301 redirect to `https://eclipseshield.co.uk/…`.
- **SSL/TLS** → **Always Use HTTPS**: on. Minimum TLS 1.2. SSL mode Full.
- **DNSSEC** was turned off at Squarespace for the move. It can optionally be turned back on through Cloudflare: go to **DNS** → **Settings** → **Enable DNSSEC**, then add the DS record Cloudflare shows at Squarespace (**Domains** → **DNSSEC**).

## Before changing email providers or removing records

- Removing the **MX** records stops all email to contact@.
- Removing `send`, `rsend` or `resend._domainkey` stops the quote form emails, because Resend un-verifies the domain.
- If email ever moves away from Google, update the SPF record and the DKIM record to match the new provider.
