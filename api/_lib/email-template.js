/* Enquiry notification email, styled like the website: oatmeal canvas,
 * warm-white card, espresso text, terracotta accents, pill buttons and the
 * espresso footer band. Table layout + inline styles so it renders the same
 * in Gmail, Outlook and Apple Mail. The logo is attached inline (CID), so it
 * shows even when the mail app blocks remote images.
 *
 * Files in api/_lib are helpers, not endpoints (Vercel skips "_" folders).
 */
import { readFileSync } from 'node:fs';

const C = {
  canvas: '#f7f4ef', surface: '#fffefc', subtle: '#e9e1d7', accentSubtle: '#f6e1d9',
  text: '#2e2724', secondary: '#746861', border: '#ded5ca',
  brand: '#d95a41', accent: '#c04a32', accentText: '#a8402b', darkSecondary: '#b8aca2',
};
const SANS = "'DM Sans','Segoe UI',Helvetica,Arial,sans-serif";
const DISPLAY = "Manrope,'Segoe UI',Helvetica,Arial,sans-serif";
const LOGO_CID = 'logo@freelancecentre.online';
const SITE = 'freelancecentre.online';

let logo;
function logoAttachment() {
  try {
    logo = logo || readFileSync(new URL('./logo-email.png', import.meta.url));
    return { filename: 'freelance-web-developers.png', content: logo, cid: LOGO_CID, contentType: 'image/png', contentDisposition: 'inline' };
  } catch {
    return null; // fall back to the text wordmark
  }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 98765 43210 -> 919876543210 (India by default), for wa.me and tel: links
function intlDigits(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = '91' + d;
  return d;
}

function label(text) {
  return `<p style="margin:0 0 12px;font-family:${SANS};font-size:13px;line-height:16px;font-weight:500;letter-spacing:1.56px;text-transform:uppercase;color:${C.secondary};">${esc(text)}</p>`;
}

function tag(text, accent) {
  const style = accent
    ? `background:${C.accentSubtle};color:${C.accentText};border:1px solid ${C.accentSubtle};`
    : `background:${C.surface};color:${C.text};border:1px solid ${C.border};`;
  return `<span style="display:inline-block;margin:0 6px 8px 0;padding:4px 12px;border-radius:999px;${style}font-family:${SANS};font-size:12px;line-height:16px;font-weight:500;letter-spacing:0.72px;text-transform:uppercase;white-space:nowrap;">${accent ? `<span style="color:${C.brand};">&#9679;</span>&nbsp; ` : ''}${esc(text)}</span>`;
}

function button(href, text, primary) {
  const box = primary
    ? `background:${C.accent};border:1px solid ${C.accent};color:#fffefc;`
    : `background:${C.surface};border:1px solid ${C.text};color:${C.text};`;
  return `<a href="${esc(href)}" target="_blank" style="display:inline-block;margin:0 8px 10px 0;padding:12px 22px;border-radius:999px;${box}font-family:${SANS};font-size:15px;line-height:20px;font-weight:500;text-decoration:none;">${esc(text)}&nbsp;&nbsp;&rarr;</a>`;
}

/**
 * @param {object} v       validated values from api/enquiry.js
 * @param {string} service human-readable service name
 * @returns {{subject:string,text:string,html:string,attachments:object[]}}
 */
export function renderEnquiryEmail(v, service) {
  const firstName = v.name.split(' ')[0];
  const subject = `Project enquiry: ${service} — ${v.name}`.replace(/\s+/g, ' ').slice(0, 180);
  const received = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
  const digits = intlDigits(v.phone);

  // Quick replies, preferred method first (and in terracotta)
  const actions = [];
  if (v.email) actions.push({ key: 'Email', href: `mailto:${v.email}?subject=${encodeURIComponent('Re: ' + subject)}`, text: 'Reply by email' });
  if (digits) {
    const hello = `Hi ${firstName}, thank you for your enquiry about ${service} on our website.`;
    actions.push({ key: 'WhatsApp', href: `https://wa.me/${digits}?text=${encodeURIComponent(hello)}`, text: 'WhatsApp ' + firstName });
    actions.push({ key: 'Phone call', href: `tel:+${digits}`, text: 'Call ' + firstName });
  }
  actions.sort((a, b) => (b.key === v.contactPref) - (a.key === v.contactPref));
  const buttons = actions.map((a, i) => button(a.href, a.text, i === 0)).join('');

  const link = (href, textValue) => `<a href="${esc(href)}" style="color:${C.accentText};text-decoration:underline;">${esc(textValue)}</a>`;
  // [label, plain-text value, HTML value]
  const fields = [
    ['Name', v.name],
    ['Business', v.business],
    ['Email', v.email, v.email && link('mailto:' + v.email, v.email)],
    ['Phone / WhatsApp', v.phone, v.phone && link('tel:+' + digits, v.phone)],
    ['Service', service],
    ['Budget', v.budget],
    ['Prefers', v.contactPref],
    ['Received', received],
  ].filter(([, value]) => value);
  const table = fields.map(([k, plain, rich], i) => [k, rich || esc(plain), i]).map(([k, val, i]) => `<tr>
      <td class="lbl" valign="top" style="padding:12px 16px 12px 0;${i ? `border-top:1px solid ${C.border};` : ''}width:140px;font-family:${SANS};font-size:15px;line-height:24px;color:${C.secondary};">${k}</td>
      <td valign="top" style="padding:12px 0;${i ? `border-top:1px solid ${C.border};` : ''}font-family:${SANS};font-size:15px;line-height:24px;color:${C.text};word-break:break-word;">${val}</td>
    </tr>`).join('');

  const att = logoAttachment();
  const brand = att
    ? `<img src="cid:${LOGO_CID}" width="220" height="48" alt="Freelance Web Developers" style="display:block;width:220px;height:auto;border:0;outline:none;text-decoration:none;">`
    : `<span style="font-family:${DISPLAY};font-size:20px;line-height:24px;font-weight:600;color:${C.text};">Freelance Web Developers<span style="color:${C.brand};">.</span></span>`;
  const preheader = [v.name, service, v.budget, 'prefers ' + v.contactPref].filter(Boolean).join(' · ');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&family=Manrope:wght@500;600&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; background: ${C.canvas}; }
  a { color: ${C.accentText}; }
  @media (max-width: 620px) {
    .px { padding-left: 22px !important; padding-right: 22px !important; }
    .h1 { font-size: 24px !important; line-height: 30px !important; }
    .meta { display: none !important; }
    .lbl { width: 96px !important; padding-right: 12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.canvas};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.canvas};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.canvas}" style="background:${C.canvas};">
