# Freelance Web Developers — Website

A short, lead-focused, single-page website for an independent web studio in Coimbatore. It is built with plain **HTML, CSS and vanilla JavaScript**: no framework, no build step. It runs on any shared host (cPanel, Hostinger and similar).

**The main hook is the delivery timeline:**

| Build | Typical delivery |
| --- | --- |
| Single-page website / landing page | 1 week |
| Business website (up to 5 pages) | 2 weeks |
| E-commerce and custom builds | 4+ weeks |

## Page structure

| # | Section | What it does |
| --- | --- | --- |
| 1 | **Hero** | Headline, calls to action and an interactive **delivery planner** (tabs with a wireframe preview, timeline bar and call to action) |
| 2 | **About** | Two lines about the studio, plus "Who we work with" tags |
| 3 | **Services** | Interactive tabs for five services, each with its delivery time |
| 4 | **Our Work** | Swipeable **carousel** of concept projects with previous/next buttons, a counter and a progress bar |
| 5 | **Offer** | "3 months free basic maintenance" voucher. The exclusions sit in an expandable "What's not included" |
| 6 | **Contact** | Contact details and a short form with tap-to-select services. It sends to WhatsApp |

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole page, SEO tags and structured data |
| `style.css` | All styles. Colours, type and spacing are variables in `:root` |
| `script.js` | All behaviour. **Your business details go in `SITE_CONFIG` at the top** |
| `privacy.html` | Short privacy notice, linked from the form and the footer |
| `robots.txt` / `sitemap.xml` | Search engine files |
| `favicon.svg` / `og-image.png` | Browser icon and social sharing image |

## Run locally

- **XAMPP:** open `http://localhost/freelance/`
- **Any folder:** run `python -m http.server 8000`, then open `http://localhost:8000/`
- Or double-click `index.html`

Fonts and photos load from Google Fonts and Unsplash, so you need an internet connection.

## Before launch

1. **Add your details** in `script.js` › `SITE_CONFIG`:
   - `whatsappNumber`: digits only, country code first (for example `919876543210`). **Required for the form.**
   - `phoneNumber` (for example `'+91 98765 43210'`), `email`, `instagramUrl`, `portfolioUrl`
   - Empty values stay hidden, so the site never shows a broken link.
2. **Set your domain.** Replace `https://www.example.com` in:
   - `index.html`: canonical, `og:url`, `og:image` and the JSON-LD block
   - `privacy.html`: canonical
   - `robots.txt`
   - `sitemap.xml`
   - `SITE_CONFIG.siteUrl`
3. **Review `privacy.html`** so it matches how you actually work.
4. **Test the form** (see below) on a phone and on a desktop.

## Common edits

- **Delivery timelines:** in `index.html`, find the `planner__panel` blocks in the hero and the `svc__panel` blocks in Services. Change the `<strong>1 week</strong>` text, the scope list, and the bar length (`style="--fill: 25%"` on a 4-week scale: 25% = 1 week, 50% = 2 weeks, 100% = 4+ weeks).
- **Services:** each service is one tab button (`svc__tab`) plus one panel (`svc__panel`). Keep their `id` and `aria-controls` values paired.
- **Form service options:** the radio buttons under "What do you need?". Any call-to-action with a matching `data-service="…"` value pre-selects that option.
- **Portfolio:** each carousel slide is an `<article class="slide project" data-project="…">`. The six projects are **concepts**, labelled "Concept Project". Do not present them as client work. To show real work:
  - add `url`, `status: 'live'` and accurate `tech` labels in `SITE_CONFIG.projects`;
  - swap the slide's mockup for a screenshot `<img>`, with `width`, `height` and `alt` set.

  A "View Project" link appears only when a valid URL is set.
- **Colours and fonts:** edit the variables at the top of `style.css`. Buttons use `#C44D35`, a slightly deeper terracotta than the brand `#D95A41`, so white button text meets WCAG AA contrast.

## How the form works

- **WhatsApp (default, no backend):** the form validates, builds a readable message and opens `https://wa.me/<number>`. The visitor taps Send in WhatsApp. A short status message confirms the next step, with a fallback link.
- **Email fallback:** if `email` is set, a "Send a Project Enquiry" button opens the visitor's email app with the enquiry pre-filled.
- **Form service (optional):** set `formEndpoint` to an HTTPS form URL (for example Formspree). The secondary button then posts the form there and shows a real success or error result. Never put secret keys in `script.js`. If you write your own endpoint, validate and sanitise everything on the server.

### Test the lead flow

1. Set `whatsappNumber` to a number you control.
2. Submit the form empty. You should see inline errors for name, service and project details, and focus moves to the first one.
3. Fill it in and submit:
   - **Phone:** WhatsApp opens with the message ready.
   - **Desktop:** WhatsApp Web opens in a new tab.
4. Click any "Start…" or "Discuss…" button. The matching service chip in the form should be selected.

## Upload to cPanel / Hostinger

1. Zip the website files: `index.html`, `style.css`, `script.js`, `privacy.html`, `robots.txt`, `sitemap.xml`, `favicon.svg` and `og-image.png`.
2. Open **File Manager** › `public_html` › upload the zip › **Extract**. Make sure `index.html` sits directly in `public_html`.
3. Turn on the free SSL and force HTTPS.
4. Submit `https://yourdomain.com/sitemap.xml` in Google Search Console.

## Images

Photos are from Unsplash (free under the Unsplash License) and are used as concept references. To self-host them, download each one, convert it to WebP, put it in `images/` and update the `src` attributes. Photo IDs used:

- **About:** `1581291518857-4e27b48ff24e`, `1547658719-da2b51169166`
- **Work:**
  - Bakery: `1555507036-ab1f4038808a`
  - Corporate: `1504307651254-35680f356dfd`
  - Catalogue: `1523381210434-271e8be1f52b`
  - Salon: `1600948836101-f9ffda59d250`
  - Coffee: `1447933601403-0c6688de566e`
  - Store: `1524758631624-e2822e304c36`

URL pattern: `https://images.unsplash.com/photo-<ID>?auto=format&fit=crop&w=<w>&h=<h>&q=75`

## Accessibility and motion

- Tabs follow the ARIA tabs pattern (arrow keys, Home and End). The carousel works with swipe, buttons and the arrow keys when it has focus.
- The form uses real labels, and its error messages use text and an icon (not colour alone). Service chips are native radio buttons.
- `prefers-reduced-motion` turns off all animation. Without JavaScript, every tab panel stays visible.

## What was tested

- No horizontal overflow and no clipped text at 360, 390, 430, 768, 1024, 1440 and 1920px. Visual review at 360px, 700px, 1280px and 1440px.
- Chrome interaction tests:
  - planner and service tabs, by click and keyboard
  - carousel buttons, counter and end state
  - call-to-action → form service pre-selection
  - form validation, including the radio chips
  - WhatsApp message encoding
- No console errors.

**Not run:** Lighthouse, the W3C validator, real devices, and browsers other than Chrome.
