# Freelance Web Developers — Website

The multi-page website for an independent digital solutions studio in Coimbatore, built from the Figma file **FW-dev** (Home, Pages — Core and Pages — Services). It is plain **HTML, CSS and vanilla JavaScript** with no framework and nothing to install, so it runs on any shared host (cPanel, Hostinger and similar).

Live domain: `https://freelancecentre.online`

## Pages

| URL | Page |
| --- | --- |
| `/` | Home |
| `/about/` | About |
| `/services/` | Services overview, service finder, timeline planner |
| `/services/website-development/` | Website Development |
| `/services/seo-services/` | SEO Services |
| `/services/local-seo/` | Local SEO & Google Business Profile |
| `/services/social-media-marketing/` | Social Media Marketing |
| `/services/graphic-design/` | Graphic Design |
| `/services/branding-reputation/` | Branding & Reputation |
| `/services/ecommerce-marketing/` | E-commerce Marketing |
| `/services/analytics-tracking/` | Analytics & Tracking |
| `/work/` | Our Work (filterable concept projects) |
| `/work/morning-crumb/` | Case study (concept) |
| `/industries/` | Industries |
| `/contact/` | Contact and enquiry form |
| `/privacy-policy/` | Privacy Policy (`/privacy.html` redirects here) |

Every page shares the same header (desktop nav with a Services mega menu; mobile drawer), footer and, on phones, a sticky Call / WhatsApp / Enquire bar.

## Files

| Path | Purpose |
| --- | --- |
| `*/index.html` | One folder per page, so URLs end in `/` |
| `assets/css/site.css` | All styles. Design tokens (colours, type, spacing) are custom properties at the top |
| `assets/js/site.js` | All behaviour: header, menus, slideshow, carousels, service finder, planner tabs, FAQ, portfolio filters, enquiry form, on-this-page highlighting |
| `assets/icons/` | Icon SVGs exported from Figma (Lucide / Simple Icons) |
| `assets/img/` | Logos and photos exported from Figma |
| `favicon.ico`, `apple-touch-icon.png`, `og-image.png` | Browser icons and the social sharing image |
| `sitemap.xml`, `robots.txt` | Search engine files (generated) |
| `api/enquiry.js` | Vercel serverless function that emails enquiries through Gmail SMTP |
| `api/_lib/email-template.js` | The branded enquiry email (site colours, text logo, one-tap WhatsApp / email / call replies) |
| `package.json`, `package-lock.json` | The function's one dependency (`nodemailer`, pinned) |
| `vercel.json` | Function timeout and security headers |
| `.env.example` | Names of the environment variables (placeholders only, never real values) |
| `tools/site-generator/` | Optional page generator (see below). Not deployed |
| `tools/dev-server.mjs` | Local preview that also runs the enquiry function. Not deployed |

## Preview locally

