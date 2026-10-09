/* ==========================================================================
   Freelance Web Developers — script.js
   Vanilla JavaScript, no dependencies. Loaded with `defer`.

   1. Site configuration  ← edit this before launch
   2. Helpers
   3. Contact details & footer year
   4. Header, mobile navigation & scroll state
   5. Tabs (delivery planner + services)
   6. Work carousel
   7. Portfolio links
   8. Scroll reveals
   9. Lead form (WhatsApp + optional email / form endpoint)
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. SITE CONFIGURATION
   --------------------------------------------------------------------------
   Replace the empty strings with your real details before launch.
   Anything left empty is hidden automatically, so the site never shows a
   placeholder link that leads nowhere. Never put passwords, API secrets or
   private keys in this file — everything here is public.
   -------------------------------------------------------------------------- */
const SITE_CONFIG = {
  businessName: 'Freelance Web Developers',

  // WhatsApp number in international format, DIGITS ONLY: country code first,
  // no "+", spaces, dashes or leading zero. Indian example format: '919876543210'.
  // Required for the WhatsApp enquiry form to work.
  whatsappNumber: '',

  // Phone number exactly as you want it displayed, e.g. '+91 98765 43210'.
  phoneNumber: '',

  // Professional email address, e.g. 'hello@yourdomain.com'.
  email: '',

  // Final production URL (no trailing slash). Also update index.html,
  // privacy.html, sitemap.xml and robots.txt — see README.md.
  siteUrl: 'https://www.example.com',

  // Full profile URLs (https://…). Leave empty if you don't have one yet.
  instagramUrl: '',   // e.g. 'https://www.instagram.com/yourhandle/'
  portfolioUrl: '',   // GitHub or portfolio, e.g. 'https://github.com/yourname'

  // OPTIONAL: an HTTPS form-service endpoint (e.g. a Formspree form URL) that
  // emails you the enquiry. When set, a "Send a Project Enquiry" button posts
  // the form there. Public form IDs are fine here; secret keys are not.
  formEndpoint: '',

  // Portfolio items, keyed by the data-project attribute in index.html.
  //   url    — add ONLY when a genuine, working page exists (shows "View Project").
  //   status — 'concept' (label "Concept Project") or 'live' (label "Live Project").
  //   tech   — technology labels, only if accurate, e.g. ['HTML', 'CSS', 'JavaScript'].
  projects: {
    bakery:       { url: '', status: 'concept', tech: [] },
    corporate:    { url: '', status: 'concept', tech: [] },
    catalogue:    { url: '', status: 'concept', tech: [] },
    localService: { url: '', status: 'concept', tech: [] },
    brandLanding: { url: '', status: 'concept', tech: [] },
    ecommerce:    { url: '', status: 'concept', tech: [] }
  }
};

/* --------------------------------------------------------------------------
   2. HELPERS
   -------------------------------------------------------------------------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());

// Returns a normalised http(s) URL, or '' for anything else (blocks javascript: etc.)
function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch (error) {
    return '';
  }
}

// Create an element with attributes and text, without using innerHTML
function el(tag, attrs = {}, text = '') {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}

function newTabHint() {
  return el('span', { class: 'visually-hidden' }, ' (opens in a new tab)');
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Validated contact links derived from SITE_CONFIG
function getContactLinks(config) {
  const links = {};

  const wa = digitsOnly(config.whatsappNumber);
  if (wa.length >= 8 && wa.length <= 15) {
    const phoneMatches = digitsOnly(config.phoneNumber) === wa;
    links.whatsapp = { href: `https://wa.me/${wa}`, text: phoneMatches ? config.phoneNumber.trim() : `+${wa}`, external: true };
  }

  const tel = String(config.phoneNumber || '').trim().replace(/[^\d+]/g, '');
  if (digitsOnly(tel).length >= 6) {
    links.phone = { href: `tel:${tel}`, text: config.phoneNumber.trim() };
  }

  if (isValidEmail(config.email)) {
    const email = config.email.trim();
    links.email = { href: `mailto:${email}`, text: email };
  }

  const instagram = safeUrl(config.instagramUrl);
  if (instagram) {
    const handle = new URL(instagram).pathname.split('/').filter(Boolean)[0];
    links.instagram = { href: instagram, text: handle ? `@${handle}` : 'Instagram', external: true };
  }

  const portfolio = safeUrl(config.portfolioUrl);
  if (portfolio) {
    links.portfolio = { href: portfolio, text: portfolio.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), external: true };
  }

  return links;
}

/* --------------------------------------------------------------------------
   3. CONTACT DETAILS & FOOTER YEAR
   -------------------------------------------------------------------------- */
