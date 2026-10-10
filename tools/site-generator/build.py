"""Assemble the static site: wraps each page body with the shared head,
header, drawer, footer and action bar, and expands {{...}} snippets.

Usage (from the site folder):  python tools/site-generator/build.py
Writes every page's index.html into the site root (two folders up), rebuilds
sitemap.xml and robots.txt, and re-embeds the mask icons in site.css.
"""
import html
import json
import os
import re

from content import BUDGETS, FAQS, INDUSTRY_BLOCKS, LEDGER, PLANNER
from content_services import SERVICE_PAGES, SHARED
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SITE = "https://freelancecentre.online"

WA_NUMBER = "919500785451"
WA_TEXT = "Hi, I'd like to discuss a project."
WA_URL = f"https://wa.me/{WA_NUMBER}?text=" + WA_TEXT.replace(" ", "%20").replace("'", "%27").replace(",", "%2C")
TEL_MAIN = "+919500785451"
TEL_CALLS = "+916380734733"
EMAIL = "freelance.work2k26@gmail.com"
LINKEDIN = "https://www.linkedin.com/company/freelance-website-developers"
# Where "Send enquiry" posts the form: the Vercel function in api/enquiry.js, which
# emails it through Gmail SMTP. Set to "" to open the visitor's email app instead.
FORM_ENDPOINT = "/api/enquiry"
WA_CHANNEL = "https://whatsapp.com/channel/0029Vb8jxnxDuMRbYut07l2m"

SERVICES = [
    ("website-development", "Website Development", "Business sites, e-commerce, redesigns and care"),
    ("seo-services", "SEO Services", "Technical, on-page and content optimisation"),
    ("local-seo", "Local SEO & Google Business Profile", "Maps visibility, reviews and local pages"),
    ("social-media-marketing", "Social Media Marketing", "Strategy, content calendars and reels"),
    ("graphic-design", "Graphic Design", "Logos, print, menus and campaign creatives"),
    ("branding-reputation", "Branding & Reputation", "Identity, messaging and review care"),
    ("ecommerce-marketing", "E-commerce Marketing", "Listings, marketplaces and conversion"),
    ("analytics-tracking", "Analytics & Tracking", "GA4, tags, dashboards and reporting"),
]

# Fictional concept sites shown in browser / phone frames (Figma › Screen/*).
CONCEPTS = {
    "crumb": dict(
        theme="crumb", url="morningcrumb.concept", brand="Morning Crumb",
        links=["Menu", "Pre-order", "Visit"], cta="Contact",
        kicker="Small-batch bakery", title="Small-batch bakes, every single morning.",
        text="See today’s menu, order ahead for pickup and call the counter in one tap.",
        b1="Pre-order for pickup", b2="Today’s menu", m_b2="Call the counter",
        photo="photo-bakery-croissant.jpg",
        strip=["Fresh daily menu", "Pickup pre-orders", "One-tap calling"],
    ),
    "northline": dict(
        theme="northline", url="northline.concept", brand="NORTHLINE",
        links=["Capabilities", "Sectors", "Projects"], cta="Contact",
        kicker="Civil & structural engineering", title="Infrastructure projects, delivered with care.",
        text="Capabilities, project sectors and a clear enquiry route for procurement teams.",
        b1="Discuss a project", b2="Capabilities", m_b2="Call the office",
        photo="photo-engineering.jpg",
        strip=["Civil works", "Structural steel", "Site management"],
    ),
    "loom": dict(
        theme="loom", url="threadandloom.concept", brand="Thread & Loom",
        links=["Fabrics", "Colours", "Samples"], cta="Contact",
        kicker="Cotton collection", title="Cotton fabrics in colours made to last.",
        text="Browse fabrics by colour and request samples — no checkout needed.",
        b1="Request samples", b2="Browse colours", m_b2="Browse colours",
        photo="photo-textiles.jpg",
        swatches=[("Sage", "swatch-sage-14.svg"), ("Sand", "swatch-sand-14.svg"), ("Rust", "swatch-rust-14.svg")],
    ),
    "ember": dict(
        theme="ember", url="studioember.concept", brand="Studio Ember",
        links=["Services", "Stylists", "Visit"], cta="Contact",
        kicker="Hair & skin studio", title="Hair, skin and a little calm.",
        text="A clear service menu, location and appointment requests straight to WhatsApp.",
        b1="Book on WhatsApp", b2="Service menu", m_b2="Service menu",
        photo="photo-salon.jpg",
        strip=["Cuts & colour", "Skin rituals", "Bridal"],
    ),
    "hillside": dict(
        theme="hillside", url="hillsideroasters.concept", brand="Hillside Roasters",
        links=["Coffee", "Origin", "Launch"], cta="Contact",
        kicker="Launching soon", title="Single-estate coffee, roasted in small batches.",
        text="One message, one product and one clear sign-up action for launch day.",
        b1="Join the launch list", b2="Our estate", m_b2="Our estate",
        photo="photo-coffee.jpg",
        strip=["Single estate", "Small batch", "Roasted to order"],
    ),
    "terra": dict(
        theme="terra", url="terrahome.concept", brand="terra home",
        links=["Living", "Kitchen", "Cart (2)"], cta="Checkout",
        kicker="New collection", title="Calm objects for everyday homes.",
        text="Product browsing, a simple cart and a calm checkout path.",
        b1="Shop the collection", b2="View lookbook", m_b2="View lookbook",
        photo="photo-home-interior.jpg",
        strip=["Clear returns policy", "Secure checkout", "Order tracking"],
    ),
}

PROJECTS = {
    "crumb": dict(
        name="Morning Crumb Bakery", category="Bakery & Food", slug="morning-crumb",
        filter="websites seo",
        feature="Daily menu, pickup pre-orders and one-tap calling, designed for customers browsing on their phones.",
        compact="Daily menu, pickup pre-orders and one-tap calling for phone browsers.",
        meta="Website design · Mobile pre-order flow · Local SEO setup",
        meta_short="Website design · Mobile pre-order flow",
    ),
    "northline": dict(
        name="Northline Engineering", category="Corporate website", slug="northline-engineering",
        filter="websites marketing",
        feature="Capabilities, project sectors and clear enquiry routes for procurement teams evaluating an engineering firm.",
        compact="Capabilities, sectors and clear enquiry routes for procurement teams.",
        meta="Corporate website · Information architecture · Enquiry forms",
        meta_short="Corporate website · Enquiry forms",
    ),
    "ember": dict(
        name="Studio Ember Salon", category="Local service", slug="studio-ember",
        filter="websites seo",
        feature="A calm service menu, location details and appointment requests that go straight to WhatsApp.",
        compact="Service menu, location and appointment requests straight to WhatsApp.",
        meta="Website design · WhatsApp booking · Google Business Profile",
        meta_short="Website design · Google Business Profile",
    ),
    "loom": dict(
        name="Thread & Loom Textiles", category="Product catalogue", slug="thread-and-loom",
        filter="websites creative",
        feature="A colour-led fabric catalogue where buyers browse by shade and request samples — no checkout needed.",
        compact="Browse fabrics by colour and request samples — no checkout needed.",
        meta="Catalogue website · Creative direction · Sample requests",
        meta_short="Catalogue website · Creative direction",
    ),
    "hillside": dict(
        name="Hillside Roasters Launch", category="Brand launch", slug="hillside-roasters",
        filter="creative marketing",
        feature="A single-message launch page with one product story and one clear sign-up action for launch day.",
        compact="One message, one product and one clear sign-up action.",
        meta="Landing page · Brand creative · Launch list",
        meta_short="Landing page · Brand creative · Launch list",
    ),
    "terra": dict(
        name="Terra Home Store", category="E-commerce", slug="terra-home",
        filter="websites ecommerce seo",
        feature="Product browsing, a simple cart and a calm checkout path for a small homeware brand.",
        compact="Product browsing, a simple cart and a calm checkout path.",
        meta="E-commerce website · E-commerce SEO · Product photography direction",
        meta_short="E-commerce website · E-commerce SEO",
    ),
}

