/* POST /api/enquiry — Vercel serverless function (Node.js).
 *
 * Receives the contact form as JSON, validates it again on the server and
 * emails it to the studio inbox through Gmail SMTP. The Gmail login lives only
 * in Vercel environment variables; nothing secret is ever sent to the browser.
 *
 * Environment variables (Vercel › Project › Settings › Environment Variables):
 *   GMAIL_USER          the Gmail address that sends the mail
 *   GMAIL_APP_PASSWORD  a 16-character Google App Password (not the account password)
 *   MAIL_TO             optional; inbox(es) that receive enquiries, comma-separated
 *                       (defaults to GMAIL_USER)
 *   ALLOWED_ORIGINS     optional; extra comma-separated origins allowed to post
 *   MAIL_DRY_RUN        optional; "1" builds the email without sending (local testing)
 *
 * The visitor's address is used only as Reply-To. The function never emails the
 * visitor, so it cannot be used to send mail to arbitrary people.
 */
import nodemailer from 'nodemailer';
import { renderEnquiryEmail } from './_lib/email-template.js';

// Keep in sync with SERVICES and BUDGETS in tools/site-generator/build.py / content.py
const SERVICES = {
  'website-development': 'Website Development',
  'seo-services': 'SEO Services',
  'local-seo': 'Local SEO & Google Business Profile',
  'social-media-marketing': 'Social Media Marketing',
  'graphic-design': 'Graphic Design',
  'branding-reputation': 'Branding & Reputation',
  'ecommerce-marketing': 'E-commerce Marketing',
  'analytics-tracking': 'Analytics & Tracking',
  help: 'Not sure — help me choose',
};
const BUDGETS = ['Under ₹5,000', '₹5,000–₹10,000', '₹10,000–₹25,000', '₹25,000+', 'Not sure yet'];
const CONTACT_PREFS = ['WhatsApp', 'Phone call', 'Email'];

const MAX_BODY_BYTES = 16 * 1024;
const MIN_FILL_MS = 3000;
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

// Best-effort, per-instance limiter. Serverless instances do not share memory,
// so use Vercel Firewall rate limiting as well for stronger protection.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

let transporter;
function getTransporter() {
  if (process.env.MAIL_DRY_RUN === '1') return nodemailer.createTransport({ jsonTransport: true });
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // TLS from the first byte
      // Google shows App Passwords as four groups of four; spaces are not part of it
      auth: { user: process.env.GMAIL_USER.trim(), pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporter;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) throw Object.assign(new Error('too_large'), { status: 413 });
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw Object.assign(new Error('too_large'), { status: 413 });
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('shape');
    return data;
  } catch {
    throw Object.assign(new Error('bad_json'), { status: 400 });
  }
}

// Collapse whitespace; strip control characters (including CR/LF, which could
// otherwise be used to inject extra email headers).
const oneLine = (v) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
const multiLine = (v) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim();

function validate(body) {
  const v = {
    name: oneLine(body.name),
    business: oneLine(body.business),
    email: oneLine(body.email).toLowerCase(),
    phone: oneLine(body.phone),
    service: oneLine(body.service),
    budget: oneLine(body.budget),
    message: multiLine(body.message),
    contactPref: oneLine(body.contact_pref) || 'WhatsApp',
    consent: body.consent === true || body.consent === 'yes',
  };
  const errors = [];
  if (v.name.length < 2 || v.name.length > 100) errors.push('name');
  if (v.business.length > 120) errors.push('business');
  if (v.email && (v.email.length > 160 || !EMAIL_RE.test(v.email))) errors.push('email');
  if (v.phone) {
    const digits = v.phone.replace(/\D/g, '').length;
    if (/[^\d\s+().-]/.test(v.phone) || digits < 10 || digits > 13 || v.phone.length > 20) errors.push('phone');
  }
  if (!v.email && !v.phone) errors.push('email');
  if (!Object.hasOwn(SERVICES, v.service)) errors.push('service');
  if (v.budget && !BUDGETS.includes(v.budget)) errors.push('budget');
  if (v.message.length < 15 || v.message.length > 2000) errors.push('message');
  if (!CONTACT_PREFS.includes(v.contactPref)) errors.push('contact_pref');
  if (!v.consent) errors.push('consent');
  return { values: v, errors: [...new Set(errors)] };
}

// MAIL_TO may list several inboxes, separated by commas or semicolons.
// Invalid entries are skipped (and logged) so one typo cannot block delivery.
function parseRecipients(value) {
  const list = [];
  for (const raw of String(value || '').split(/[,;]/)) {
    const address = raw.trim().toLowerCase();
    if (!address) continue;
    if (EMAIL_RE.test(address)) { if (!list.includes(address)) list.push(address); }
    else console.error('[enquiry] ignoring invalid MAIL_TO entry');
  }
  return list.slice(0, 10);
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin form posts from some browsers omit it
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  if (host === req.headers.host) return true;
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  if (!originAllowed(req)) return send(res, 403, { ok: false, error: 'forbidden' });
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return send(res, 415, { ok: false, error: 'unsupported_media_type' });
  }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return send(res, 429, { ok: false, error: 'too_many_requests' });

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return send(res, err.status || 400, { ok: false, error: err.message === 'too_large' ? 'too_large' : 'bad_request' });
  }

  // Bot traps: hidden honeypot field, or a form filled faster than a person can.
  // Answer as if it worked so bots get no signal, but send nothing.
  const elapsed = Number(body.elapsed_ms);
  if (oneLine(body.company_website) || (Number.isFinite(elapsed) && elapsed < MIN_FILL_MS)) {
    return send(res, 200, { ok: true });
  }

  const { values, errors } = validate(body);
  if (errors.length) return send(res, 400, { ok: false, error: 'invalid', fields: errors });

  if (process.env.MAIL_DRY_RUN !== '1' && (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)) {
    console.error('[enquiry] GMAIL_USER or GMAIL_APP_PASSWORD is not set');
    return send(res, 500, { ok: false, error: 'not_configured' });
  }

  const sender = (process.env.GMAIL_USER || 'dry-run@example.com').trim();
  const recipients = parseRecipients(process.env.MAIL_TO);
  const { subject, text, html, attachments } = renderEnquiryEmail(values, SERVICES[values.service]);
  try {
    const info = await getTransporter().sendMail({
      from: { name: 'Website enquiry', address: sender },
      to: recipients.length ? recipients : sender,
      replyTo: values.email ? { name: values.name, address: values.email } : undefined,
      subject,
      text,
      html,
      attachments,
    });
    if (process.env.MAIL_DRY_RUN === '1') return send(res, 200, { ok: true, dryRun: true, message: JSON.parse(info.message) });
    return send(res, 200, { ok: true });
  } catch (err) {
    // Log the SMTP error code only: no credentials, no visitor data.
    console.error('[enquiry] send failed:', err && (err.code || err.responseCode || err.name));
    return send(res, 502, { ok: false, error: 'send_failed' });
  }
}
