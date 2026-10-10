PAGES = [
    dict(
        src="home.html", path="", nav="home",
        title="Freelance Web Developers in Coimbatore | Websites, SEO & Digital Marketing",
        description="An independent digital solutions studio in Coimbatore: website development, SEO, local search, social media, design and analytics for growing businesses.",
    ),
    dict(
        src="about.html", path="about", nav="about",
        title="About Us | Freelance Web Developers, Coimbatore",
        description="A small, independent digital solutions studio in Coimbatore. How we work, what we commit to, who we work with and typical website timelines.",
    ),
    dict(
        src="services.html", path="services", nav="services",
        title="Services | Websites, SEO, Social Media & Analytics in Coimbatore",
        description="Eight areas of work — website development, SEO, local SEO, social media, graphic design, branding, e-commerce marketing and analytics — with clear, written quotes.",
    ),
    dict(
        src="work.html", path="work", nav="work",
        title="Our Work | Concept Website Projects by Freelance Web Developers",
        description="Concept projects that show how we approach structure, design and usability for bakeries, engineering firms, salons, retailers and online stores.",
    ),
    dict(
        src="case-morning-crumb.html", path="work/morning-crumb", nav="work", exact=False,
        title="Morning Crumb Bakery | Concept Case Study | Freelance Web Developers",
        description="A mobile-first website concept for a small-batch bakery: today’s menu, pickup pre-orders via WhatsApp and one-tap calling. Concept project — no results claimed.",
    ),
    dict(
        src="industries.html", path="industries", nav="industries",
        title="Industries | Websites & Marketing for Local Businesses in Coimbatore",
        description="What usually helps bakeries, shops, salons, gyms, professional firms, startups and online stores get found and contacted online.",
    ),
    dict(
        src="contact.html", path="contact", nav="contact",
        title="Contact Us | Freelance Web Developers, Coimbatore",
        description="Tell us about your project. WhatsApp +91 95007 85451, call +91 63807 34733 or send an enquiry — we reply with a practical next step, a few questions or a quote.",
    ),
    dict(
        src="privacy.html", path="privacy-policy", nav="",
        title="Privacy Policy | Freelance Web Developers, Coimbatore",
        description="What this website collects, why, and the choices you have. We only use what you choose to send us, only to reply to you, and we never sell it.",
    ),
]

from content_services import SERVICE_PAGES  # noqa: E402

for _slug, _d in SERVICE_PAGES.items():
    PAGES.append(dict(
        service_page=_slug, path=f"services/{_slug}", nav="services", exact=False, service=_slug,
        title=f"{_d['crumb']} in Coimbatore | Freelance Web Developers",
        description=_d["lead"],
    ))