INDUSTRIES = {
    "bakery": ("bakeries-cafes-restaurants", "Bakeries, cafés & restaurants", "Menus, pre-orders, reviews and Google Maps.", "industry-bakery.jpg", "Rustic bread loaves with wheat stalks"),
    "retail": ("shops-retail", "Shops & retail", "Product ranges, store visits and local search.", "industry-retail.jpg", "A clothing shop with shelves and pendant lights"),
    "beauty": ("beauty-wellness", "Beauty & wellness", "Service menus, WhatsApp booking and reviews.", "photo-salon.jpg", "A minimal salon interior with round mirrors"),
    "gym": ("gyms-fitness", "Gyms & fitness", "Class timetables, trials and membership enquiries.", "industry-gym.jpg", "Rows of dumbbells in a bright gym"),
    "professional": ("professional-services", "Professional services", "Credibility, clear services and consultations.", "industry-professional.jpg", "A team meeting around a conference table"),
    "startups": ("startups-small-businesses", "Startups & small businesses", "A credible launch, fast — then room to grow.", "industry-startups.jpg", "People working in an open-plan studio"),
    "ecommerce": ("ecommerce-brands", "E-commerce brands", "Product discovery, trust and repeat orders.", "industry-ecommerce.jpg", "A hand holding a bank card while shopping on a laptop"),
}

PROCESS = [
    ("01", "Discover", "Understand the business and its goals: who your customers are, what they need to find, and what a successful enquiry looks like.", "You receive: a short brief confirming goals, audience and priorities"),
    ("02", "Define", "Establish the scope, strategy and priorities, with our fees and any third-party costs explained up front.", "You receive: a written scope, timeline and quote"),
    ("03", "Design", "Create the visual direction and user experience, reviewed with you before anything is built.", "You receive: page designs to review and approve"),
    ("04", "Build & Launch", "Implement, test across devices and publish the agreed solution, including tracking and search essentials.", "You receive: a tested, live website or campaign"),
    ("05", "Improve", "Provide agreed maintenance, reporting or optimisation, guided by what the data actually shows.", "You receive: clear updates on what changed and why"),
]

FINDER_GOALS = [
    ("website", "Launch or rebuild my website"),
    ("seo", "Get found on Google"),
    ("local", "Get more calls from nearby customers"),
    ("social", "Grow on Instagram & LinkedIn"),
    ("ecommerce", "Sell more products online"),
    ("brand", "Look more professional"),
    ("analytics", "Know what is actually working"),
    ("other", "Something else — let’s talk"),
]

e = html.escape


# ---------------------------------------------------------------- snippets
def industry_tile(key, root, heading="h3"):
    slug, name, summary, img, alt = INDUSTRIES[key]
    return f"""<li class="industry-tile">
            <img class="industry-tile__img" src="{root}assets/img/{img}" width="296" height="360" alt="{e(alt)}" loading="lazy" decoding="async">
            <div class="industry-tile__label"><{heading} class="t-h4"><a href="{root}industries/#{slug}">{e(name)}</a></{heading}><span class="i i-arrow-right"></span></div>
            <p class="t-small">{e(summary)}</p>
          </li>"""


def process(root, states=None):
    states = states or ["done"] * len(PROCESS)
    items = []
    for (num, title, desc, outcome), state in zip(PROCESS, states):
        items.append(f"""<li class="step" data-state="{state}" data-step>
            <div class="step__rail" aria-hidden="true"><span class="step__node"></span><span class="step__line"></span></div>
            <div class="step__content">
              <h3 class="step__head"><span class="t-numeral">{num}</span><span class="t-h3">{e(title)}</span></h3>
              <p class="step__desc t-body">{e(desc)}</p>
              <p class="step__outcome"><span class="i i-check i-16"></span>{e(outcome)}</p>
            </div>
          </li>""")
    return '<ol class="timeline" data-timeline>\n          ' + "\n          ".join(items) + "\n        </ol>"


def finder(root):
    goals = "".join(
        f'<label class="finder-option"><input type="radio" name="goal" value="{v}"{" checked" if v == "seo" else ""}><span>{e(l)}</span></label>'
        for v, l in FINDER_GOALS
    )
    sites = "".join(
        f'<label class="finder-option"><input type="radio" name="site" value="{v}"><span>{e(l)}</span></label>'
        for v, l in [("yes", "Yes, I have a website"), ("no", "No, not yet"), ("building", "It is being built")]
    )
    return f"""<form class="finder" data-finder data-root="{root}" action="{root}contact/" method="get">
            <div class="finder__question">
              <div class="finder__step" data-finder-step="1">
                <p class="eyebrow">Service finder · Step 1 of 2</p>
                <fieldset>
                  <legend class="t-h3">What would you most like to improve?</legend>
                  <div class="finder__options">{goals}</div>
                </fieldset>
                <button class="link link--md" type="button" data-finder-next>Next question<span class="i i-arrow-right i-18"></span></button>
              </div>
              <div class="finder__step" data-finder-step="2" hidden>
                <p class="eyebrow">Service finder · Step 2 of 2</p>
                <fieldset>
                  <legend class="t-h3">Do you already have a website?</legend>
                  <div class="finder__options">{sites}</div>
                </fieldset>
                <button class="finder__back" type="button" data-finder-back>Back to step 1</button>
              </div>
            </div>
            <div class="finder__suggestion" aria-live="polite">
              <p class="t-label">Suggested starting point</p>
              <p class="t-h2" data-finder-name>SEO Services</p>
              <p class="t-small" data-finder-text>Start with a technical and on-page SEO audit, so the pages you already have can be found for the searches your customers make. If most of your customers are nearby, pair it with Local SEO.</p>
              <a class="btn btn--primary btn--md" href="{root}services/seo-services/" data-finder-link><span data-finder-cta>Explore SEO Services</span><span class="i i-arrow-right i-18"></span></a>
              <a class="link link--md" href="{root}contact/?service=seo-services" data-finder-contact>Or talk it through with us<span class="i i-arrow-right i-18"></span></a>
            </div>
          </form>"""


def offer(root):
    return """<div class="offer">
            <p class="offer__figure"><span class="t-numeral">3</span><span class="t-label">months</span></p>
            <div class="offer__copy">
              <p class="t-label">Included with eligible website projects</p>
              <h3 class="t-h4">Free basic website maintenance after launch</h3>
              <p class="t-small">Minor text updates, basic content changes and help with small website issues — at no additional service charge.</p>
              <details>
                <summary class="link link--md">What is and is not included<span class="i i-arrow-right i-18"></span></summary>
                <ul class="offer__exclusions">
                  <li>Included: minor text and image updates, small content changes and help with small website issues for 3 months after launch.</li>
                  <li>Not included: new pages or sections, redesigns or new features.</li>
                  <li>Not included: third-party costs such as hosting, domain renewals, paid plugins or themes.</li>
                </ul>
              </details>
            </div>
          </div>"""

def browser(key, root, raised=False, label=True):
    c = CONCEPTS[key]
    links = "".join(f"<span>{e(l)}</span>" for l in c["links"])
    if "swatches" in c:
        strip = "".join(
            f'<span class="swatch swatch--{n.lower()}">{e(n)}</span>'
            for n, f in c["swatches"]
        )
    else:
        strip = "".join(f"<span>{e(s)}</span>" for s in c["strip"])
    aria = f' role="img" aria-label="Concept homepage for {e(PROJECTS[key]["name"])}"' if label else ' aria-hidden="true"'
    return f"""<div class="browser{' browser--raised' if raised else ''}"{aria}>
  <div class="browser__chrome" aria-hidden="true"><span class="browser__dot"></span><span class="browser__dot"></span><span class="browser__dot"></span><span class="browser__address">{e(c["url"])}</span><span class="browser__spacer"></span></div>
  <div class="screen screen--{c["theme"]}" aria-hidden="true">
    <div class="screen__nav"><span class="screen__brand">{e(c["brand"])}</span><span class="screen__links">{links}<span class="screen__cta">{e(c["cta"])}</span></span></div>
    <div class="screen__hero">
      <div class="screen__copy"><span class="screen__kicker">{e(c["kicker"])}</span><span class="screen__title">{e(c["title"])}</span><span class="screen__text">{e(c["text"])}</span><span class="screen__buttons"><span class="screen__btn screen__btn--primary">{e(c["b1"])}</span><span class="screen__btn">{e(c["b2"])}</span></span></div>
      <img class="screen__photo" src="{root}assets/img/{c["photo"]}" alt="" loading="lazy" decoding="async">
    </div>
    <div class="screen__strip">{strip}</div>
  </div>
</div>"""