function initContactDetails(links) {
  $$('[data-contact]').forEach((item) => {
    const data = links[item.dataset.contact];
    const link = $('[data-contact-link]', item);
    if (!data || !link) return;

    link.href = data.href;
    link.textContent = (link.dataset.label ? `${link.dataset.label}: ` : '') + data.text;
    if (data.external) link.append(newTabHint());
    item.hidden = false;
  });
}

function initYear() {
  const year = String(new Date().getFullYear());
  $$('[data-year]').forEach((node) => { node.textContent = year; });
}

/* --------------------------------------------------------------------------
   4. HEADER, MOBILE NAVIGATION & SCROLL STATE
   -------------------------------------------------------------------------- */
function initNavigation() {
  const header = $('[data-header]');
  const toggle = $('[data-nav-toggle]');
  const nav = $('[data-nav]');
  const toggleLabel = $('[data-nav-toggle-label]');
  if (!header || !toggle || !nav) return;

  const desktop = window.matchMedia('(min-width: 64em)');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const focusables = () => $$('a[href], button:not([disabled])', nav);

  function setOpen(open, { returnFocus = false } = {}) {
    toggle.setAttribute('aria-expanded', String(open));
    if (toggleLabel) toggleLabel.textContent = open ? 'Close menu' : 'Open menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) {
      const first = focusables()[0];
      if (first) window.requestAnimationFrame(() => first.focus());
    } else if (returnFocus) {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // Close after choosing a link (mobile only)
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a') && !desktop.matches) setOpen(false);
  });

  // Escape closes; Tab loops between the menu and its toggle while open
  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      setOpen(false, { returnFocus: true });
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    const last = items[items.length - 1];
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      toggle.focus();
    } else if (event.shiftKey && document.activeElement === toggle) {
      event.preventDefault();
      last.focus();
    }
  });

  // Close when tapping outside the header
  document.addEventListener('click', (event) => {
    if (isOpen() && !header.contains(event.target)) setOpen(false);
  });

  // Reset when resizing up to the desktop layout
  const onBreakpoint = (event) => { if (event.matches && isOpen()) setOpen(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
  else if (desktop.addListener) desktop.addListener(onBreakpoint);

  if (!('IntersectionObserver' in window)) return;

  // Header background once the page starts scrolling
  const sentinel = $('.scroll-sentinel');
  if (sentinel) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    }).observe(sentinel);
  }

  // Back-to-top control appears after the hero has scrolled away
  const toTop = $('[data-to-top]');
  const hero = $('.hero');
  if (toTop && hero) {
    new IntersectionObserver(([entry]) => {
      toTop.classList.toggle('is-visible', !entry.isIntersecting);
    }).observe(hero);
  }

  // Highlight the nav link for the section in the middle of the viewport
  const links = $$('.site-nav__link');
  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((section) => spy.observe(section));
}

/* --------------------------------------------------------------------------
   5. TABS (delivery planner + services)
   ARIA tabs pattern: arrow keys, Home and End move between tabs.
   -------------------------------------------------------------------------- */
function initTabs() {
  $$('[data-tabs]').forEach((group) => {
    const tabs = $$('[role="tab"]', group);
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    if (!tabs.length || panels.includes(null)) return;

    function select(index, { focus = false, reveal = false } = {}) {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[i].classList.toggle('is-active', active);
        panels[i].hidden = !active;
      });
      if (focus) tabs[index].focus();
      // Keep the chosen tab visible in horizontally scrolling tab strips
      if (reveal) tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index, { reveal: true }));
      tab.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        let next = null;
        if (step) next = (index + step + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(next, { focus: true, reveal: true });
      });
    });

    const initial = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    select(initial < 0 ? 0 : initial);
  });
}

/* --------------------------------------------------------------------------
   6. WORK CAROUSEL
   Native horizontal scrolling with snap points (swipe, trackpad, keyboard),
   plus previous/next buttons, a counter and a progress bar.
   -------------------------------------------------------------------------- */
