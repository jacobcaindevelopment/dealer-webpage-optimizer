// Demo dataset for the fictional dealership "Premium Auto Group" (demo-premium-auto.com).
// The domain intentionally does not exist — sample audits never touch the network.
// Each page's HTML is crafted so the analysis engine produces a realistic mix of
// findings: top-traffic pages carry real issues, well-built pages come back clean.

export const DEMO_DOMAIN = "demo-premium-auto.com";

interface DemoPageOpts {
  title?: string;
  desc?: string;
  canonical?: string;
  og?: boolean;
  viewport?: boolean;
  schema?: string; // JSON-LD @type, omit for none
  body: string;
}

function demoPage(o: DemoPageOpts): string {
  const head = [
    o.title ? `<title>${o.title}</title>` : "",
    o.desc ? `<meta name="description" content="${o.desc}">` : "",
    o.viewport !== false ? `<meta name="viewport" content="width=device-width, initial-scale=1">` : "",
    o.canonical ? `<link rel="canonical" href="${o.canonical}">` : "",
    o.og ? `<meta property="og:title" content="${o.title}"><meta property="og:description" content="${o.desc || ""}"><meta property="og:image" content="https://demo-premium-auto.com/og.jpg">` : "",
    o.schema ? `<script type="application/ld+json">{"@context":"https://schema.org","@type":"${o.schema}","name":"Premium Auto Group"}</script>` : "",
  ].join("\n");
  return `<!DOCTYPE html><html lang="en"><head>${head}</head><body>${o.body}</body></html>`;
}

const NAV = `<nav>
  <a href="/">Home</a>
  <a href="/new-inventory">New</a>
  <a href="/used-inventory">Used</a>
  <a href="/finance">Financing</a>
  <a href="/value-your-trade">Trade</a>
</nav>`;

const FOOTER = `<footer><p>Premium Auto Group · 4200 Motor Row, Cincinnati, OH 45202 · (513) 555-0147</p></footer>`;

