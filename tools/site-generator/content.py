"""Shared page content used by build.py snippets."""

# Services overview ledger (Figma › Pages · Core › Services › 2 · Service ledger)
LEDGER = [
    ("website-development", "Website Development & Digital Presence", "16 services",
     "Business, corporate and e-commerce websites, landing pages and redesigns — built mobile-first, fast and easy to update, with care plans after launch.",
     ["Business & corporate sites", "Shopify & WooCommerce", "Landing pages", "WordPress & custom builds", "Speed, security & care", "Domain, hosting & DNS"],
     "Explore website development", "photo-tablet-wireframe.jpg", "A designer sketching website wireframes on a tablet"),
    ("seo-services", "SEO & Organic Search", "20 services",
     "Audits, technical fixes, on-page and content optimisation, structured data and honest reporting — so the right people can find your pages.",
     ["SEO audit", "Technical SEO", "On-page & content", "Schema markup", "Core Web Vitals", "Search Console & reporting"],
     "Explore SEO services", "photo-seo-desk.jpg", "Hands planning page layouts on paper beside a phone"),
    ("local-seo", "Local SEO & Google Business Profile", "10 services",
     "Profile optimisation, local pages, citations and an ethical review strategy for businesses that serve nearby customers.",
     ["Google Business Profile", "Maps visibility", "Local keywords", "Citations & listings", "Review strategy", "Local reports"],
     "Explore local SEO", "photo-shop-counter.jpg", "A shop assistant helping a customer at the counter"),
    ("social-media-marketing", "Social Media Marketing", "11 services",
     "Strategy, content calendars, post design, reels and reporting for Instagram, LinkedIn, YouTube and Threads.",
     ["Strategy & planning", "Content calendars", "Posts, reels & carousels", "Account management", "Engagement campaigns", "Monthly reports"],
     "Explore social media", "photo-restaurant.jpg", "A warmly lit restaurant interior"),
    ("graphic-design", "Graphic Design & Creative Services", "12 services",
     "Logos, business cards, menus, catalogues, posters, social creatives and pitch decks — consistent and print-ready.",
     ["Logo design", "Menus & catalogues", "Posters & banners", "Social creatives", "Presentations", "Print-ready artwork"],
     "Explore graphic design", "photo-design-swatches.jpg", "Colour swatches and printed design samples"),
    ("branding-reputation", "Branding & Online Reputation", "15 services",
     "Brand strategy and identity, reputation monitoring and PR — three related services kept clearly separate.",
     ["Brand strategy", "Visual identity", "Voice & messaging", "Reputation monitoring", "Review responses", "Digital PR"],
     "Explore branding", "photo-textiles.jpg", "Sage-green T-shirts on wooden hangers"),
    ("ecommerce-marketing", "E-commerce Marketing", "18 services",
     "Store optimisation, product listings, Amazon and Flipkart, Shopping feeds and retention campaigns for online sellers.",
     ["Store optimisation", "Product listings", "Amazon & Flipkart", "Shopping feeds & ads", "Cart recovery", "Loyalty campaigns"],
     "Explore e-commerce marketing", "photo-home-interior.jpg", "A bright furniture showroom with lamps and chairs"),
    ("analytics-tracking", "Analytics, Tracking & Reporting", "19 services",
     "GA4, Tag Manager, conversion tracking and dashboards that turn numbers into decisions.",
     ["GA4 & Search Console", "Google Tag Manager", "Meta Pixel & CAPI", "Conversion tracking", "Looker Studio & Power BI", "ROAS & CAC analysis"],
     "Explore analytics", "photo-analytics-laptop.jpg", "A laptop showing an analytics dashboard"),
]