function initCarousel() {
  const root = $('[data-carousel]');
  if (!root) return;

  const track = $('[data-carousel-track]', root);
  const slides = $$('.slide', track);
  const prev = $('[data-carousel-prev]');
  const next = $('[data-carousel-next]');
  const count = $('[data-carousel-count]');
  const progress = $('[data-carousel-progress]');
  if (!track || !slides.length) return;

  const pad = (n) => String(n).padStart(2, '0');
  const step = () => (slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);

  function update() {
    const max = track.scrollWidth - track.clientWidth;
    const x = track.scrollLeft;
    const atEnd = x >= max - 2;
    const current = atEnd ? slides.length : Math.min(slides.length, Math.round(x / step()) + 1);
    if (count) count.textContent = `${pad(current)} / ${pad(slides.length)}`;
    if (progress) progress.style.setProperty('--progress', max > 0 ? Math.max(0.08, (x + track.clientWidth) / track.scrollWidth) : 1);
    if (prev) prev.disabled = x <= 2;
    if (next) next.disabled = atEnd;
  }

  const go = (direction) => track.scrollBy({ left: direction * step() });
  if (prev) prev.addEventListener('click', () => go(-1));
  if (next) next.addEventListener('click', () => go(1));

  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
  });

  // update() only reads a few scroll values and writes text, so it is cheap enough to run per event
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('scrollend', update);
  window.addEventListener('resize', update);

  update();
}

/* --------------------------------------------------------------------------
   7. PORTFOLIO LINKS
   "View Project" links and tech labels appear only when configured above.
   -------------------------------------------------------------------------- */
function initProjects(projects) {
  $$('[data-project]').forEach((card) => {
    const project = projects[card.dataset.project];
    if (!project) return;

    const tag = $('[data-project-tag]', card);
    if (tag && project.status === 'live') {
      tag.textContent = 'Live Project';
      tag.classList.add('tag--live');
    }

    const extra = $('[data-project-extra]', card);
    if (!extra) return;

    if (Array.isArray(project.tech) && project.tech.length) {
      const list = el('ul', { class: 'tech', 'aria-label': 'Technologies used' });
      project.tech.forEach((name) => list.append(el('li', {}, String(name))));
      extra.append(list);
    }

    const url = safeUrl(project.url);
    if (url) {
      const title = $('.project__title', card);
      const link = el('a', { class: 'text-link', href: url, target: '_blank', rel: 'noopener noreferrer' }, 'View Project');
      link.append(el('span', { class: 'visually-hidden' }, `: ${title ? title.textContent : ''} (opens in a new tab)`));
      extra.append(link);
    }
  });
}

/* --------------------------------------------------------------------------
   8. SCROLL REVEALS
   Content is visible by default; motion is added only when supported and
   the visitor has not asked for reduced motion.
   -------------------------------------------------------------------------- */
function initReveals() {
  const items = $$('[data-reveal]');
  const reveal = (node) => node.classList.add('is-revealed');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach(reveal);
    return;
  }

  document.documentElement.classList.add('motion-ok');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach((node) => observer.observe(node));
}

/* --------------------------------------------------------------------------
   9. LEAD FORM
   Default (no backend): validates, builds a readable summary and opens
   WhatsApp with the message pre-filled; the visitor sends it from WhatsApp.
   Optional: "Send a Project Enquiry" posts to SITE_CONFIG.formEndpoint, or
   opens the visitor's email app when only an email address is configured.
   Client-side checks are for convenience only; any server endpoint must
   validate and sanitise input again.
   -------------------------------------------------------------------------- */