def phone(key, root):
    c = CONCEPTS[key]
    return f"""<div class="phone" aria-hidden="true"><div class="phone__body">
  <div class="phone__display">
    <div class="mscreen screen--{c["theme"]}">
      <div class="mscreen__nav"><span class="mscreen__brand">{e(c["brand"])}</span><span class="mscreen__menu"><i></i><i></i><i></i></span></div>
      <img class="mscreen__photo" src="{root}assets/img/{c["photo"]}" alt="" loading="lazy" decoding="async">
      <div class="mscreen__copy"><span class="mscreen__kicker">{e(c["kicker"])}</span><span class="mscreen__title">{e(c["title"])}</span><span class="mscreen__btn mscreen__btn--primary">{e(c["b1"])}</span><span class="mscreen__btn">{e(c["m_b2"])}</span></div>
    </div>
    <span class="phone__island"></span>
  </div>
</div></div>"""


def project_href(key, root):
    p = PROJECTS[key]
    return f"{root}work/{p['slug']}/" if key == "crumb" else f"{root}work/#{p['slug']}"


def project_card(key, root, variant="feature", heading="h3", tag=None, body=None, meta=None, extra_cls=""):
    p = PROJECTS[key]
    href = project_href(key, root)
    compact = variant == "compact"
    title_cls = "t-h4" if compact else "t-h3"
    body = body or (p["compact"] if compact else p["feature"])
    meta = meta or (p["meta_short"] if compact else p["meta"])
    return f"""<article class="project-card{' project-card--compact' if compact else ''}{extra_cls}" id="{p['slug']}" data-filter="{p['filter']}">
  <a class="project-card__media" href="{href}" tabindex="-1" aria-hidden="true"><div class="thumb">{browser(key, root, raised=True, label=False)}</div></a>
  <div class="tags"><span class="tag tag--concept">Concept project</span><span class="tag tag--category">{e(tag or p['category'])}</span></div>
  <{heading} class="{title_cls}">{e(p['name'])}</{heading}>
  <p class="project-card__body t-body">{e(body)}</p>
  <p class="project-card__meta">{e(meta)}</p>
  <a class="link link--md" href="{href}">View concept study<span class="visually-hidden">: {e(p['name'])}</span><span class="i i-arrow-right i-18"></span></a>
</article>"""


CTAS = {
    "default": ("Have a Project in Mind? Let’s Make a Plan.",
                "Tell us what you are trying to achieve. We will discuss your requirements and identify a practical next step."),
    "case": ("Have a Project Like This?",
             "Tell us about your business and what you would like customers to do on your website. We will suggest the right build and a realistic timeline."),
    "industries": ("Let’s Plan What Your Business Needs Online.",
                   "Tell us about your customers and what you want them to do. We will suggest a practical first step."),
    "about": ("Let’s Talk About What You Need.",
              "Tell us a little about your business. We will reply with honest advice and a practical next step."),
}


def cta_banner(root, theme="terracotta", key="default", heading="h2", note=True):
    title, body = CTAS[key]
    note_html = '<p class="cta-banner__note">Usually replies within one working day</p>' if note else ""
    if theme == "espresso":
        cls = "cta-banner cta-banner--espresso mode-dark"
        b1 = f'<a class="btn btn--solid" href="{WA_URL}" target="_blank" rel="noopener" data-wa>Start a Conversation<span class="i i-whatsapp"></span></a>'
    elif theme == "sand":
        cls = "cta-banner cta-banner--sand"
        b1 = f'<a class="btn btn--primary" href="{WA_URL}" target="_blank" rel="noopener" data-wa>Start a Conversation<span class="i i-whatsapp"></span></a>'
    else:
        cls = "cta-banner mode-dark"
        b1 = f'<a class="btn btn--solid" href="{WA_URL}" target="_blank" rel="noopener" data-wa>Start a Conversation<span class="i i-whatsapp"></span></a>'
    return f"""<div class="{cls}">
  <div class="cta-banner__copy">
    <{heading} class="t-h2">{e(title)}</{heading}>
    <p class="t-lead">{e(body)}</p>
  </div>
  <div class="cta-banner__actions">
    {b1}
    <a class="btn btn--secondary" href="{root}contact/">Send a Project Enquiry<span class="i i-arrow-right"></span></a>
    {note_html}
  </div>
</div>"""


def crumbs(items, root):
    out = [f'<li><a href="{root or "./"}">Home</a></li>']
    for item in items:
        if "=" in item:
            label, href = item.split("=", 1)
            out.append(f'<li><a href="{root}{href}">{e(label)}</a></li>')
        else:
            out.append(f'<li><span aria-current="page">{e(item)}</span></li>')
    return '<nav class="breadcrumb" aria-label="Breadcrumb"><ol>' + "".join(out) + "</ol></nav>"


def contact_methods(root, variant=""):
    cls = f"contact-methods contact-methods--{variant}" if variant else "contact-methods"
    return f"""<div class="{cls}">
  <a class="contact-method" href="{WA_URL}" target="_blank" rel="noopener" data-wa>
    <span class="contact-method__well contact-method__well--accent"><span class="i i-whatsapp"></span></span>
    <span class="contact-method__text"><span class="contact-method__label t-label">WhatsApp &amp; calls</span><span class="contact-method__value t-h4">+91 95007 85451</span><span class="contact-method__hint">Fastest way to reach us</span></span>
    <span class="i i-arrow-up-right"></span>
  </a>
  <a class="contact-method" href="tel:{TEL_CALLS}">
    <span class="contact-method__well"><span class="i i-phone"></span></span>
    <span class="contact-method__text"><span class="contact-method__label t-label">Calls only</span><span class="contact-method__value t-h4">+91 63807 34733</span><span class="contact-method__hint">Voice calls</span></span>
    <span class="i i-arrow-up-right"></span>
  </a>
  <a class="contact-method" href="mailto:{EMAIL}">
    <span class="contact-method__well"><span class="i i-mail"></span></span>
    <span class="contact-method__text"><span class="contact-method__label t-label">Email</span><span class="contact-method__value contact-method__value--email t-h4">{EMAIL}</span><span class="contact-method__hint">For briefs and documents</span></span>
    <span class="i i-arrow-up-right"></span>
  </a>
</div>"""


def logo(root, dark=False, tagline=False):
    mark = "logo-monogram-light.png" if dark else "logo-monogram.png"
    tag = '<span class="logo__tagline">Your Business. Our Digital Solutions.</span>' if tagline else ""
    return f"""<a class="logo" href="{root}" aria-label="Freelance Web Developers, home">
      <img class="logo__mark" src="{root}assets/img/{mark}" width="59" height="32" alt="">
      <span class="logo__rule" aria-hidden="true"></span>
      <span class="logo__words" aria-hidden="true"><span class="logo__name"><span>Freelance</span><span>Web Developers</span></span>{tag}</span>
    </a>"""


def toc():
    items = "".join(
        f'<li><a href="#{slug}"><span class="t-index">{i + 1:02d}</span>{e(title)}</a></li>'
        for i, (slug, title, *_rest) in enumerate(LEDGER)
    )
    return f"""<nav class="toc" aria-label="On this page">
          <p class="t-label">On this page</p>
          <ul>{items}</ul>
        </nav>"""