const DEMO_PAGES: Record<string, string> = {
  // Homepage — solid basics, but no schema, incomplete OG, two images missing alt.
  "/": demoPage({
    title: "Premium Auto Group | New & Used Cars in Cincinnati, OH",
    desc: "Shop new and used cars, trucks, and SUVs at Premium Auto Group in Cincinnati. Fair prices, easy financing, and a service center you can trust.",
    canonical: "https://demo-premium-auto.com/",
    body: `${NAV}
<h1>Cincinnati's Trusted Auto Dealer Since 1998</h1>
<p>Welcome to Premium Auto Group, where Cincinnati drivers have found their next vehicle for more than twenty-five years. Our family-owned dealership carries a full selection of new vehicles alongside a deep pre-owned inventory of cars, trucks, and SUVs from every major brand. Every visit starts the same way: no pressure, straight answers, and pricing you can verify before you ever step on the lot.</p>
<img src="/img/showroom.jpg" alt="Premium Auto Group showroom exterior">
<img src="/img/lot.jpg">
<img src="/img/team.jpg">
<img src="/img/service-bay.jpg" alt="Service bay with technicians at work">
<img src="/img/family.jpg" alt="Family picking up their new SUV">
<img src="/img/badge.png" alt="">
<h2>Why Drivers Choose Us</h2>
<p>With a 4.8 star rating across more than 2,100 Google reviews, our reputation is built one customer at a time. We were named a DealerRater Consumer Satisfaction Award winner three years running, and our service department is staffed by factory-trained technicians who work on all makes and models. From your first test drive to your fifth oil change, the experience stays consistent.</p>
<h2>Shop the Way You Want</h2>
<p>Browse our complete inventory online, value your trade from your couch, and get pre-approved for financing in minutes. Prefer to talk it through in person? Stop by seven days a week — our team is here with transparent answers and the keys ready. Whether you are a first-time buyer or replacing the family workhorse, we will meet you where you are.</p>
<p><a href="/new-inventory">Shop New Inventory</a> <a href="/used-inventory">Shop Used Inventory</a> <a href="/finance">Get Pre-Approved</a> <a href="/value-your-trade">Value My Trade</a> <a href="/specials">See Specials</a> <a href="/service">Service Center</a></p>
<h2>Service and Parts, Under the Same Roof</h2>
<p>Buying the vehicle is only the beginning. Our twelve-bay service center keeps you on the road with factory-trained technicians, genuine parts, and honest estimates — and because sales and service share one building, your history travels with your vehicle. That continuity is why so many customers come back for their second, third, and fourth vehicles.</p>
<h2>Serving Greater Cincinnati</h2>
<p>Drivers reach us easily from Covington, Newport, Florence, Mason, West Chester, and everywhere between. Located minutes from downtown with convenient highway access, Premium Auto Group has become the first stop for thousands of households across southwest Ohio and northern Kentucky. Stop in for a test drive, bring your questions about financing or trade values, and see for yourself why neighbors keep recommending us to neighbors after more than twenty-five years on Motor Row.</p>
<p>Sales Hours: Mon-Sat 9am-8pm, Sun 11am-5pm. Call us at (513) 555-0147 or visit us on Motor Row in downtown Cincinnati.</p>
${FOOTER}`,
  }),

  // New inventory SRP — thin filter-only page, no deals messaging, no meta description.
  "/new-inventory": demoPage({
    title: "New Vehicles | Premium Auto Group",
    canonical: "https://demo-premium-auto.com/new-inventory",
    body: `${NAV}
<h1>New Vehicles</h1>
<div class="filters">Filter by: Make · Model · Body Style · Price · Color</div>
<div class="vehicle-grid">
  <div class="card"><img src="/img/v1.jpg" alt="2026 sedan front view">2026 Sedan LX — $28,450</div>
  <div class="card"><img src="/img/v2.jpg" alt="2026 SUV front view">2026 SUV EX — $36,900</div>
  <div class="card"><img src="/img/v3.jpg" alt="2026 truck front view">2026 Truck LT — $41,200</div>
</div>
<p>Showing 3 of 147 vehicles. Use the filters above to narrow your search.</p>
${FOOTER}`,
  }),

  // Used inventory SRP — no count in title, thin content, no CPO mention.
  "/used-inventory": demoPage({
    title: "Used Cars for Sale in Cincinnati | Premium Auto Group",
    desc: "Browse quality used cars, trucks, and SUVs at Premium Auto Group in Cincinnati. Every vehicle inspected and priced to market.",
    canonical: "https://demo-premium-auto.com/used-inventory",
    body: `${NAV}
<h1>Used Inventory</h1>
<div class="filters">Filter by: Make · Model · Year · Mileage · Price</div>
<div class="vehicle-grid">
  <div class="card"><img src="/img/u1.jpg" alt="2022 sedan">2022 Sedan SE — 31,200 mi — $19,995</div>
  <div class="card"><img src="/img/u2.jpg" alt="2021 SUV">2021 SUV Sport — 44,800 mi — $24,500</div>
  <div class="card"><img src="/img/u3.jpg" alt="2020 truck">2020 Truck XL — 58,100 mi — $27,900</div>
  <div class="card"><img src="/img/u4.jpg" alt="2019 hatchback">2019 Hatchback S — 62,400 mi — $14,250</div>
</div>
<p>Every pre-owned vehicle is inspected before it hits the lot. Financing available. <a href="/finance">Get pre-approved</a> or <a href="/value-your-trade">value your trade</a>.</p>
${FOOTER}`,
  }),

  // Service — no scheduler CTA, no hours, no specials; meta description too long.
  "/service": demoPage({
    title: "Auto Service Center | Premium Auto Group Cincinnati",
    desc: "The Premium Auto Group service center in Cincinnati handles routine maintenance and complex repairs for all makes and models with factory-trained, ASE-certified technicians using genuine OEM parts and modern diagnostic equipment for every job.",
    canonical: "https://demo-premium-auto.com/service",
    body: `${NAV}
<h1>Service Center</h1>
<p>Our twelve-bay service center handles everything from routine maintenance to complex diagnostics for all makes and models — not just the brands we sell. Every repair is performed by factory-trained, ASE-certified technicians using genuine OEM parts, so your warranty stays intact and your vehicle performs the way it was engineered to.</p>
<img src="/img/tech1.jpg" alt="Technician performing an oil change">
<img src="/img/tech2.jpg" alt="Diagnostic equipment connected to a vehicle">
<h2>What We Do</h2>
<p>Oil changes, brake service, tire mounting and rotation, battery testing and replacement, air conditioning service, transmission service, engine diagnostics, factory-recommended maintenance intervals, and multi-point inspections. If it has four wheels, our team has seen it — we complete more than nine thousand repair orders a year for Cincinnati drivers.</p>
<h2>Genuine Parts, Real Warranty</h2>
<p>We install genuine OEM parts on every repair. Aftermarket components may cost less up front, but they can compromise fit, performance, and resale value. Our parts counter also supplies wholesale customers across the region, which means the part your vehicle needs is usually already on our shelf — no week-long wait while your car sits.</p>
<p>Questions about a repair estimate from another shop? Bring it in. We will walk you through the work line by line and tell you honestly what is urgent, what can wait, and what you do not need at all.</p>
${FOOTER}`,
  }),

  // Finance — no all-credit messaging, no payment calculator; short meta description.
  "/finance": demoPage({
    title: "Auto Financing | Premium Auto Group",
    desc: "Financing made simple at Premium Auto Group.",
    canonical: "https://demo-premium-auto.com/finance",
    body: `${NAV}
<h1>Finance Center</h1>
<p>Our finance team works with more than thirty local and national lenders to structure terms that fit your budget. Apply online in about two minutes with a soft credit inquiry, and most applicants receive a decision the same day. Get pre-approved before you shop so you can negotiate from a position of strength.</p>
<p><a href="/finance/apply">Get Pre-Approved Now</a></p>
<h2>How It Works</h2>
<p>Complete the short online application, and a finance specialist will review your options and contact you with real numbers — not teaser rates. When you arrive at the dealership, the hard work is already done: pick your vehicle, review the final terms, and sign. Most customers spend less than an hour in the finance office.</p>
<h2>Protect Your Investment</h2>
<p>Ask about extended service contracts, GAP coverage, and tire-and-wheel protection. Our specialists will explain what each product covers and what it costs, and there is never any pressure to add anything you do not want.</p>
${FOOTER}`,
  }),

  // Trade — has offer/appraisal language, but thin and has TWO H1s.
  "/value-your-trade": demoPage({
    title: "Value Your Trade | Premium Auto Group",
    desc: "Get a competitive offer for your current vehicle at Premium Auto Group. Quick appraisal, transparent numbers, no obligation to buy.",
    canonical: "https://demo-premium-auto.com/value-your-trade",
    body: `${NAV}
<h1>Value Your Trade</h1>
<p>Get a real offer for your current vehicle in minutes. Our appraisal team uses live market data to price your trade competitively, and the number we quote is a number we stand behind.</p>
<h1>We Buy Cars</h1>
<p>You do not have to buy from us to sell to us. Bring your vehicle in for a quick appraisal and drive home with a written offer that is good for seven days.</p>
<p><a href="/value-your-trade/start">Start My Appraisal</a></p>
${FOOTER}`,
  }),

  // Specials — no expiration/urgency language, long title, thin.
  "/specials": demoPage({
    title: "Current Specials on New and Used Vehicles and Service | Premium Auto Group Cincinnati",
    desc: "See current specials on new vehicles, used vehicles, and service at Premium Auto Group in Cincinnati, Ohio.",
    canonical: "https://demo-premium-auto.com/specials",
    body: `${NAV}
<h1>Current Specials</h1>
<ul>
  <li><img src="/img/s1.jpg" alt="Sedan special">2026 Sedan LX — $259/mo lease</li>
  <li><img src="/img/s2.jpg" alt="SUV special">2026 SUV EX — 2.9% APR available</li>
  <li><img src="/img/s3.jpg" alt="Oil change special">Oil change + tire rotation — $49.95</li>
</ul>
<p>Contact our team for full details on any current special. Pricing shown with approved credit.</p>
${FOOTER}`,
  }),

  // VDP — price and financing present, but no Vehicle schema, no meta description,
  // no trade-in CTA, thin content.
  "/vdp/2023-audi-q5-premium": demoPage({
    title: "2023 Audi Q5 Premium Plus 45 | Premium Auto Group",
    canonical: "https://demo-premium-auto.com/vdp/2023-audi-q5-premium",
    body: `${NAV}
<h1>2023 Audi Q5 Premium Plus 45 TFSI quattro</h1>
<p class="price">$38,995</p>
<p>28,400 miles · Mythos Black · Rock Gray leather · Stock #P8821</p>
<img src="/img/q5-front.jpg" alt="2023 Audi Q5 Premium Plus in Mythos Black, front three-quarter view">
<img src="/img/q5-interior.jpg" alt="2023 Audi Q5 interior with Rock Gray leather">
<h2>Highlights</h2>
<p>Panoramic sunroof, adaptive cruise assist, heated front seats, Audi virtual cockpit, quattro all-wheel drive. Clean history report, one owner, fully serviced by our own technicians before listing.</p>
<p>Financing available from $612 per month with approved credit. <a href="/finance">Get Pre-Approved</a></p>
<p><a href="/schedule-test-drive">Schedule a Test Drive</a> or call (513) 555-0147.</p>
${FOOTER}`,
  }),

  // OEM research page — the clean one. Nearly everything done right.
  "/research/audi-a6": demoPage({
    title: "2026 Audi A6 Research: Specs & Pricing | Premium Auto Group",
    desc: "Everything Cincinnati shoppers need to know about the 2026 Audi A6 — trim levels, pricing, performance, technology, and how it compares.",
    canonical: "https://demo-premium-auto.com/research/audi-a6",
    og: true,
    schema: "Article",
    body: `${NAV}
<h1>2026 Audi A6: What Cincinnati Shoppers Need to Know</h1>
<p>The 2026 Audi A6 continues to define the midsize luxury sedan segment with a blend of understated design, genuine driving refinement, and technology that serves the driver instead of distracting them. This guide walks through the full lineup so you can arrive at your test drive already knowing which configuration fits your life.</p>
<img src="/img/a6-hero.jpg" alt="2026 Audi A6 sedan in Daytona Gray on a city street">
<h2>Trim Levels and Pricing</h2>
<p>The A6 lineup opens with the Premium trim, moves through Premium Plus, and tops out with the Prestige. Each step adds meaningful equipment: upgraded audio, head-up display, advanced driver assistance, and interior appointments that justify the climb. Current pricing starts in the mid fifty thousand dollar range, and monthly lease programs change regularly, so check with our team for this month's numbers.</p>
<h2>Performance and Efficiency</h2>
<p>Every A6 pairs a turbocharged engine with quattro all-wheel drive. The base 45 TFSI delivers confident daily performance, while the 55 TFSI adds mild-hybrid smoothness and stronger acceleration for drivers who want more. Cincinnati winters are exactly where quattro earns its reputation — sure-footed, predictable, and drama-free.</p>
<h2>Technology and Safety</h2>
<p>Dual center touchscreens, the fully digital virtual cockpit, and wireless smartphone integration are standard across the range. Adaptive cruise assist, intersection assist, and a top-view camera system round out one of the most complete safety suites in the class.</p>
<h2>How It Compares</h2>
<p>Cross-shopping the BMW 5 Series or Mercedes-Benz E-Class? The A6 counters with a quieter cabin than either and the most intuitive infotainment of the three. Buyers who value calm confidence over flash consistently land on the Audi. Resale values across recent model years have held firmly in line with segment leaders, and insurance costs typically run slightly below comparable German rivals.</p>
<h2>The Ownership Experience</h2>
<p>Scheduled maintenance intervals arrive every ten thousand miles, and the first service visit is covered under the included Audi Care introductory program. Our service department stocks common wear items for the A6 platform, which means brake service, tire replacement, and software updates rarely require more than a single visit. Owners also receive complimentary multi-point inspections, seasonal tire storage options, and access to loaner vehicles for longer repairs — the practical details that make luxury ownership genuinely easy to live with year after year.</p>
<h2>Ready for a Closer Look?</h2>
<p>Reading about adaptive suspension only goes so far — the A6 makes its strongest argument from the driver's seat. Schedule a test drive around your commute, bring your usual passengers, and evaluate the cabin the way you will actually use it. Our product specialists handle every question without pressure, and current inventory with window pricing is always posted online.</p>
<p><a href="/new-inventory">Check A6 Availability</a> · <a href="/finance">Explore Financing</a> · <a href="/value-your-trade">Value Your Trade</a> · <a href="/specials">Current Offers</a> · <a href="/service">Service Center</a> · <a href="/">Premium Auto Group Home</a></p>
${FOOTER}`,
  }),

  // Schedule-service — well-built service page: scheduler, hours, specials, credentials.
  "/schedule-service": demoPage({
    title: "Schedule Service Online in 60 Seconds | Premium Auto Group",
    desc: "Book your next service appointment online at Premium Auto Group in Cincinnati. Same-week appointments, factory-trained technicians, and current service specials.",
    body: `${NAV}
<h1>Schedule Your Service Appointment</h1>
<p>Book your appointment online in about sixty seconds — pick your service, choose a time, and you are done. Most routine maintenance can be scheduled same-week, and we will confirm by text within the hour.</p>
<p><a href="/schedule-service/book">Schedule Service Online</a> or call the service desk at (513) 555-0147.</p>
<h2>Service Hours</h2>
<p>Service Hours: Mon-Fri 7am-6pm, Sat 8am-4pm, Sun closed. Early bird drop-off available every weekday.</p>
<img src="/img/advisor.jpg" alt="Service advisor checking in a customer at the service drive">
<h2>Why Service Here</h2>
<p>Factory-trained, ASE-certified technicians. Genuine OEM parts on every repair. Complimentary multi-point inspection with every visit, and current service specials on oil changes and tire rotations posted monthly. Waiting room with wifi, or grab the shuttle and we will text you when your vehicle is ready.</p>
<p><a href="/service">Full Service Menu</a> · <a href="/specials">Service Specials</a> · <a href="/">Home</a></p>
${FOOTER}`,
  }),
};

/** Returns bundled demo HTML for a sample-audit path, or null if not a demo page. */
export function getDemoHtml(path: string): string | null {
  return DEMO_PAGES[path] ?? null;
}