# Timeline planner tabs (verified timelines carried over from the previous site)
PLANNER = [
    ("single", "Single page", "1 week", "Single-page website", 1,
     ["Up to 6 content sections", "WhatsApp & lead form integration", "Mobile-first, SEO-ready build"],
     "Start a single-page website"),
    ("business", "Up to 5 pages", "2 weeks", "Business website, up to 5 pages", 2,
     ["Custom design across 5 pages", "Maps, social & enquiry integration", "On-page SEO foundations"],
     "Start a business website"),
    ("ecommerce", "E-commerce", "4+ weeks", "E-commerce & custom builds", 4,
     ["Catalogue, cart & checkout", "Payment gateway integration", "Custom workflows & APIs"],
     "Discuss an e-commerce build"),
]

FAQS = {
    "services": [
        ("Can I combine services?",
         "Yes. Many projects combine a website with local SEO or tracking. We scope them together so the work fits and nothing is duplicated."),
        ("Do you offer monthly plans?",
         "Ongoing work such as SEO, social media or maintenance can be arranged monthly. The scope and fee are agreed in writing first."),
        ("Are advertising budgets and platform fees included?",
         "No. Ad spend, marketplace fees, hosting, domains and other third-party costs are paid to the provider and shown separately in your quote."),
        ("What if I am not sure what I need?",
         "Use the service finder above, or simply describe your goal on WhatsApp. We will suggest a sensible first step — even if it is a small one."),
    ],
    "contact": [
        ("How much does a website cost?",
         "It depends on the pages, features and platform. After a short conversation we send a written quote. The budget field in the form is optional — it simply helps us suggest a sensible scope."),
        ("Do you only work with businesses in Coimbatore?",
         "We are based in Coimbatore. If you are elsewhere, message us — much of the work can be done remotely."),
        ("Which contact method is fastest?",
         "WhatsApp on +91 95007 85451 is usually the quickest way to reach us. You can also call +91 63807 34733 or email freelance.work2k26@gmail.com."),
        ("What happens to the details I send?",
         "They are used only to reply to your enquiry. Nothing is sold or added to a mailing list. See the Privacy Policy for details."),
    ],
}

# Enquiry form budget ranges (carried over from the previous site)
BUDGETS = ["Under ₹5,000", "₹5,000–₹10,000", "₹10,000–₹25,000", "₹25,000+", "Not sure yet"]


# Industries page blocks: (key, look-for list, helps list, concept project key or None)
INDUSTRY_BLOCKS = [
    ("bakery", ["Today’s menu and prices", "Opening hours and location", "A quick way to order or reserve", "Recent reviews and photos"],
     ["Mobile-first menu website", "Google Business Profile & reviews", "WhatsApp pre-orders", "Menu and festival creatives"], "crumb"),
    ("retail", ["What you stock and what it costs", "Whether an item is available", "Directions and parking", "Offers and new arrivals"],
     ["Catalogue website or online store", "Local SEO & Google Maps", "Product photography & posters", "Instagram content"], "loom"),
    ("beauty", ["Services and starting prices", "Availability and easy booking", "Hygiene, calm and trust", "Reviews from real clients"],
     ["Service-menu website with WhatsApp booking", "Google Business Profile & reviews", "Reels and stories", "Brand identity"], "ember"),
    ("gym", ["Class timetables", "Membership options", "A free trial or first visit", "Location and facilities"],
     ["Website with timetable and trial enquiries", "Local SEO", "Social content and reels", "Tracking enquiries from ads"], None),
    ("professional", ["Real expertise and credentials", "Clear services and process", "An easy way to book a consultation", "Useful, credible content"],
     ["Corporate website", "LinkedIn company page", "SEO and content", "Analytics and reporting"], "northline"),
    ("startups", ["A credible first impression", "A clear explanation of what you do", "A way to sign up or enquire", "Proof you are real and reachable"],
     ["Landing page in one week", "Logo and brand basics", "Launch campaign creatives", "GA4 from day one"], "hillside"),
    ("ecommerce", ["Clear product photos and details", "Delivery, returns and secure payment", "A simple checkout", "Reasons to come back"],
     ["Shopify or WooCommerce store", "Listings, Amazon & Flipkart", "Shopping feeds and ads", "E-commerce tracking"], "terra"),
]