def ledger(root):
    out = []
    for i, (slug, title, count, body, tags, cta, img, alt) in enumerate(LEDGER):
        tag_html = "".join(f'<span class="tag tag--category">{e(x)}</span>' for x in tags)
        out.append(f"""<article class="ledger__item" id="{slug}">
          <img class="ledger__img" src="{root}assets/img/{img}" width="420" height="300" alt="{e(alt)}" loading="lazy" decoding="async">
          <div class="ledger__content">
            <p class="ledger__meta"><span class="t-index">{i + 1:02d}</span><span class="t-caption">{e(count)}</span></p>
            <h2 class="ledger__title">{e(title)}</h2>
            <p class="t-body">{e(body)}</p>
            <div class="tags">{tag_html}</div>
            <a class="link" href="{root}services/{slug}/">{e(cta)}<span class="i i-arrow-right"></span></a>
          </div>
        </article>""")
    return "\n        ".join(out)


def planner(root, uid="plan"):
    tabs = []
    panels = []
    for i, (key, tab, duration, label, weeks, includes, cta) in enumerate(PLANNER):
        sel = i == 0
        tabs.append(f'<button type="button" role="tab" id="{uid}-tab-{key}" aria-controls="{uid}-{key}" aria-selected="{"true" if sel else "false"}"{"" if sel else " tabindex=\"-1\""}>{e(tab)}</button>')
        bars = "".join(
            f'<li{" class=\"is-on\"" if n <= weeks else ""}>Week {n if n < 4 else "4+"}</li>' for n in range(1, 5)
        )
        inc = "".join(f'<li><span class="i i-check i-16"></span>{e(x)}</li>' for x in includes)
        panels.append(f"""<div class="planner__panel" role="tabpanel" id="{uid}-{key}" aria-labelledby="{uid}-tab-{key}"{"" if sel else " hidden"}>
            <p class="planner__duration"><span class="t-numeral">{e(duration)}</span><span class="t-small">{e(label)}</span></p>
            <ol class="planner__weeks" aria-label="Typical duration: {e(duration)}">{bars}</ol>
            <ul class="checklist">{inc}</ul>
            <a class="btn btn--primary btn--md btn--block" href="{root}contact/?service=website-development">{e(cta)}<span class="i i-arrow-right i-18"></span></a>
          </div>""")
    return f"""<div class="planner" data-planner>
          <p class="planner__label">How fast can you launch?</p>
          <div class="planner__tabs" role="tablist" aria-label="Website type">{"".join(tabs)}</div>
          {"".join(panels)}
          <p class="note">Timelines begin once content and approvals are in place.</p>
        </div>"""