<tr><td align="center" style="padding:32px 12px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

    <tr><td style="padding:0 4px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle">${brand}</td>
        <td class="meta" valign="middle" align="right" style="font-family:${SANS};font-size:13px;line-height:18px;color:${C.secondary};">Website enquiry</td>
      </tr></table>
    </td></tr>

    <tr><td bgcolor="${C.surface}" style="background:${C.surface};border:1px solid ${C.border};border-radius:4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="px" style="padding:36px 40px 4px;">
          <p style="margin:0 0 16px;font-family:${SANS};font-size:13px;line-height:16px;font-weight:500;letter-spacing:1.56px;text-transform:uppercase;color:${C.secondary};"><span style="color:${C.brand};">&#9679;</span>&nbsp; New project enquiry</p>
          <h1 class="h1" style="margin:0 0 12px;font-family:${DISPLAY};font-size:30px;line-height:38px;font-weight:500;letter-spacing:-0.5px;color:${C.text};">${esc(v.name)} would like to discuss ${esc(service)}<span style="color:${C.brand};">.</span></h1>
          <p style="margin:0 0 18px;font-family:${SANS};font-size:17px;line-height:28px;color:${C.secondary};">Sent from the contact form on ${SITE}. Replying to this email goes straight to ${esc(firstName)}.</p>
          <div>${tag(service)}${v.budget ? tag(v.budget) : ''}${tag('Prefers ' + v.contactPref, true)}</div>
        </td></tr>

        ${buttons ? `<tr><td class="px" style="padding:18px 40px 8px;">${buttons}</td></tr>` : ''}

        <tr><td class="px" style="padding:24px 40px 0;">
          ${label('Contact details')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.text};">${table}</table>
        </td></tr>

        <tr><td class="px" style="padding:32px 40px 0;">
          ${label('Project description')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td bgcolor="${C.canvas}" style="background:${C.canvas};border-left:3px solid ${C.brand};border-radius:4px;padding:20px 24px;font-family:${SANS};font-size:17px;line-height:28px;color:${C.text};white-space:pre-wrap;word-break:break-word;">${esc(v.message)}</td>
          </tr></table>
        </td></tr>

        <tr><td class="px" style="padding:24px 40px 36px;font-family:${SANS};font-size:13px;line-height:18px;color:${C.secondary};">
          <span style="color:${C.brand};">&#9679;</span>&nbsp; The website tells visitors we usually reply within one working day.
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding-top:16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.text}" style="background:${C.text};border-radius:4px;">
        <tr><td class="px" style="padding:28px 40px;">
          <p style="margin:0 0 10px;font-family:${DISPLAY};font-size:22px;line-height:28px;font-weight:500;letter-spacing:-0.4px;color:${C.canvas};">Your Business.<br>Our Digital Solutions<span style="color:${C.brand};">.</span></p>
          <p style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.darkSecondary};">Freelance Web Developers · Coimbatore, Tamil Nadu, India<br>This email contains a customer’s personal details. Please keep it within the team.</p>
        </td></tr>
      </table>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `NEW PROJECT ENQUIRY — ${SITE}`,
    '',
    `${v.name} would like to discuss ${service}.`,
    '',
    ...fields.map(([k, plain]) => `${k}: ${plain}`),
    '',
    'Project description:',
    v.message,
    '',
    'Reply to this email to answer the visitor directly.',
    '— Freelance Web Developers · Your Business. Our Digital Solutions.',
  ].join('\n');

  return { subject, text, html, attachments: att ? [att] : [] };
}
