// Cloudflare Pages Function: POST /api/quote
// Checks the honeypot and Turnstile, validates the quote request and emails it via Resend.
// Nothing is stored: the email to the business is the only copy.
//
// Environment (Cloudflare Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY        secret, required
//   TURNSTILE_SECRET_KEY  secret, required
//   LEAD_TO               optional, defaults to contact@eclipseshield.co.uk
//   LEAD_FROM             optional, defaults to "Eclipse Shield website <quotes@eclipseshield.co.uk>"
//   EMAIL_DRY_RUN         local development only: "1" skips sending and returns success

import {
  contactMethods,
  interests,
  labelFor,
  photoLimits,
  positions,
  propertyTypes,
  windowTypes,
} from '../../src/data/quote';

interface Env {
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  LEAD_TO?: string;
  LEAD_FROM?: string;
  EMAIL_DRY_RUN?: string;
}

type Ctx = { request: Request; env: Env };

const MAX_BODY_BYTES = 25 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const fail = (status: number, error: string, field?: string, codes?: string[]) =>
  json({ ok: false, error, field, codes }, status);

const text = (fd: FormData, name: string, max = 200) => {
  const v = fd.get(name);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
};

const list = (fd: FormData, name: string, allowed: readonly { value: string }[]) =>
  fd
    .getAll(name)
    .filter((v): v is string => typeof v === 'string' && allowed.some((o) => o.value === v));

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns Cloudflare's error codes on failure (e.g. timeout-or-duplicate, invalid-input-secret).
// They contain no personal data and make misconfiguration easy to spot.
async function verifyTurnstile(token: string, secret: string, ip: string | null) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return { ok: data.success === true, codes: data['error-codes'] ?? [] };
  } catch {
    return { ok: false, codes: ['siteverify-unreachable'] };
  }
}