def faq(key):
    items = []
    for i, (q, a) in enumerate(FAQS[key]):
        open_ = i == 0
        items.append(f"""<div class="faq__item{' is-open' if open_ else ''}">
            <h3 class="faq__q"><button type="button" aria-expanded="{'true' if open_ else 'false'}" aria-controls="faq-{key}-{i}"><span class="t-h4">{e(q)}</span><span class="faq__toggle"><span class="i {'i-minus' if open_ else 'i-plus'}"></span></span></button></h3>
            <div class="faq__a" id="faq-{key}-{i}"><div><p class="t-body">{e(a)}</p></div></div>
          </div>""")
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQS[key]],
    }
    return ('<div class="faq" data-faq>\n          ' + "\n          ".join(items) + "\n        </div>\n"
            + '        <script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>")


def industry_jump():
    items = "".join(
        f'<li><a href="#{INDUSTRIES[k][0]}"><span class="t-index">{i + 1:02d}</span>{e(INDUSTRIES[k][1])}</a></li>'
        for i, (k, *_r) in enumerate(INDUSTRY_BLOCKS)
    )
    return f"""<nav class="toc toc--narrow" aria-label="Jump to an industry">
          <p class="t-label">Jump to</p>
          <ul>{items}</ul>
        </nav>"""


def industry_blocks(root):
    out = []
    for i, (key, look, helps, concept) in enumerate(INDUSTRY_BLOCKS):
        slug, name, _summary, img, alt = INDUSTRIES[key]
        look_html = "".join(f'<li><span class="i i-chevron-right i-16"></span>{e(x)}</li>' for x in look)
        help_html = "".join(f'<li><span class="i i-check i-16"></span>{e(x)}</li>' for x in helps)
        tag = ""
        if concept:
            tag = f'<a class="tag tag--concept tag--link" href="{project_href(concept, root)}">See concept: {e(PROJECTS[concept]["name"])}</a>'
        out.append(f"""<article class="ledger__item industry-block" id="{slug}">
          <img class="industry-block__img" src="{root}assets/img/{img}" width="460" height="540" alt="{e(alt)}" loading="lazy" decoding="async">
          <div class="industry-block__content">
            <span class="t-index">{i + 1:02d}</span>
            <h2 class="t-h2">{e(name)}</h2>
            <div class="industry-block__lists">
              <div><h3 class="t-label">What your customers look for</h3><ul class="t-body">{look_html}</ul></div>
              <div><h3 class="t-label">What usually helps</h3><ul class="t-body">{help_html}</ul></div>
            </div>
            <div class="industry-block__footer">
              <a class="btn btn--secondary btn--md" href="{root}contact/">Discuss your project<span class="i i-arrow-right i-18"></span></a>
              {tag}
            </div>
          </div>
        </article>""")
    return "\n        ".join(out)


def _label(for_id, text, req=False, opt=False, tag="label"):
    extra = ""
    if req:
        extra = '<span class="field__req" aria-hidden="true">*</span>'
    if opt:
        extra = '<span class="field__opt">(optional)</span>'
    attr = f' for="{for_id}"' if tag == "label" else ""
    return f'<{tag} class="field__label"{attr}><span>{e(text)}</span>{extra}</{tag}>'


def _error(name):
    return (f'<p class="field__error" id="f-{name}-error" hidden><span class="i i-alert" aria-hidden="true"></span>'
            f'<span data-error-text></span></p>')


def _input(name, label, kind="text", req=False, opt=False, hint="", placeholder="", attrs=""):
    hint_html = f'<p class="field__hint" id="f-{name}-hint">{e(hint)}</p>' if hint else ""
    described = " ".join(x for x in (f"f-{name}-hint" if hint else "", f"f-{name}-error") if x)
    required = " required" if req else ""
    return f"""<div class="field">
            {_label(f"f-{name}", label, req, opt)}
            <input class="field__control" id="f-{name}" name="{name}" type="{kind}" placeholder="{e(placeholder)}" aria-describedby="{described}"{required} {attrs}>
            {hint_html}
            {_error(name)}
          </div>"""


def _select(name, label, options, placeholder, req=False, opt=False, hint=""):
    opts = f'<option value="">{e(placeholder)}</option>' + "".join(
        f'<option value="{e(v)}">{e(text)}</option>' for v, text in options)
    required = " required" if req else ""
    return f"""<div class="field">
            {_label(f"f-{name}", label, req, opt)}
            <div class="field__select">
              <select class="field__control" id="f-{name}" name="{name}" aria-describedby="f-{name}-hint f-{name}-error"{required}>{opts}</select>
              <span class="i i-chevron-down i-20" aria-hidden="true"></span>
            </div>
            <p class="field__hint" id="f-{name}-hint">{e(hint)}</p>
            {_error(name)}
          </div>"""


def enquiry_form(root):
    services = [(slug, name) for slug, name, _ in SERVICES] + [("help", "Not sure — help me choose")]
    budgets = [(x, x) for x in BUDGETS]
    prefs = "".join(
        f'<label class="radio-chip"><input type="radio" name="contact_pref" value="{v}"{" checked" if i == 0 else ""}><span>{e(v)}</span></label>'
        for i, v in enumerate(["WhatsApp", "Phone call", "Email"]))
    return f"""<form class="enquiry" id="enquiry" novalidate data-enquiry data-hide-action-bar
          data-endpoint="{e(FORM_ENDPOINT)}" data-wa-number="{WA_NUMBER}" data-email="{EMAIL}" aria-labelledby="enquiry-title">
          <div class="enquiry__head">
            <h2 class="t-h3" id="enquiry-title">Tell us about your project</h2>
            <p class="t-small">Fields marked * are required. It takes about two minutes.</p>
          </div>
          <div class="form-row">
            {_input("name", "Your name", req=True, placeholder="Your full name", attrs='autocomplete="name" maxlength="100"')}
            {_input("business", "Business name", opt=True, placeholder="e.g. Morning Crumb Bakery", attrs='autocomplete="organization" maxlength="120"')}
          </div>
          <div class="form-row">
            {_input("email", "Email", kind="email", hint="Add an email or a phone number so we can reply.", placeholder="name@business.com", attrs='autocomplete="email" inputmode="email" maxlength="160"')}
            {_input("phone", "Phone / WhatsApp", kind="tel", hint="We use WhatsApp only if you choose it below.", placeholder="10-digit mobile number", attrs='autocomplete="tel" inputmode="tel" maxlength="20"')}
          </div>
          <div class="form-row">
            {_select("service", "Service required", services, "Choose a service", req=True, hint="Not sure? Choose “Help me choose”.")}
            {_select("budget", "Estimated budget", budgets, "Select a range", opt=True, hint="Optional guidance only — it helps us suggest a sensible scope.")}
          </div>
          <div class="field">
            {_label("f-message", "Project description", req=True)}
            <textarea class="field__control" id="f-message" name="message" rows="4" minlength="15" maxlength="2000" required
              placeholder="What are you trying to achieve? Include any links, deadlines or examples you like." aria-describedby="f-message-hint f-message-error"></textarea>
            <div class="field__hint-row"><p class="field__hint" id="f-message-hint">At least 15 characters.</p><p class="field__count" data-counter aria-live="polite" hidden></p></div>
            {_error("message")}
          </div>
          <fieldset class="choice">
            {_label("", "Preferred contact method", tag="legend")}
            <div class="choice__options">{prefs}</div>
          </fieldset>
          <div class="field">
            <label class="consent">
              <input type="checkbox" id="f-consent" name="consent" value="yes" required aria-describedby="f-consent-error">
              <span class="consent__box" aria-hidden="true"><span class="i i-check i-16"></span></span>
              <span>I agree to be contacted about this enquiry. Read the <a href="{root}privacy-policy/">Privacy Policy</a>.</span>
            </label>
            {_error("consent")}
          </div>
          <div class="enquiry__hp" aria-hidden="true">
            <label for="f-website">Leave this field empty</label>
            <input id="f-website" name="company_website" type="text" tabindex="-1" autocomplete="off">
          </div>
          <div class="enquiry__actions">
            <button class="btn btn--primary" type="submit" data-send><span data-btn-text>Send enquiry</span><span class="i i-arrow-right"></span></button>
            <button class="btn btn--secondary" type="button" data-send-wa><span data-btn-text>Send via WhatsApp instead</span><span class="i i-whatsapp"></span></button>
          </div>
          <div class="form-status" data-form-status tabindex="-1" hidden></div>
          <p class="enquiry__note">We only use your details to reply to this enquiry. Nothing is shared or added to a mailing list.</p>
        </form>"""


def contact_aside(root):
    return f"""<aside class="contact-aside" aria-labelledby="direct-title">
          <h2 class="t-h3 hide-sm" id="direct-title">Prefer to talk directly?</h2>
          {contact_methods(root, "stack")}
          <div class="contact-location">
            <span class="i i-map-pin i-24" aria-hidden="true"></span>
            <p class="t-h4">Coimbatore, Tamil Nadu, India</p>
          </div>
          <div class="contact-follow hide-sm">
            <p class="t-label">Follow</p>
            <a href="{LINKEDIN}" target="_blank" rel="noopener"><span class="i i-linkedin i-24" aria-hidden="true"></span><span>LinkedIn — Freelance Web Developers</span><span class="i i-arrow-up-right" aria-hidden="true"></span></a>
            <a href="{WA_CHANNEL}" target="_blank" rel="noopener"><span class="i i-whatsapp" aria-hidden="true"></span><span>WhatsApp Channel — updates &amp; tips</span><span class="i i-arrow-up-right" aria-hidden="true"></span></a>
          </div>
          <p class="contact-privacy hide-sm"><span class="i i-info" aria-hidden="true"></span><span>Your details are used only to reply to your enquiry. <a href="{root}privacy-policy/">Read the Privacy Policy</a>.</span></p>
        </aside>"""


# ---------------------------------------------------------------- service pages
def wa_link(text):
    return f"https://wa.me/{WA_NUMBER}?text={quote(text, safe='')}"


def _intro(eyebrow, title, tid, lead, h="h2"):
    return f"""<div class="intro">
          <div class="intro__heading">
            <p class="eyebrow"><span>{e(eyebrow)}</span></p>
            <{h} class="t-h2" id="{tid}">{e(title)}</{h}>
          </div>
          <p class="intro__lead t-lead">{e(lead)}</p>
        </div>"""


def _glance_value(value, root):
    if value == "See Website Development":
        return f'<a href="{root}services/website-development/">See Website Development</a>'
    return e(value)


def svc_hero(slug, d, root):
    rows = "".join(f'<div><dt>{e(k)}</dt><dd>{_glance_value(v, root)}</dd></div>' for k, v in d["glance"])
    sec_label, sec_href = d["secondary"]
    return f"""<section class="svc-hero" aria-labelledby="svc-title">
      <div class="container svc-hero__grid">
        <div class="svc-hero__copy">
          {crumbs(["Services=services/", d["crumb"]], root)}
          <p class="eyebrow"><span>{e(d["eyebrow"])}</span></p>
          <h1 class="t-h1" id="svc-title">{e(d["title"])}<span class="dot-end">.</span></h1>
          <p class="t-lead">{e(d["lead"])}</p>
          <div class="svc-hero__actions">
            <a class="btn btn--primary" href="{root}contact/?service={slug}">{e(d["cta"])}<span class="i i-arrow-right"></span></a>
            <a class="btn btn--secondary" href="{sec_href}">{e(sec_label)}<span class="i i-arrow-right"></span></a>
          </div>
        </div>
        <div class="svc-hero__aside">
          <img class="svc-hero__img" src="{root}assets/img/{d["img"]}" width="480" height="360" alt="{e(d["alt"])}" fetchpriority="high">
          <div class="svc-glance">
            <h2 class="t-label">At a glance</h2>
            <dl>{rows}</dl>
            <p class="dot-note">{e(d["glance_note"])}</p>
          </div>
        </div>
      </div>
    </section>"""


def svc_explain(slug, d, root):
    x = d["explain"]
    kind = x["kind"]
    head = f'<p class="eyebrow"><span>{e(SHARED["explain_eyebrow"])}</span></p>\n          <h2 class="t-h2" id="explain-title">{e(x["h2"])}</h2>'
    if kind == "planner":
        rows = "".join(
            f'<li><span class="svc-timelines__time">{e(duration)}</span><span>{e(label)}</span></li>'
            for _k, _tab, duration, label, *_r in PLANNER
        )
        return f"""<section class="svc-explain svc-explain--planner" id="timelines" aria-labelledby="explain-title">
      <div class="container svc-explain__grid">
        <div class="svc-explain__heading">
          {head}
          <p class="t-lead svc-lead">{e(x["lead"])}</p>
          <p class="t-body svc-body">{e(x["body"])}</p>
          <ul class="svc-timelines show-sm" aria-label="Typical timelines">{rows}</ul>
        </div>
        <div class="svc-explain__planner hide-sm">{planner(root, "svc-plan")}</div>
      </div>
    </section>"""
    if kind == "body":
        paras = f'<p class="t-lead svc-lead">{e(x["paras"][0])}</p>\n          <p class="t-body svc-body">{e(x["paras"][1])}</p>'
        img = ""
        if x.get("img"):
            img = f'\n          <img class="svc-explain__img hide-sm" src="{root}assets/img/{x["img"]}" width="704" height="360" alt="" loading="lazy" decoding="async">'
        return f"""<section class="svc-explain" aria-labelledby="explain-title">
      <div class="container svc-explain__split">
        <div class="svc-explain__heading svc-explain__heading--narrow">
          {head}
        </div>
        <div class="svc-explain__body">
          {paras}{img}
        </div>
      </div>
    </section>"""
    stacked_head = f"""<div class="svc-explain__heading svc-explain__heading--wide">
          {head}
          <p class="t-lead">{e(x["lead"])}</p>
        </div>"""
    if kind == "lanes":
        lanes = "".join(
            f"""<li class="svc-lane{' svc-lane--optional' if i == len(x['lanes']) - 1 else ''}">
            <span class="t-index">{i + 1:02d}</span>
            <h3 class="t-h3">{e(title)}</h3>
            <p class="t-body">{e(text)}</p>
            <p class="svc-lane__cost"><span class="t-label">Cost</span><span>{e(cost)}</span></p>
          </li>""" for i, (title, text, cost) in enumerate(x["lanes"]))
        return f"""<section class="svc-explain" aria-labelledby="explain-title">
      <div class="container svc-stack">
        {stacked_head}
        <ol class="svc-lanes">{lanes}</ol>
      </div>
    </section>"""
    # ledger
    rows = "".join(
        f"""<tr>
              <th scope="row" class="t-h4">{e(q)}</th>
              <td class="t-body">{e(m)}</td>
              <td><span class="tags">{''.join(f'<span class="tag tag--category">{e(tool)}</span>' for tool in tools)}</span></td>
            </tr>""" for q, m, tools in x["rows"])
    return f"""<section class="svc-explain" aria-labelledby="explain-title">
      <div class="container svc-stack">
        {stacked_head}
        <table class="svc-ledger">
          <thead><tr><th scope="col">Business question</th><th scope="col">What we measure</th><th scope="col">Tools</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
        <p class="dot-note dot-note--md">{e(x["note"])}</p>
      </div>
    </section>"""


def svc_deliverables(d):
    groups = "".join(
        f"""<div class="svc-group">
            <h3 class="t-h4">{e(title)}</h3>
            <ul>{''.join(f'<li><span class="i i-check i-16"></span>{e(item)}</li>' for item in items)}</ul>
          </div>""" for title, items in d["groups"])
    note = f'\n        <p class="dot-note dot-note--md">{e(d["groups_note"])}</p>' if d.get("groups_note") else ""
    return f"""<section class="svc-deliver bg-surface" id="included" aria-labelledby="included-title">
      <div class="container svc-stack">
        {_intro("Deliverables", "What Is Included.", "included-title", SHARED["deliver_lead"])}
        <div class="svc-groups">{groups}</div>{note}
      </div>
    </section>"""


def svc_challenges(d):
    rows = "".join(
        f'<li><span class="t-index">{i + 1:02d}</span><h3 class="t-h4">{e(p)}</h3><p class="t-body">{e(s)}</p></li>'
        for i, (p, s) in enumerate(d["challenges"]))
    return f"""<section class="svc-challenges" aria-labelledby="challenges-title">
      <div class="container svc-split">
        <div class="svc-split__heading">
          <p class="eyebrow"><span>Common challenges</span></p>
          <h2 class="t-h2" id="challenges-title">Problems We Help Solve.</h2>
        </div>
        <ol class="svc-rows">{rows}</ol>
      </div>
    </section>"""


SVC_THEMES = {  # (process band, enquiry banner) per Figma › Pages — Services
    "website-development": ("espresso", "terracotta"), "seo-services": ("sand", "espresso"),
    "local-seo": ("white", "sand"), "social-media-marketing": ("espresso", "espresso"),
    "graphic-design": ("sand", "terracotta"), "branding-reputation": ("white", "espresso"),
    "ecommerce-marketing": ("espresso", "sand"), "analytics-tracking": ("sand", "terracotta"),
}
PROCESS_CLS = {"espresso": "bg-dark mode-dark", "sand": "svc-process--sand", "white": "bg-surface"}


def svc_process(d, theme="espresso"):
    steps = "".join(
        f'<li><span class="t-index">{i + 1:02d}</span><h3 class="t-h3">{e(title)}</h3><p class="t-small">{e(text)}</p></li>'
        for i, (title, text) in enumerate(d["steps"]))
    return f"""<section class="svc-process {PROCESS_CLS[theme]}" aria-labelledby="process-title">
      <div class="container svc-stack">
        {_intro("Process", d["process_title"], "process-title", SHARED["process_lead"])}
        <ol class="svc-steps">{steps}</ol>
      </div>
    </section>"""


def svc_work(d, root):
    cards = [project_card(key, root, "compact", "h3", tag=tag, body=body, meta=meta,
                          extra_cls=" hide-sm" if i else "")
             for i, (key, tag, body, meta) in enumerate(d["work"])]
    more = ""
    if len(d["work"]) < 3:
        more = f"""<div class="svc-more hide-sm">
            <p class="t-h3">See every concept, filtered by service.</p>
            <a class="link" href="{root}work/">View all work<span class="i i-arrow-right"></span></a>
          </div>"""
    return f"""<section class="svc-work" aria-labelledby="work-title">
      <div class="container svc-stack svc-stack--48">
        {_intro("Relevant work", "Where This Fits In Our Work.", "work-title", SHARED["work_lead"])}
        <div class="svc-cards">
          {"".join(cards)}
          {more}
        </div>
        <a class="link link--md show-sm svc-work__all" href="{root}work/">View all work<span class="i i-arrow-right i-18"></span></a>
      </div>
    </section>"""


def svc_faq(slug, d):
    key = "svc-" + slug
    FAQS[key] = d["faqs"]
    return f"""<section class="svc-faq" aria-labelledby="faq-title">
      <div class="container faq-section__grid">
        <div class="faq-section__heading">
          <p class="eyebrow"><span>FAQ</span></p>
          <h2 class="t-h2" id="faq-title">{e(d["faq_title"])}</h2>
          <p class="t-small svc-faq__note">Something else? <a href="{WA_URL}" target="_blank" rel="noopener" data-wa>Ask us on WhatsApp</a> — we reply personally.</p>
        </div>
        {faq(key)}
      </div>
    </section>"""


def svc_related(d, root):
    cards = "".join(
        f"""<li><a class="svc-related__card" href="{root}services/{s}/">
            <span class="svc-related__top"><span class="t-index">{num}</span><span class="i i-arrow-right"></span></span>
            <span class="svc-related__text"><span class="t-h4">{e(name)}</span><span class="t-small">{e(text)}</span></span>
          </a></li>""" for s, num, name, text in d["related"])
    return f"""<section class="svc-related bg-surface" aria-labelledby="related-title">
      <div class="container svc-stack svc-stack--40">
        <h2 class="t-h3" id="related-title">Related services</h2>
        <ul class="svc-related__list">{cards}</ul>
      </div>
    </section>"""


def svc_cta(slug, d, root, theme="terracotta"):
    wa = wa_link(f"Hi, I’d like to discuss {d['crumb']}.")
    cls = {"terracotta": "cta-banner mode-dark", "espresso": "cta-banner cta-banner--espresso mode-dark",
           "sand": "cta-banner cta-banner--sand"}[theme]
    btn = "btn--primary" if theme == "sand" else "btn--solid"
    return f"""<section class="svc-cta" aria-label="Start a project">
      <div class="container">
        <div class="{cls}">
          <div class="cta-banner__copy">
            <h2 class="t-h2">{e(d["cta_title"])}</h2>
            <p class="t-lead">{e(d["cta_text"])}</p>
          </div>
          <div class="cta-banner__actions">
            <a class="btn {btn}" href="{wa}" target="_blank" rel="noopener" data-wa>{e(d["cta"])}<span class="i i-whatsapp"></span></a>
            <a class="btn btn--secondary" href="{root}contact/?service={slug}">Send a Project Enquiry<span class="i i-arrow-right"></span></a>
            <p class="cta-banner__note">{e(SHARED["cta_note"])}</p>
          </div>
        </div>
      </div>
    </section>"""


def service_main(slug, root):
    d = SERVICE_PAGES[slug]
    parts = [svc_hero(slug, d, root), svc_explain(slug, d, root), svc_deliverables(d), svc_challenges(d),
             svc_process(d, SVC_THEMES[slug][0]), svc_work(d, root), svc_faq(slug, d), svc_related(d, root),
             svc_cta(slug, d, root, SVC_THEMES[slug][1])]
    return '  <main id="main">\n\n    ' + "\n\n    ".join(parts) + "\n  </main>\n"


def service_jsonld(slug):
    d = SERVICE_PAGES[slug]
    url = f"{SITE}/services/{slug}/"
    data = [
        {"@context": "https://schema.org", "@type": "Service", "name": d["eyebrow"].split(" · ", 1)[1],
         "serviceType": d["crumb"], "description": d["lead"], "url": url, "areaServed": "Coimbatore, Tamil Nadu, India",
         "provider": {"@type": "ProfessionalService", "name": "Freelance Web Developers", "url": SITE + "/",
                      "telephone": TEL_MAIN, "email": EMAIL}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Services", "item": SITE + "/services/"},
            {"@type": "ListItem", "position": 3, "name": d["crumb"], "item": url}]},
    ]
    return "\n  " + "\n  ".join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False) + "</script>" for x in data)


