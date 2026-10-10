/* Freelance Web Developers — site behaviour. Plain JavaScript, no dependencies.
   Every feature checks for its markup first, so one file serves all pages. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var onFrame = function (fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  };

  document.documentElement.classList.add('js');
  $$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ---------- Local preview from disk ----------
     Folder links such as "about/" need a web server to resolve to
     about/index.html. When a page is opened straight from disk (file://),
     point them at the index file instead. Runs at click time so links set
     later by scripts are covered too. */
  if (location.protocol === 'file:') {
    var toIndex = function (a) {
      var href = a.getAttribute('href');
      if (!href || /^(?:[a-z]+:|#|\/\/)/i.test(href)) return;
      var m = href.match(/^([^?#]*)(.*)$/);
      if (m[1] && m[1].slice(-1) === '/') a.setAttribute('href', m[1] + 'index.html' + m[2]);
    };
    $$('a[href]').forEach(toIndex);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (a) toIndex(a);
    }, true);
  }

  /* ---------- Header: switch to the scrolled state after 24px ---------- */
  var header = $('[data-header]');
  var sentinel = $('[data-sentinel]');
  if (header && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- Services mega menu (click / Enter / Space; Esc closes) ---------- */
  var servicesToggle = $('[data-services-toggle]');
  var servicesMenu = $('[data-services-menu]');
  if (servicesToggle && servicesMenu) {
    var setMenu = function (open, returnFocus) {
      servicesToggle.setAttribute('aria-expanded', String(open));
      servicesMenu.hidden = !open;
      if (!open && returnFocus) servicesToggle.focus();
    };
    servicesToggle.addEventListener('click', function () { setMenu(servicesMenu.hidden); });
    document.addEventListener('click', function (e) {
      if (!servicesMenu.hidden && !servicesMenu.contains(e.target) && !servicesToggle.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !servicesMenu.hidden) setMenu(false, true);
    });
    servicesMenu.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !servicesMenu.contains(e.relatedTarget) && e.relatedTarget !== servicesToggle) setMenu(false);
    });
  }

  /* ---------- Mobile drawer + action bar ---------- */
  var drawer = $('[data-drawer]');
  var menuOpen = $('[data-menu-open]');
  var actionBar = $('[data-action-bar]');
  var formInView = false;

  function updateActionBar() {
    if (!actionBar) return;
    var drawerOpen = drawer && drawer.classList.contains('is-open');
    actionBar.classList.toggle('is-hidden', formInView || drawerOpen);
  }

  if (drawer && menuOpen) {
    var menuClose = $('[data-menu-close]', drawer);
    var openDrawer = function () {
      drawer.hidden = false;
      void drawer.offsetWidth; // start the slide-in from the off-canvas position
      drawer.classList.add('is-open');
      menuOpen.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      updateActionBar();
      menuClose.focus();
    };
    var closeDrawer = function (returnFocus) {
      drawer.classList.remove('is-open');
      setTimeout(function () { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, reduceMotion.matches ? 0 : 300);
      menuOpen.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      updateActionBar();
      if (returnFocus !== false) menuOpen.focus();
    };
    menuOpen.addEventListener('click', openDrawer);
    menuClose.addEventListener('click', closeDrawer);
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      var items = $$('a[href], button:not([disabled])', drawer).filter(function (el) { return el.offsetParent !== null; });
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    drawer.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (link && link.getAttribute('href').indexOf('#') !== -1) closeDrawer(false);
    });
    var drawerServices = $('[data-drawer-services]', drawer);
    if (drawerServices) {
      drawerServices.addEventListener('click', function () {
        var expanded = drawerServices.getAttribute('aria-expanded') === 'true';
        drawerServices.setAttribute('aria-expanded', String(!expanded));
        document.getElementById(drawerServices.getAttribute('aria-controls')).hidden = expanded;
        var icon = $('.i', drawerServices);
        icon.classList.toggle('i-minus', !expanded);
        icon.classList.toggle('i-plus', expanded);
      });
    }
    window.matchMedia('(min-width: 1200px)').addEventListener('change', function (e) {
      if (e.matches && drawer.classList.contains('is-open')) closeDrawer(false);
    });
  }

  var formForBar = $('[data-hide-action-bar]');
  if (formForBar && actionBar && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      formInView = entries[0].isIntersecting;
      updateActionBar();
    }).observe(formForBar);
  }

  /* ---------- Hero concept slideshow ---------- */
  $$('[data-slideshow]').forEach(function (show) {
    var slides = $$('[data-slide]', show);
    var dots = $$('[data-slide-to]', show);
    var name = $('[data-slide-name]', show);
    var cat = $('[data-slide-cat]', show);
    var toggle = $('[data-slideshow-toggle]', show);
    var index = 0;
    var timer = null;
    var playing = !reduceMotion.matches;
    var hovering = false;

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === index);
        if (k === index) s.removeAttribute('inert'); else s.setAttribute('inert', '');
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', String(k === index)); });
      if (name) name.textContent = slides[index].getAttribute('data-name');
      if (cat) cat.textContent = ' · ' + slides[index].getAttribute('data-cat');
    }
    function stop() { clearInterval(timer); timer = null; }
    function start() { stop(); if (playing && !hovering) timer = setInterval(function () { go(index + 1); }, 6000); }
    function setPlaying(p) {
      playing = p;
      if (toggle) {
        toggle.setAttribute('aria-label', p ? 'Pause slideshow' : 'Play slideshow');
        $('.i', toggle).className = 'i ' + (p ? 'i-pause' : 'i-play');
      }
      if (name) name.setAttribute('aria-live', p ? 'off' : 'polite');
      start();
    }

    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); start(); }); });
    if (toggle) toggle.addEventListener('click', function () { setPlaying(!playing); });
    show.addEventListener('mouseenter', function () { hovering = true; stop(); });
    show.addEventListener('mouseleave', function () { hovering = false; start(); });
    show.addEventListener('focusin', function () { hovering = true; stop(); });
    show.addEventListener('focusout', function () { hovering = false; start(); });
    go(0);
    setPlaying(playing);
  });

  /* ---------- Carousels (scroll-snap track + controls) ---------- */
  $$('[data-carousel]').forEach(function (carousel) {
    var track = $('[data-carousel-track]', carousel);
    var items = Array.prototype.slice.call(track.children);
    var prev = $('[data-carousel-prev]', carousel);
    var next = $('[data-carousel-next]', carousel);
    var current = $('[data-carousel-current]', carousel);
    var total = $('[data-carousel-total]', carousel);
    var bar = $('[data-carousel-progress]', carousel);
    var live = $('[data-carousel-live]', carousel);
    var last = -1;
    if (total) total.textContent = pad(items.length);

    function step() { return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth; }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var idx = Math.round(track.scrollLeft / step());
      if (track.scrollLeft >= max - 2) idx = items.length - 1;
      idx = Math.max(0, Math.min(items.length - 1, idx));
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
      if (idx === last) return;
      last = idx;
      if (current) current.textContent = pad(idx + 1);
      if (bar) {
        bar.style.width = (100 / items.length) + '%';
        bar.style.left = (idx * 100 / items.length) + '%';
      }
      if (live) live.textContent = 'Project ' + (idx + 1) + ' of ' + items.length;
    }
    function move(dir) {
      track.scrollBy({ left: dir * step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { move(-1); });
    if (next) next.addEventListener('click', function () { move(1); });
    track.addEventListener('keydown', function (e) {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    });
    track.addEventListener('scroll', onFrame(update), { passive: true });
    window.addEventListener('resize', onFrame(function () { last = -1; update(); }));
    update();
  });

  /* ---------- Process timeline: Upcoming → Active → Done while scrolling ---------- */
  $$('[data-timeline]').forEach(function (timeline) {
    var steps = $$('[data-step]', timeline);
    if (reduceMotion.matches) return; // markup ships with every step “done”
    function update() {
      var line = window.innerHeight * 0.55;
      var active = -1;
      steps.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) active = i; });
      steps.forEach(function (s, i) {
        s.setAttribute('data-state', i < active ? 'done' : i === active ? 'active' : 'upcoming');
      });
    }
    window.addEventListener('scroll', onFrame(update), { passive: true });
    window.addEventListener('resize', onFrame(update));
    update();
  });

  /* ---------- Service finder (client-side only, nothing stored) ---------- */
  var FINDER = {
    website: {
      base: ['website-development', 'Website Development', 'Start with a short conversation about what the site needs to do. We will recommend a one-page launch, a business website or an online store, with a clear timeline.'],
      yes: ['website-development', 'Website Development', 'A redesign that keeps what already works and fixes what slows customers down: structure, speed, mobile layout and clear calls to action.'],
      no: ['website-development', 'Website Development', 'Start with a clear, mobile-first website that explains what you offer and makes it easy for customers to get in touch.'],
      building: ['website-development', 'Website Development', 'We can review what is being built — structure, speed, search essentials and tracking — before it launches.']
    },
    seo: {
      base: ['seo-services', 'SEO Services', 'Start with a technical and on-page SEO audit, so the pages you already have can be found for the searches your customers make. If most of your customers are nearby, pair it with Local SEO.'],
      no: ['website-development', 'Website Development', 'Search needs pages to work with. Start with a fast, well-structured website with SEO essentials built in, then grow it with SEO.'],
      building: ['seo-services', 'SEO Services', 'Build the SEO essentials in now — page structure, metadata, speed and schema — so the site launches ready to be found.']
    },
    local: {
      base: ['local-seo', 'Local SEO', 'Set up and optimise your Google Business Profile, build a steady review routine and add local pages, so nearby customers can find and call you.'],
      no: ['local-seo', 'Local SEO', 'A Google Business Profile works even before you have a website. Start there, then add a simple site that turns profile visits into calls.']
    },
    social: {
      base: ['social-media-marketing', 'Social Media Marketing', 'A planned content calendar, consistent posting and honest monthly reporting for the platforms your customers actually use.']
    },
    ecommerce: {
      base: ['ecommerce-marketing', 'E-commerce Marketing', 'Improve product listings, marketplace presence and shopping feeds, so more of your visitors become orders.'],
      no: ['website-development', 'Website Development', 'Start with an online store built around your products — Shopify, WooCommerce or custom — then grow it with e-commerce marketing.']
    },
    brand: {
      base: ['branding-reputation', 'Branding & Reputation', 'Clarify your positioning, identity and messaging, then present it consistently — on your website, your profiles and in how you reply to reviews.']
    },
    analytics: {
      base: ['analytics-tracking', 'Analytics & Tracking', 'Set up GA4, Tag Manager and conversion tracking properly, with simple reports that show which channels bring enquiries.'],
      no: ['website-development', 'Website Development', 'Tracking needs a website to measure. Start with a site that has analytics and conversion tracking built in from day one.']
    },
    other: {
      base: ['', 'Let’s Talk It Through', 'Tell us what you are trying to achieve and we will suggest a practical starting point — even if it is not on our services list.']
    }
  };

  $$('[data-finder]').forEach(function (form) {
    var root = form.getAttribute('data-root') || '';
    var step1 = $('[data-finder-step="1"]', form);
    var step2 = $('[data-finder-step="2"]', form);
    var name = $('[data-finder-name]', form);
    var text = $('[data-finder-text]', form);
    var link = $('[data-finder-link]', form);
    var cta = $('[data-finder-cta]', form);
    var contact = $('[data-finder-contact]', form);

    function value(n) { var el = $('input[name="' + n + '"]:checked', form); return el ? el.value : ''; }
    function render() {
      var goal = FINDER[value('goal')] || FINDER.seo;
      var pick = goal[value('site')] || goal.base;
      name.textContent = pick[1];
      text.textContent = pick[2];
      if (pick[0]) {
        link.href = root + 'services/' + pick[0] + '/';
        cta.textContent = 'Explore ' + pick[1];
        contact.href = root + 'contact/?service=' + pick[0];
      } else {
        link.href = root + 'contact/';
        cta.textContent = 'Start a Conversation';
        contact.href = root + 'contact/';
      }
    }
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $('[data-finder-next]', form).addEventListener('click', function () {
      step1.hidden = true;
      step2.hidden = false;
      $('input', step2).focus();
    });
    $('[data-finder-back]', form).addEventListener('click', function () {
      $$('input[name="site"]', form).forEach(function (i) { i.checked = false; });
      step2.hidden = true;
      step1.hidden = false;
      render();
      ($('input:checked', step1) || $('input', step1)).focus();
    });
    render();
  });
  /* ---------- FAQ disclosures ---------- */
  $$('[data-faq] .faq__q button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      var icon = $('.faq__toggle .i', btn);
      icon.classList.toggle('i-minus', open);
      icon.classList.toggle('i-plus', !open);
    });
  });

  /* ---------- Timeline planner (ARIA tabs) ---------- */
  $$('[data-planner]').forEach(function (planner) {
    var tabs = $$('[role="tab"]', planner);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });
  /* ---------- Portfolio filters (toggle buttons) ---------- */
  $$('[data-filters]').forEach(function (group) {
    var chips = $$('[data-filter-value]', group);
    var cards = $$('[data-filter]');
    var count = $('[data-filter-count]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var value = chip.getAttribute('data-filter-value');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var shown = 0;
        cards.forEach(function (card) {
          var match = value === 'all' || card.getAttribute('data-filter').split(' ').indexOf(value) !== -1;
          card.hidden = !match;
          if (match) shown++;
        });
        if (count) count.textContent = 'Showing ' + shown + (shown === 1 ? ' project' : ' projects');
      });
    });
  });
  /* ---------- Enquiry form ----------
     "Send enquiry" posts to data-endpoint when one is configured and shows
     success only after the server confirms; without an endpoint it opens the
     visitor's email app. "Send via WhatsApp instead" opens wa.me with a
     summary — the visitor must press Send. Client checks are a convenience
     only; any endpoint must validate again. */
  $$('[data-enquiry]').forEach(function (form) {
    var endpoint = form.getAttribute('data-endpoint') || '';
    var waNumber = form.getAttribute('data-wa-number') || '';
    var mailTo = form.getAttribute('data-email') || '';
    var status = $('[data-form-status]', form);
    var sendBtn = $('[data-send]', form);
    var waBtn = $('[data-send-wa]', form);
    var counter = $('[data-counter]', form);
    var started = Date.now();
    var attempted = false;
    var mode = 'send';
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function val(name) { var f = form.elements[name]; return f ? String(f.value || '').trim() : ''; }

    var rules = {
      name: function () { return val('name').length < 2 ? 'Enter your name so we know who to reply to.' : ''; },
      email: function () {
        var v = val('email');
        if (v && !EMAIL_RE.test(v)) return 'Enter a valid email address, like name@example.com.';
        if (!v && !val('phone') && mode === 'send') return 'Add an email or a phone number so we can reply.';
        return '';
      },
      phone: function () {
        var v = val('phone');
        if (!v) return '';
        var n = v.replace(/\D/g, '').length;
        return /[^\d\s+().-]/.test(v) || n < 10 || n > 13 ? 'Enter a valid phone number, like 98765 43210.' : '';
      },
      service: function () { return val('service') ? '' : 'Choose the service you need, or “Not sure — help me choose”.'; },
      message: function () {
        var n = val('message').length;
        if (!n) return 'Tell us a little about your project.';
        return n < 15 ? 'Add a little more detail — at least 15 characters.' : '';
      },
      consent: function () {
        return mode === 'send' && !form.elements.consent.checked ? 'Please confirm we can contact you about this enquiry.' : '';
      }
    };

    function setError(name, msg) {
      var field = form.elements[name];
      var err = document.getElementById('f-' + name + '-error');
      if (err) {
        $('[data-error-text]', err).textContent = msg;
        err.hidden = !msg;
      }
      if (msg) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }

    function validate() {
      var first = null;
      Object.keys(rules).forEach(function (name) {
        var msg = rules[name]();
        setError(name, msg);
        if (msg && !first) first = form.elements[name];
      });
      return first;
    }

    function revalidate(name) {
      if (name === 'email' || name === 'phone') {
        setError('email', rules.email());
        setError('phone', rules.phone());
      } else if (rules[name]) {
        setError(name, rules[name]());
      }
    }

    function updateCounter() {
      var n = form.elements.message.value.length;
      counter.hidden = n <= 1800;
      counter.textContent = n + ' / 2000';
    }

    form.addEventListener('input', function (e) {
      if (e.target.name === 'message') updateCounter();
      if (attempted) revalidate(e.target.name);
    });
    form.addEventListener('change', function (e) { if (attempted) revalidate(e.target.name); });

    // Pre-select the service from ?service= (service pages and the finder link here)
    var pre = new URLSearchParams(window.location.search).get('service');
    if (pre) {
      $$('option', form.elements.service).forEach(function (opt) { if (opt.value && opt.value === pre) opt.selected = true; });
    }

    function pref() { var r = $('input[name="contact_pref"]:checked', form); return r ? r.value : ''; }

    function summary(bold) {
      var b = function (t) { return bold ? '*' + t + '*' : t; };
      var sel = form.elements.service;
      var lines = ['Hi, I’d like to discuss a project.', '', b('Name:') + ' ' + val('name')];
      if (val('business')) lines.push(b('Business:') + ' ' + val('business'));
      if (val('email')) lines.push(b('Email:') + ' ' + val('email'));
      if (val('phone')) lines.push(b('Phone/WhatsApp:') + ' ' + val('phone'));
      lines.push(b('Service:') + ' ' + sel.options[sel.selectedIndex].text);
      if (val('budget')) lines.push(b('Budget:') + ' ' + val('budget'));
      lines.push(b('Preferred contact:') + ' ' + pref(), '', b('Project:'), val('message'));
      return lines.join('\n');
    }

    function el(tag, cls, text) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text) node.textContent = text;
      return node;
    }

    var ICONS = { success: 'i-success', error: 'i-alert i-22', whatsapp: 'i-whatsapp i-22', mail: 'i-mail' };
    function showStatus(type, title, body) {
      var tone = type === 'whatsapp' || type === 'mail' ? 'info' : type;
      status.className = 'form-status form-status--' + tone;
      status.setAttribute('role', type === 'error' ? 'alert' : 'status');
      status.textContent = '';
      var icon = el('span', 'i ' + ICONS[type]);
      icon.setAttribute('aria-hidden', 'true');
      var text = el('div', 'form-status__text');
      var p = el('p');
      body.forEach(function (part) { p.append(part); });
      text.append(el('p', 'form-status__title', title), p);
      status.append(icon, text);
      status.hidden = false;
      status.focus();
    }

    function link(href, label) {
      var a = el('a', '', label);
      a.href = href;
      if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
      return a;
    }

    function setBusy(btn, busy, label) {
      var text = $('[data-btn-text]', btn);
      if (busy) { btn.dataset.label = text.textContent; text.textContent = label; }
      else if (btn.dataset.label) text.textContent = btn.dataset.label;
      btn.disabled = busy;
      if (busy) form.setAttribute('aria-busy', 'true');
      else form.removeAttribute('aria-busy');
    }

    function check(nextMode) {
      mode = nextMode;
      attempted = true;
      status.hidden = true;
      var first = validate();
      if (first) { first.focus(); return false; }
      return true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sendBtn.disabled || !check('send')) return;

      // Honeypot or an implausibly fast submission: drop quietly
      if (val('company_website') || Date.now() - started < 3000) {
        showStatus('success', 'Thank you — your enquiry has been sent.', ['We will reply using your preferred contact method.']);
        return;
      }

      if (!endpoint) {
        var subject = 'Project enquiry: ' + form.elements.service.options[form.elements.service.selectedIndex].text + ' — ' + val('name');
        window.location.href = 'mailto:' + mailTo + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summary(false));
        showStatus('mail', 'Your email is ready to send.', [
          'Your email app has opened with your details filled in. Press Send there to deliver it — we only receive it once you send it. Nothing opened? Write to ',
          link('mailto:' + mailTo, mailTo), '.'
        ]);
        return;
      }

      // JSON body: the server re-validates every field and sends the email
      var payload = {};
      new FormData(form).forEach(function (value, key) { payload[key] = value; });
      payload.elapsed_ms = Date.now() - started;
      setBusy(sendBtn, true, 'Sending…');
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (json) {
            if (res.ok && json.ok) return;
            var err = new Error('HTTP ' + res.status);
            err.status = res.status;
            err.fields = json.fields || [];
            throw err;
          });
        })
        .then(function () {
          form.reset();
          attempted = false;
          updateCounter();
          showStatus('success', 'Thank you — your enquiry has been sent.', ['A copy has reached our inbox. We will reply using your preferred contact method.']);
        })
        .catch(function (err) {
          var known = (err.fields || []).filter(function (name) { return rules[name]; });
          if (known.length) {
            // The server is stricter than the browser check: mark what it rejected
            var first = validate();
            known.forEach(function (name) {
              if (!form.elements[name].getAttribute('aria-invalid')) setError(name, 'Please check this field.');
            });
            (first || form.elements[known[0]]).focus();
            return;
          }
          var busy = err.status === 429;
          showStatus('error', busy ? 'Too many attempts in a short time.' : 'Your message could not be sent.', [
            busy ? 'Please wait a few minutes and try again, or message us on WhatsApp at '
                 : 'Nothing was lost — your answers are still in the form. Please try again, or message us on WhatsApp at ',
            link('https://wa.me/' + waNumber, '+91 95007 85451'), '.'
          ]);
        })
        .then(function () { setBusy(sendBtn, false); });
    });

    waBtn.addEventListener('click', function () {
      if (!check('whatsapp')) return;
      var url = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(summary(true));
      window.open(url, '_blank', 'noopener');
      showStatus('whatsapp', 'Your message is ready in WhatsApp.', [
        'WhatsApp has opened with your details filled in. Tap Send there to deliver it — we only receive it once you send it. Didn’t open? ',
        link(url, 'Open WhatsApp'), '.'
      ]);
    });
  });
  /* ---------- On-this-page scrollspy ---------- */
  $$('[data-scrollspy]').forEach(function (nav) {
    var links = $$('a[href^="#"]', nav);
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.3;
      var current = 0;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) current = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = targets.length - 1;
      links.forEach(function (a, i) {
        a.classList.toggle('is-active', i === current);
        if (i === current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  });
})();