- **With the enquiry form working:** run `node tools/dev-server.mjs`, then open `http://localhost:3000/`. By default it is a dry run: the email is printed in the terminal and nothing is sent.
- **Any folder:** run `python -m http.server 8000` in this folder, then open `http://localhost:8000/` (the form's "Send enquiry" will show its error message, because there is no `/api` here)
- **XAMPP:** put the folder in `htdocs` and open `http://localhost/freelance/`
- **Double-click `index.html`:** also works. Icons are embedded in the CSS, and a small script points folder links at `index.html` when a page is opened from disk.

Fonts load from Google Fonts, so previews need an internet connection.

## Editing pages

The header, footer and repeated blocks are identical on every page, so the pages are assembled by a small Python script instead of being edited one by one:

```
python tools/site-generator/build.py
```

- Page bodies live in `tools/site-generator/pages/*.html`. Service pages are built from the data in `content_services.py`.
- Shared copy (services list, concept projects, industries, FAQs, contact details) lives at the top of `build.py` and in `content.py`.
- The script rewrites every `index.html`, `sitemap.xml` and `robots.txt`, and re-embeds the icons in `site.css`. Edit CSS and JS directly in `assets/`.

Small text fixes can also be made straight in the HTML files. They will be overwritten the next time the generator runs, unless you make the same change in its sources.

## Enquiry form

- **Send enquiry:** posts the form as JSON to `/api/enquiry`, a Vercel serverless function (`api/enquiry.js`). It validates everything again and emails the enquiry to your Gmail inbox. The visitor sees "Thank you" only after the email has actually been sent.
- **Send via WhatsApp instead:** opens `wa.me/919500785451` with a summary of the form. The visitor presses Send in WhatsApp.
- `contact/?service=<slug>` pre-selects the service. Service pages, the service finder and the timeline planner link this way.

### Connect your Gmail (one-time setup)

Your Gmail login is stored only in Vercel's encrypted environment variables. It is never in the code, the repository or anything a visitor's browser downloads.

1. **Turn on 2-Step Verification** for the Google account: Google Account › Security › 2-Step Verification. App passwords need it.
2. **Create an App Password:** Google Account › Security › App passwords (or go to `myaccount.google.com/apppasswords`). Name it "Website enquiries". Google shows a 16-character password once; copy it. **Do not use your normal Gmail password.** An App Password can only send mail, and you can revoke it at any time without changing your main password.
3. **Add it to Vercel:** Project › Settings › Environment Variables. Add these for **Production** (and Preview if you test there), and tick **Sensitive**:

   | Name | Value |
   | --- | --- |
   | `GMAIL_USER` | the Gmail address that sends the mail |
   | `GMAIL_APP_PASSWORD` | the 16-character App Password (spaces optional) |
   | `MAIL_TO` | the inbox(es) that receive enquiries, separated by commas (for example `first@gmail.com, second@gmail.com`); defaults to `GMAIL_USER` |
   | `MAIL_FROM_NAME` | optional: sender name shown in the inbox; defaults to `Freelance Web Developers` |

4. **Redeploy** (Deployments › ⋯ › Redeploy). Environment variables only apply to new deployments.
5. **Test:** send an enquiry from `/contact/`. It arrives from "Freelance Web Developers", and **Reply** goes straight to the visitor.

### If enquiries land in Spam

Gmail is cautious with a new automated sender. Do this once **in each receiving inbox**:

1. Open the enquiry in **Spam** and click **Report not spam** (or **Looks safe**).
2. Add the sending address (your company Gmail) to **Google Contacts**.
3. Create a filter: Settings (gear) › See all settings › **Filters and Blocked Addresses** › **Create a new filter** › **From:** the company Gmail address › **Create filter** › tick **Never send it to Spam** (optionally also **Always mark it as important**) › **Create filter**.

The filter is the permanent fix: Gmail will never route these enquiries to Spam again. The email itself is already kept spam-friendly: Gmail signs it (SPF and DKIM pass, because it goes through Google's own servers), and it has a plain-text part, no images, attachments, hidden text or external stylesheets.

If the App Password is ever exposed, revoke it in Google (App passwords › delete), create a new one and update the Vercel variable. Never paste credentials into `site.js`, the HTML, `vercel.json` or a committed `.env` file.

To test real sending on your own computer, copy `.env.example` to `.env.local` (git-ignored), fill it in and run `node --env-file=.env.local tools/dev-server.mjs`.

### How the endpoint is protected

- Accepts only `POST` with a JSON body under 16 KB, and only from your own site's origin. Extra origins can be added in `ALLOWED_ORIGINS`.
- Every field is checked again on the server: lengths, email and phone format, consent, and service and budget against a fixed list.
- Line breaks and control characters are stripped from anything that reaches an email header, so the form can't be used to add recipients. The message is HTML-escaped.
- Mail goes only to your inbox. The visitor's address is used only as Reply-To, so the form can't be used to send email to other people.
- A hidden honeypot field and a minimum fill time quietly drop simple bots. There's also a basic limit of 5 enquiries per 10 minutes per IP. For stronger protection, add a rate-limit rule in Vercel › Firewall.
- Errors return a generic message. The server log records only the SMTP error code, never credentials or the visitor's details.
- Uses Gmail's SMTP over TLS (`smtp.gmail.com:465`). Gmail allows about 500 messages a day from a personal account, which is far more than a contact form needs.

## Before launch

1. Check the contact details in `build.py` (`TEL_MAIN`, `TEL_CALLS`, `EMAIL`, `LINKEDIN`, `WA_CHANNEL`) and rebuild if they change.
2. Review the Privacy Policy so it matches how you actually work (it names Vercel and Gmail).
3. "Usually replies within one working day" appears on every enquiry banner. Keep it only if you can meet it.
4. **Deploy on Vercel:** import the Git repository (or run `vercel` in this folder). Framework preset: **Other**. Leave the build command empty and the output directory as the project root. `.vercelignore` keeps `tools/` and other local files out of the deployment.
5. Connect your Gmail (see above), redeploy and send a test enquiry.
6. Add the domain `freelancecentre.online` in Vercel › Domains.
7. Submit `https://freelancecentre.online/sitemap.xml` in Google Search Console.

## Content rules from the design

- The six portfolio projects are **concepts** and are always labelled "Concept project". Do not present them as client work. Results appear only for real, permissioned work with a measured source.
- Third-party costs (domains, hosting, ad spend, marketplace fees, printing) are always stated as separate from the studio's fees.

## Accessibility

- Skip link, visible focus rings, ARIA tabs (arrow keys, Home and End), disclosure FAQs and menus, and a focus-trapped mobile drawer.
- Form errors use an icon and text, are linked with `aria-describedby`, and move focus to the first invalid field.
- `prefers-reduced-motion` stops the slideshow, marquee and scroll effects.

## Tested

- Every page at 1440px and 390px: no horizontal overflow, no failed requests, no console errors.
- All internal links and `#anchors` resolve. Every icon class has a definition.
- Navigation works over `http://` and when opened from disk.
- Enquiry form: validation, live re-validation, WhatsApp message, character counter and service pre-selection.
- Enquiry function: 21 automated checks covering wrong method or content type, foreign origin, malformed or oversized body, field validation, header-injection attempts, HTML escaping, honeypot, too-fast submissions, rate limiting, missing credentials and SMTP failure. Also a browser run of the full form with the local dev server.

**Not run:** Lighthouse, the W3C validator, real devices, and browsers other than Chrome.