# ---------------------------------------------------------------- chrome
def head(page, root):
    path = page["path"]
    canonical = SITE + "/" + (path + "/" if path else "")
    return f"""<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(page["title"])}</title>
  <meta name="description" content="{e(page["description"])}">
  <link rel="canonical" href="{canonical}">
  <meta name="theme-color" content="#F7F4EF">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Freelance Web Developers">
  <meta property="og:locale" content="en_IN">
  <meta property="og:title" content="{e(page["title"])}">
  <meta property="og:description" content="{e(page["description"])}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{SITE}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="{root}favicon.ico" sizes="any">
  <link rel="icon" href="{root}assets/img/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="{root}apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&amp;family=Manrope:wght@300;500;600;700&amp;display=swap">
  <link rel="stylesheet" href="{root}assets/css/site.css">
  <script>document.documentElement.classList.add('js');</script>
  <script defer src="{root}assets/js/site.js"></script>{page.get("head_extra", "")}
</head>"""


def header(page, root):
    cur = page.get("nav")

    def a(key, href, label):
        if cur != key:
            return f'<a class="nav__link" href="{href}">{label}</a>'
        if page.get("exact", True):
            return f'<a class="nav__link" href="{href}" aria-current="page">{label}</a>'
        return f'<a class="nav__link is-current" href="{href}">{label}</a>'

    services_cur = " is-current" if cur == "services" else ""
    col1 = "".join(services_menu_item(i, s, root, page.get("service")) for i, s in enumerate(SERVICES[:4]))
    col2 = "".join(services_menu_item(i + 4, s, root, page.get("service")) for i, s in enumerate(SERVICES[4:]))
    return f"""<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <span class="scroll-sentinel" aria-hidden="true" data-sentinel></span>
  <header class="site-header" data-header>
    <div class="container site-header__inner">
    {logo(root)}
      <nav class="nav" aria-label="Primary">
        {a("home", root or "./", "Home")}
        {a("about", root + "about/", "About")}
        <button class="nav__link{services_cur}" type="button" aria-expanded="false" aria-controls="services-menu" data-services-toggle>Services<span class="i i-chevron-down"></span></button>
        {a("work", root + "work/", "Our Work")}
        {a("industries", root + "industries/", "Industries")}
        {a("contact", root + "contact/", "Contact")}
      </nav>
      <a class="btn btn--primary btn--md site-header__cta" href="{root}contact/">Discuss Your Project</a>
      <button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu" data-menu-open><span class="i i-menu"></span></button>
      <div class="services-menu" id="services-menu" hidden data-services-menu>
        <div class="services-menu__cols">
          <ul class="services-menu__col">{col1}</ul>
          <ul class="services-menu__col">{col2}</ul>
        </div>
        <div class="services-menu__promo">
          <div>
            <p class="t-h4">Not sure where to start?</p>
            <p class="t-small" style="margin-top:8px">Answer two quick questions and we will point you to the service that fits your goal.</p>
          </div>
          <div class="services-menu__links">
            <a class="link link--md" href="{root}services/#finder">Find the right service<span class="i i-arrow-right i-18"></span></a>
            <a class="link link--md" href="{root}services/">View all services<span class="i i-arrow-right i-18"></span></a>
          </div>
        </div>
      </div>
    </div>
  </header>
{drawer(page, root)}"""