function initEnquiryForm(config, links) {
  const form = $('[data-enquiry-form]');
  if (!form) return;

  const waButton = $('[data-submit-whatsapp]', form);
  const enquiryButton = $('[data-submit-enquiry]', form);
  const status = $('[data-form-status]', form);

  const waNumber = digitsOnly(config.whatsappNumber);
  const hasWhatsApp = waNumber.length >= 8 && waNumber.length <= 15;
  const endpoint = safeUrl(config.formEndpoint).startsWith('https://') ? safeUrl(config.formEndpoint) : '';
  const email = links.email ? config.email.trim() : '';

  // Secondary action only exists when it can actually deliver something
  if (enquiryButton && (endpoint || email)) enquiryButton.hidden = false;

  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    phone: form.elements.phone,
    budget: form.elements.budget,
    message: form.elements.message
  };
  const serviceRadios = $$('input[name="service"]', form);
  const getService = () => {
    const checked = serviceRadios.find((radio) => radio.checked);
    return checked ? checked.value : '';
  };
  const valueOf = (name) => (name === 'service' ? getService() : fields[name].value);

  const rules = {
    name: (value) => (value.trim().length < 2 ? 'Enter your full name.' : ''),
    phone: (value) => {
      const trimmed = value.trim();
      if (!trimmed) return '';
      const count = digitsOnly(trimmed).length;
      return /[^\d\s+().-]/.test(trimmed) || count < 7 || count > 15
        ? 'Enter a valid phone number, or leave this field empty.' : '';
    },
    email: (value) => (value.trim() && !isValidEmail(value)
      ? 'Enter a valid email address, like name@example.com, or leave this field empty.' : ''),
    service: (value) => (value ? '' : 'Choose what you need.'),
    message: (value) => {
      const length = value.trim().length;
      if (!length) return 'Tell us a little about your project.';
      return length < 15 ? 'Add a little more detail (at least 15 characters).' : '';
    }
  };

  let attempted = false;

  function setFieldError(name, message) {
    const error = $(`[data-error-for="${name}"]`, form);
    if (error) error.textContent = message;
    const targets = name === 'service' ? serviceRadios : [fields[name]];
    targets.forEach((input) => {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
  }

  // Validates every rule in visual order; returns the first invalid control (or null)
  function validate() {
    let firstInvalid = null;
    Object.keys(rules).forEach((name) => {
      const message = rules[name](valueOf(name));
      setFieldError(name, message);
      if (message && !firstInvalid) firstInvalid = name === 'service' ? serviceRadios[0] : fields[name];
    });
    return firstInvalid;
  }

  // Live re-validation once the visitor has tried to submit
  Object.keys(rules).forEach((name) => {
    const handler = () => { if (attempted) setFieldError(name, rules[name](valueOf(name))); };
    const targets = name === 'service' ? serviceRadios : [fields[name]];
    targets.forEach((input) => {
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });
  });

  function showStatus(type, parts) {
    status.hidden = false;
    status.className = `form-status form-status--${type}`;
    status.replaceChildren(...parts.map((part) => (typeof part === 'string' ? document.createTextNode(part) : part)));
  }

  function hideStatus() {
    status.hidden = true;
    status.replaceChildren();
  }

  function setBusy(button, busyText) {
    const label = $('[data-btn-text]', button);
    button.dataset.label = label.textContent;
    label.textContent = busyText;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
  }

  function clearBusy(button) {
    const label = $('[data-btn-text]', button);
    if (button.dataset.label) label.textContent = button.dataset.label;
    button.disabled = false;
    form.removeAttribute('aria-busy');
  }

  function values() {
    const data = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value.trim()]));
    data.service = getService();
    return data;
  }

  // Readable summary; `bold` adds WhatsApp *bold* markers
  function buildSummary(data, { bold = false } = {}) {
    const b = (text) => (bold ? `*${text}*` : text);
    const lines = [
      `Hello ${config.businessName}, I'd like to discuss a project.`,
      '',
      `${b('Name:')} ${data.name}`
    ];
    if (data.phone) lines.push(`${b('Phone/WhatsApp:')} ${data.phone}`);
    if (data.email) lines.push(`${b('Email:')} ${data.email}`);
    lines.push(`${b('Service:')} ${data.service}`);
    if (data.budget) lines.push(`${b('Budget:')} ${data.budget}`);
    lines.push('', b('Project details:'), data.message, '', '— Sent from the website enquiry form');
    return lines.join('\n');
  }

  // Opens a URL in a new tab from within the click/submit gesture
  function openInNewTab(url) {
    const link = el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' });
    document.body.append(link);
    link.click();
    link.remove();
  }

  function runValidation() {
    attempted = true;
    hideStatus();
    const invalid = validate();
    if (invalid) {
      invalid.focus();
      showStatus('error', ['Please check the highlighted fields.']);
      return false;
    }
    return true;
  }

  // Primary: WhatsApp
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (waButton.disabled || !runValidation()) return;

    if (!hasWhatsApp) {
      console.warn('[Freelance Web Developers] Set SITE_CONFIG.whatsappNumber in script.js to enable WhatsApp enquiries.');
      showStatus('error', [
        'WhatsApp enquiries are not available yet. ',
        email || endpoint ? 'Please use “Send a Project Enquiry” instead.' : 'Please use the contact details on this page.'
      ]);
      return;
    }

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(buildSummary(values(), { bold: true }))}`;
    setBusy(waButton, 'Opening WhatsApp…');
    openInNewTab(url);

    const fallback = el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, 'Open WhatsApp');
    fallback.append(newTabHint());
    showStatus('info', [
      el('strong', {}, 'Your message is ready in WhatsApp. '),
      'Tap Send there to deliver it. Didn’t open? ',
      fallback,
      '.'
    ]);

    window.setTimeout(() => clearBusy(waButton), 2500);
  });

  // Secondary: form endpoint, or the visitor's email app
  if (!enquiryButton) return;

  enquiryButton.addEventListener('click', async () => {
    if (enquiryButton.disabled || !runValidation()) return;
    const data = values();

    if (endpoint) {
      // A reply needs a way to reach the visitor
      if (!data.email && !data.phone) {
        setFieldError('phone', 'Add a phone number or email so we can reply to you.');
        fields.phone.focus();
        showStatus('error', ['Please check the highlighted fields.']);
        return;
      }
      if (form.elements.website_hp && form.elements.website_hp.value) return; // honeypot tripped

      setBusy(enquiryButton, 'Sending…');
      try {
        const payload = new FormData(form);
        payload.delete('website_hp');
        payload.append('_subject', `Project enquiry: ${data.service} — ${data.name}`);

        const response = await fetch(endpoint, { method: 'POST', body: payload, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        form.reset();
        attempted = false;
        showStatus('success', [el('strong', {}, 'Enquiry sent. '), 'Thank you — we’ll be in touch soon.']);
      } catch (error) {
        showStatus('error', [
          el('strong', {}, 'Your enquiry was not sent. '),
          hasWhatsApp ? 'Please try again, or use the WhatsApp button.' : 'Please check your connection and try again.'
        ]);
      } finally {
        clearBusy(enquiryButton);
      }
      return;
    }

    // Email fallback: opens the visitor's mail app with the enquiry pre-filled
    const subject = `Project enquiry: ${data.service} — ${data.name}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildSummary(data))}`;
    showStatus('info', [
      el('strong', {}, 'Your email is ready. '),
      'Send it from your email app, or write to ',
      el('a', { href: `mailto:${email}` }, email),
      '.'
    ]);
  });
}

/* Pre-select the service (and an optional message) from any CTA with data-service */
function initServiceShortcuts() {
  const radios = $$('input[name="service"]');
  const message = document.getElementById('f-message');

  $$('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      const radio = radios.find((input) => input.value === link.dataset.service);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (link.dataset.message && message && !message.value.trim()) message.value = link.dataset.message;
    });
  });
}

/* Friendly reminder for whoever is setting up the site */
function reportMissingConfig(links) {
  const missing = [];
  if (!links.whatsapp) missing.push('whatsappNumber');
  if (!links.phone) missing.push('phoneNumber');
  if (!links.email) missing.push('email');
  if (/example\.com/.test(SITE_CONFIG.siteUrl)) missing.push('siteUrl');
  if (missing.length) {
    console.info(`[Freelance Web Developers] Not configured yet in script.js › SITE_CONFIG: ${missing.join(', ')}. Hidden until set — see README.md.`);
  }
}

/* --------------------------------------------------------------------------
   INIT
   -------------------------------------------------------------------------- */
(function init() {
  document.documentElement.classList.add('js');
  const links = getContactLinks(SITE_CONFIG);

  initContactDetails(links);
  initYear();
  initNavigation();
  initTabs();
  initCarousel();
  initProjects(SITE_CONFIG.projects || {});
  initReveals();
  initServiceShortcuts();
  initEnquiryForm(SITE_CONFIG, links);
  reportMissingConfig(links);
})();