export const onRequestPost = async ({ request, env }: Ctx) => {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return fail(413, 'The photos are too large. Try fewer photos.');

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return fail(400, 'We couldn’t read the form. Please try again.');
  }

  // Honeypot: real people never fill this in. Pretend it worked so bots learn nothing, but log it
  // (no form contents) so a real quote dropped this way shows up in the Worker logs.
  if (text(fd, 'qf_hp_x')) {
    console.warn('quote: honeypot filled, not sent');
    return json({ ok: true });
  }

  if (!env.TURNSTILE_SECRET_KEY || (!env.RESEND_API_KEY && env.EMAIL_DRY_RUN !== '1')) {
    console.error('quote: missing configuration');
    return fail(503, 'Our form is temporarily unavailable. Please call or email us instead.', undefined, ['config-missing']);
  }

  const token = text(fd, 'cf-turnstile-response', 4096);
  const check = token
    ? await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP'))
    : { ok: false, codes: ['missing-input-response'] };
  if (!check.ok) {
    console.error(`quote: Turnstile failed: ${check.codes.join(', ')}`);
    return fail(400, 'We couldn’t confirm you’re not a robot. Please try again.', 'turnstile', check.codes);
  }

  // Contact details (the only required fields)
  const name = text(fd, 'name', 100);
  const email = text(fd, 'email', 200);
  const phone = text(fd, 'phone', 40);
  const contactMethod = text(fd, 'contact_method', 20);
  if (!name) return fail(400, 'Please enter your name.', 'name');
  if (!EMAIL_RE.test(email)) return fail(400, 'Please enter a valid email address.', 'email');
  if ((contactMethod === 'phone' || contactMethod === 'text') && phone.replace(/\D/g, '').length < 10) {
    return fail(400, 'Please enter a phone number so we can call or text you.', 'phone');
  }
  if (text(fd, 'consent') !== 'yes') return fail(400, 'Please agree to the privacy policy.', 'consent');

  // Optional details
  const propertyType = text(fd, 'property_type', 40);
  const wants = list(fd, 'interests', interests);
  const windowCount = text(fd, 'window_count', 40);
  const windowSize = text(fd, 'window_size', 200);
  const sizeNotSure = text(fd, 'window_size_not_sure') === 'yes';
  const types = list(fd, 'window_types', windowTypes);
  const where = list(fd, 'positions', positions);
  // Tidy UK postcodes: "ch655by" -> "CH65 5BY".
  const rawPostcode = text(fd, 'postcode', 12).toUpperCase().replace(/\s+/g, '');
  const postcode = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(rawPostcode)
    ? `${rawPostcode.slice(0, -3)} ${rawPostcode.slice(-3)}`
    : text(fd, 'postcode', 12).toUpperCase();
  const town = text(fd, 'town', 80);
  const timing = text(fd, 'timing', 20);
  const date = text(fd, 'date', 20);
  const notes = text(fd, 'notes', 3000);
  const source = text(fd, 'source', 200);

  // Photos
  const files = fd.getAll('photos').filter((f): f is File => typeof f !== 'string' && f.size > 0);
  if (files.length > photoLimits.maxFiles) return fail(400, `Please send up to ${photoLimits.maxFiles} photos.`, 'photos');
  let total = 0;
  const attachments: { filename: string; content: string }[] = [];
  for (const [i, f] of files.entries()) {
    if (!f.type.startsWith('image/')) return fail(400, 'Photos must be image files.', 'photos');
    if (f.size > photoLimits.maxBytesEach) return fail(400, 'One of the photos is too large.', 'photos');
    total += f.size;
    if (total > photoLimits.maxBytesTotal) return fail(400, 'The photos are too large in total. Try fewer photos.', 'photos');
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : f.type === 'image/heic' ? 'heic' : 'jpg';
    attachments.push({ filename: `window-photo-${i + 1}.${ext}`, content: toBase64(await f.arrayBuffer()) });
  }

  const timingText = timing === 'date' && date ? `Preferred date: ${date}` : timing === 'flexible' ? 'Flexible' : '';
  const sizeText = windowSize ? (sizeNotSure ? `${windowSize} (not sure)` : windowSize) : sizeNotSure ? 'Not sure' : '';

  const rows: [string, string][] = [
    ['Name', name],
    ['Email', email],
    ['Phone', phone],
    ['Preferred contact', contactMethod ? labelFor(contactMethods, contactMethod) : ''],
    ['Property type', propertyType ? labelFor(propertyTypes, propertyType) : ''],
    ['Interested in', wants.map((w) => labelFor(interests, w)).join(', ')],
    ['Number of windows', windowCount],
    ['Size', sizeText],
    ['Window types', types.map((t) => labelFor(windowTypes, t)).join(', ')],
    ['Position', where.map((p) => labelFor(positions, p)).join(', ')],
    ['Postcode', postcode],
    ['Town', town],
    ['Timing', timingText],
    ['Photos', attachments.length ? `${attachments.length} attached` : 'None'],
    ['Notes', notes],
    ['Sent from', source],
  ];
  const filled = rows.filter(([, v]) => v);

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#16171a">
<h2 style="margin:0 0 12px">New quote request</h2>
<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:15px">
${filled
  .map(
    ([k, v]) =>
      `<tr><th align="left" valign="top" style="border-bottom:1px solid #e2e1dc;white-space:nowrap">${escapeHtml(k)}</th><td style="border-bottom:1px solid #e2e1dc;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="color:#4a4f57;font-size:13px">Reply to this email to answer ${escapeHtml(name)} directly.</p>
</body></html>`;
  const plain = filled.map(([k, v]) => `${k}: ${v}`).join('\n');

  const place = town || postcode;
  const subject = `Quote request: ${name}${place ? `, ${place}` : ''}${propertyType ? ` (${labelFor(propertyTypes, propertyType)})` : ''}`;

  if (env.EMAIL_DRY_RUN === '1') {
    console.log(`quote (dry run): "${subject}", ${filled.length} fields, ${attachments.length} photos, ${total} bytes`);
    return json({ ok: true, dryRun: true });
  }

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.LEAD_FROM || 'Eclipse Shield website <quotes@eclipseshield.co.uk>',
        to: [env.LEAD_TO || 'contact@eclipseshield.co.uk'],
        reply_to: email,
        subject,
        html,
        text: plain,
        attachments: attachments.length ? attachments : undefined,
      }),
    });
  } catch {
    console.error('quote: Resend request failed');
    return fail(502, 'Sorry, your request didn’t send. Please try again, or call or email us.', undefined, ['resend-unreachable']);
  }

  if (!res.ok) {
    // Report Resend's status and error type (e.g. invalid_api_key), never the form contents.
    const detail = (await res.json().catch(() => ({}))) as { name?: string };
    const codes = [`resend-${res.status}`, detail.name].filter((c): c is string => Boolean(c));
    console.error(`quote: Resend error ${codes.join(', ')}`);
    return fail(502, 'Sorry, your request didn’t send. Please try again, or call or email us.', undefined, codes);
  }

  return json({ ok: true });
};

export const onRequest = () => fail(405, 'Method not allowed');