def services_menu_item(i, s, root, current=None):
    slug, name, desc = s
    cur = ' aria-current="page"' if current == slug else ""
    return f"""<li><a class="services-menu__item" href="{root}services/{slug}/"{cur}><span class="t-index">{i + 1:02d}</span><span class="services-menu__text"><span class="services-menu__name">{e(name)}</span><span class="services-menu__desc">{e(desc)}</span></span></a></li>"""


def drawer(page, root):
    cur = page.get("nav")

    def link(key, href, label):
        attr = ' aria-current="page"' if cur == key and page.get("exact", True) else ""
        return f'<a class="drawer__link" href="{href}"{attr}>{label}</a>'

    current = ' aria-current="page"'
    subs = "".join(
        f'<a href="{root}services/{slug}/"{current if page.get("service") == slug else ""}>{e(name)}</a>'
        for slug, name, _ in SERVICES
    )
    open_services = cur == "services"
    return f"""  <div class="drawer" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" data-drawer hidden>
    <div class="drawer__head">
      {logo(root)}
      <button class="icon-btn" type="button" aria-label="Close menu" data-menu-close><span class="i i-close"></span></button>
    </div>
    <nav class="drawer__nav" aria-label="Mobile">
      {link("home", root or "./", "Home")}
      {link("about", root + "about/", "About")}
      <button class="drawer__link" type="button" aria-expanded="{'true' if open_services else 'false'}" aria-controls="drawer-services" data-drawer-services>Services<span class="i {'i-minus' if open_services else 'i-plus'}"></span></button>
      <div class="drawer__sub" id="drawer-services"{'' if open_services else ' hidden'}><a href="{root}services/">All services</a>{subs}</div>
      {link("work", root + "work/", "Our Work")}
      {link("industries", root + "industries/", "Industries")}
      {link("contact", root + "contact/", "Contact")}
    </nav>
    <div class="drawer__quick">
      <a class="btn btn--primary btn--md btn--block" href="{WA_URL}" target="_blank" rel="noopener" data-wa>Chat on WhatsApp<span class="i i-whatsapp i-18"></span></a>
      <a class="btn btn--secondary btn--md btn--block" href="tel:{TEL_MAIN}">Call +91 95007 85451<span class="i i-phone i-18"></span></a>
      <p>Coimbatore, Tamil Nadu, India</p>
    </div>
  </div>"""


def footer(page, root):
    enquire = "#enquiry" if page["path"] == "contact" else f"{root}contact/"
    services = "".join(f'<li><a href="{root}services/{slug}/">{e(name)}</a></li>' for slug, name, _ in SERVICES)
    return f"""  <footer class="site-footer mode-dark">
    <div class="container">
      <div class="footer__statement">
        <p class="t-h1"><span>Your Business.</span><span>Our Digital Solutions.</span></p>
        <div class="footer__actions">
          <a class="btn btn--primary" href="{WA_URL}" target="_blank" rel="noopener" data-wa>Start a Conversation<span class="i i-whatsapp"></span></a>
          <a class="btn btn--secondary" href="{root}contact/">Send a Project Enquiry<span class="i i-arrow-right"></span></a>
        </div>
      </div>
      <div class="footer__rule"></div>
      <div class="footer__cols">
        <div class="footer__col footer__col--brand">
          {logo(root, dark=True, tagline=True)}
          <p class="t-small">An independent digital solutions studio in Coimbatore, helping growing businesses with websites, search visibility, creative design and digital marketing.</p>
        </div>
        <nav class="footer__col footer__col--services t-small" aria-label="Services">
          <p class="footer__heading t-label">Services</p>
          <ul class="footer__col">{services}</ul>
        </nav>
        <nav class="footer__col footer__col--studio t-small" aria-label="Studio">
          <p class="footer__heading t-label">Studio</p>
          <ul class="footer__col">
            <li><a href="{root or './'}">Home</a></li>
            <li><a href="{root}about/">About</a></li>
            <li><a href="{root}work/">Our Work</a></li>
            <li><a href="{root}industries/">Industries</a></li>
            <li><a href="{root}contact/">Contact</a></li>
            <li><a href="{root}privacy-policy/">Privacy Policy</a></li>
          </ul>
        </nav>
        <div class="footer__col footer__col--contact t-small">
          <p class="footer__heading t-label">Contact</p>
          <a class="footer__contact" href="{WA_URL}" target="_blank" rel="noopener" data-wa><span class="i i-whatsapp i-18"></span><span>+91 95007 85451<small>WhatsApp &amp; calls</small></span></a>
          <a class="footer__contact" href="tel:{TEL_CALLS}"><span class="i i-phone i-18"></span><span>+91 63807 34733<small>Calls only</small></span></a>
          <a class="footer__contact" href="mailto:{EMAIL}"><span class="i i-mail i-18"></span><span>{EMAIL}<small>Email</small></span></a>
          <p class="footer__contact"><span class="i i-map-pin"></span><span>Coimbatore, Tamil Nadu, India<small>Based in Coimbatore</small></span></p>
        </div>
        <div class="footer__col footer__col--follow t-small">
          <p class="footer__heading t-label">Follow</p>
          <a class="footer__contact" href="{LINKEDIN}" target="_blank" rel="noopener"><span class="i i-linkedin"></span><span>LinkedIn</span></a>
          <a class="footer__contact" href="{WA_CHANNEL}" target="_blank" rel="noopener"><span class="i i-whatsapp i-18"></span><span>WhatsApp Channel</span></a>
        </div>
      </div>
      <div class="footer__rule"></div>
      <div class="footer__legal t-caption">
        <p>© <span data-year>2026</span> Freelance Web Developers. All rights reserved.</p>
        <a class="footer__top" href="#main">Back to top<span class="i i-arrow-up i-16"></span></a>
      </div>
    </div>
  </footer>
  <nav class="action-bar" aria-label="Quick contact" data-action-bar>
    <a href="tel:{TEL_MAIN}"><span class="i i-phone i-18"></span>Call</a>
    <a class="is-primary" href="{WA_URL}" target="_blank" rel="noopener" data-wa><span class="i i-whatsapp i-18"></span>WhatsApp</a>
    <a href="{enquire}"><span class="i i-arrow-up-right i-18"></span>Enquire</a>
  </nav>
</body>
</html>
"""


def ld(*objs):
    return "".join("\n  " + '<script type="application/ld+json">' + json.dumps(o, ensure_ascii=False) + "</script>" for o in objs)


def home_jsonld():
    return ld({
        "@context": "https://schema.org", "@type": "ProfessionalService",
        "name": "Freelance Web Developers", "url": SITE + "/", "image": SITE + "/og-image.png",
        "logo": SITE + "/assets/img/logo-lockup.png",
        "description": "Independent digital solutions studio in Coimbatore: websites, SEO, local search, social media, design and analytics.",
        "telephone": TEL_MAIN, "email": EMAIL,
        "address": {"@type": "PostalAddress", "addressLocality": "Coimbatore", "addressRegion": "Tamil Nadu", "addressCountry": "IN"},
        "areaServed": "Coimbatore, Tamil Nadu, India", "sameAs": [LINKEDIN],
    })


def breadcrumb_jsonld(items):
    """items: [(name, path)] after Home."""
    trail = [("Home", "")] + items
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + "/" + (p + "/" if p else "")}
        for i, (n, p) in enumerate(trail)]}


def case_jsonld():
    return ld({
        "@context": "https://schema.org", "@type": "CreativeWork", "name": "Morning Crumb Bakery — concept website",
        "description": "A mobile-first website concept for a small-batch bakery. Concept project — no results claimed.",
        "url": SITE + "/work/morning-crumb/", "creator": {"@type": "Organization", "name": "Freelance Web Developers", "url": SITE + "/"},
    }, breadcrumb_jsonld([("Our Work", "work"), ("Morning Crumb Bakery", "work/morning-crumb")]))


def write_seo_files(pages, today):
    urls = []
    for page in pages:
        loc = SITE + "/" + (page["path"] + "/" if page["path"] else "")
        urls.append(f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{today}</lastmod>\n  </url>")
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "\n".join(urls) + "\n</urlset>\n")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n").write(sitemap)
    robots = f"# robots.txt — Freelance Web Developers\nUser-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n"
    open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8", newline="\n").write(robots)


# ---------------------------------------------------------------- build
def expand(body, root):
    def sub(m):
        parts = m.group(1).split(":")
        kind = parts[0]
        if kind == "root":
            return root
        if kind == "home":
            return root or "./"
        if kind == "wa":
            return WA_URL
        if kind == "tel":
            return TEL_MAIN
        if kind == "tel-calls":
            return TEL_CALLS
        if kind == "email":
            return EMAIL
        if kind == "browser":
            return browser(parts[1], root, raised="raised" in parts[2:], label="decor" not in parts[2:])
        if kind == "phone":
            return phone(parts[1], root)
        if kind == "project":
            return project_card(parts[1], root, parts[2] if len(parts) > 2 else "feature", parts[3] if len(parts) > 3 else "h3")
        if kind == "project-href":
            return project_href(parts[1], root)
        if kind == "cta":
            return cta_banner(root, parts[1] if len(parts) > 1 else "terracotta", parts[2] if len(parts) > 2 else "default")
        if kind == "crumbs":
            return crumbs(parts[1:], root)
        if kind == "toc":
            return toc()
        if kind == "industry-jump":
            return industry_jump()
        if kind == "industry-blocks":
            return industry_blocks(root)
        if kind == "ledger":
            return ledger(root)
        if kind == "planner":
            return planner(root, parts[1] if len(parts) > 1 else "plan")
        if kind == "faq":
            return faq(parts[1])
        if kind == "finder":
            return finder(root)
        if kind == "process":
            return process(root, parts[1].split(",") if len(parts) > 1 else None)
        if kind == "offer":
            return offer(root)
        if kind == "industry":
            return industry_tile(parts[1], root, parts[2] if len(parts) > 2 else "h3")
        if kind == "contact-methods":
            return contact_methods(root, parts[1] if len(parts) > 1 else "")
        if kind == "contact-aside":
            return contact_aside(root)
        if kind == "enquiry-form":
            return enquiry_form(root)
        raise KeyError(m.group(0))

    return re.sub(r"\{\{([^{}]+)\}\}", sub, body)


def build(pages):
    for page in pages:
        depth = len(page["path"].split("/")) if page["path"] else 0
        root = "../" * depth
        if page.get("service_page"):
            src = service_main(page["service_page"], root)
            page.setdefault("head_extra", service_jsonld(page["service_page"]))
        else:
            src = open(os.path.join(HERE, "pages", page["src"]), encoding="utf-8").read()
        out = head(page, root) + "\n" + header(page, root) + "\n" + expand(src, root) + "\n" + footer(page, root)
        target = os.path.join(ROOT, *page["path"].split("/"), "index.html") if page["path"] else os.path.join(ROOT, "index.html")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8", newline="\n") as f:
            f.write(out)
        print("wrote", os.path.relpath(target, ROOT))


if __name__ == "__main__":
    import datetime
    from pages_config import PAGES
    from embed_icons import embed
    for _p in PAGES:
        if _p["path"] == "":
            _p.setdefault("head_extra", home_jsonld())
        elif _p["path"] == "work/morning-crumb":
            _p.setdefault("head_extra", case_jsonld())
    build(PAGES)
    write_seo_files(PAGES, datetime.date.today().isoformat())
    print("icons embedded in site.css:", embed())
