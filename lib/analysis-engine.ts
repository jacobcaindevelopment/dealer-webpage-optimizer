import {
  PageType, PageMeta, ParsedPage, Finding, ChangeItem,
  SuggestedContent, ExpectedImpact, PageResult, FetchStatus,
  Category, Severity,
} from "./types";
import { calcOpportunityScore, scoreToPriority } from "./opportunity-scorer";

let findingCounter = 0;
function mkFinding(
  category: Category,
  severity: Severity,
  isQuickWin: boolean,
  title: string,
  description: string,
  recommendation: string,
  impact: string
): Finding {
  return { id: `f${++findingCounter}`, category, severity, isQuickWin, title, description, recommendation, impact };
}

// ─── Universal SEO Rules ──────────────────────────────────────────────────────

function universalSEO(meta: PageMeta, domain: string): Finding[] {
  const F: Finding[] = [];

  // Title tag
  if (!meta.titleTag) {
    F.push(mkFinding("SEO", "critical", true,
      "Missing Title Tag",
      "No <title> tag was found. The title tag is the single most important on-page SEO element and directly determines how your page appears in Google search results.",
      "Add a descriptive <title> of 50–60 characters. Lead with the primary keyword and include the dealership name. Example: 'Used Cars for Sale in [City] | [Dealership Name]'",
      "Immediate improvement in crawlability; can recover lost organic rankings within 1–2 indexing cycles."
    ));
  } else if (meta.titleTag.length > 62) {
    F.push(mkFinding("SEO", "medium", true,
      `Title Tag Too Long (${meta.titleTag.length} chars)`,
      `Google truncates titles at approximately 60 characters in search results. Current title: "${meta.titleTag.slice(0, 55)}…" — buyers may not see the full message.`,
      "Trim to 50–60 characters. Prioritize the primary keyword at the start; move the dealership name to the end.",
      "Improved SERP display, higher CTR when full value proposition is visible."
    ));
  } else if (meta.titleTag.length < 30) {
    F.push(mkFinding("SEO", "low", false,
      `Title Tag Too Short (${meta.titleTag.length} chars)`,
      `The title is only "${meta.titleTag}" — too short to capture keyword opportunity. Underutilizes the ranking signal Google gives to title tags.`,
      "Expand to 50–60 characters with the primary keyword, location, and brand.",
      "Incremental improvement in keyword targeting and click-through rate."
    ));
  }

  // Meta description
  if (!meta.metaDesc) {
    F.push(mkFinding("SEO", "high", true,
      "Missing Meta Description",
      "No meta description found. Google will auto-generate a description from random page content, resulting in poor click-through rates from search results.",
      "Write a compelling 140–160 character description that states what the page offers, includes the primary keyword, and ends with a call to action. Example: 'Browse 200+ quality used vehicles at [Dealership]. Competitive prices, easy financing for all credit types. Shop online today.'",
      "Meta descriptions directly impact organic CTR — a well-written description can increase clicks by 10–30%."
    ));
  } else if (meta.metaDesc.length > 160) {
    F.push(mkFinding("SEO", "low", true,
      `Meta Description Too Long (${meta.metaDesc.length} chars)`,
      "The description is truncated in search results, cutting off your CTA or key selling point.",
      "Trim to 140–160 characters. Lead with the value proposition; place the CTA within the first 140 characters.",
      "Ensures the full message is shown in SERPs, improving click-through rate."
    ));
  } else if (meta.metaDesc.length < 80) {
    F.push(mkFinding("SEO", "low", false,
      `Meta Description Too Short (${meta.metaDesc.length} chars)`,
      "Short descriptions leave organic click-through rate on the table. More room = more opportunity to sell the click.",
      "Expand to 130–160 characters with keyword, value proposition, and a clear CTA.",
      "Improved SERP engagement and organic CTR."
    ));
  }

  // H1
  if (meta.h1s.length === 0) {
    F.push(mkFinding("SEO", "high", true,
      "Missing H1 Heading",
      "No H1 tag found. The H1 is the strongest on-page heading signal — it tells Google (and buyers) what the page is about. Without it, your page lacks topical authority.",
      "Add exactly one H1 containing the primary keyword and the dealership's location. It should match the intent of the page title.",
      "Direct improvement in on-page SEO authority; also improves first-impression clarity for shoppers."
    ));
  } else if (meta.h1s.length > 1) {
    F.push(mkFinding("SEO", "medium", true,
      `Multiple H1 Tags (${meta.h1s.length} found)`,
      `Multiple H1s found: "${meta.h1s.slice(0, 2).join('", "')}" — dilutes heading structure and confuses both Google and screen readers.`,
      "Keep exactly one H1. Demote all others to H2 or H3. The H1 should be the single most important statement about the page's topic.",
      "Cleaner heading hierarchy improves SEO signal clarity and WCAG accessibility compliance."
    ));
  }

  // Canonical
  if (!meta.canonical) {
    F.push(mkFinding("Technical", "medium", true,
      "Missing Canonical Tag",
      "No <link rel=\"canonical\"> found. URL parameter variants (e.g., ?sort=price, ?page=2) may be indexed separately, splitting SEO authority across duplicate URLs.",
      `Add <link rel="canonical" href="https://${domain}/[page-path]"> to the <head>. This prevents duplicate content issues and consolidates link equity to the preferred URL.`,
      "Consolidates SEO authority; prevents dilution from parameter-based URL variants."
    ));
  }

  // OG tags
  if (!meta.ogTitle || !meta.ogDesc) {
    const missing = [!meta.ogTitle && "og:title", !meta.ogDesc && "og:description"].filter(Boolean).join(", ");
    F.push(mkFinding("Technical", "low", true,
      "Incomplete Open Graph Tags",
      `Missing: ${missing}. When this page is shared on Facebook, LinkedIn, or via text message, it will appear without a proper title or description, significantly reducing social traffic quality.`,
      "Add og:title, og:description, og:image (1200×630px), and og:url. Use the same keywords as your title tag and meta description.",
      "Improved social sharing appearance; higher click-through from Facebook Marketplace cross-links and social media posts."
    ));
  }

  // Mobile viewport
  if (!meta.mobileReady) {
    F.push(mkFinding("Technical", "medium", true,
      "Missing Viewport Meta Tag",
      "No <meta name=\"viewport\"> tag found. The page will render incorrectly on mobile devices. 60%+ of automotive shoppers browse on mobile.",
      'Add <meta name="viewport" content="width=device-width, initial-scale=1"> in the <head>.',
      "Mobile rendering fix; this is also a Google ranking signal — mobile-unfriendly pages are downranked."
    ));
  }

  // Image alt text
  if (meta.missingAlt > 0) {
    F.push(mkFinding("Technical", "high", true,
      `${meta.missingAlt} Image${meta.missingAlt > 1 ? "s" : ""} Missing Alt Text`,
      `${meta.missingAlt} of ${meta.totalImgs} images have no alt text. This fails WCAG 2.1 AA accessibility standards and prevents Google from understanding what your vehicle photos depict.`,
      "Add descriptive alt text to all meaningful images. For vehicle photos: include year, make, model, and color. Example: alt=\"2022 Toyota Camry SE in Midnight Black — front 3/4 view\". Use alt=\"\" for decorative icons.",
      "WCAG compliance, improved image search visibility, and better accessibility for screen reader users."
    ));
  }

  // Schema markup
  if (!meta.hasSchema) {
    F.push(mkFinding("SEO", "medium", false,
      "No Structured Data (Schema Markup)",
      "No JSON-LD schema markup found. Structured data can unlock rich results in Google (star ratings, price ranges, FAQ accordions) that dramatically increase SERP real estate.",
      "Add JSON-LD at minimum: Organization schema on the homepage, Vehicle schema on VDPs, FAQPage on content-rich pages, LocalBusiness on contact/about pages.",
      "Potential for rich results; can improve SERP visibility and CTR by 20–30% on eligible pages."
    ));
  }

  // Internal linking
  if (meta.internalLinks < 3 && meta.wordCount > 200) {
    F.push(mkFinding("SEO", "medium", false,
      "Low Internal Link Count",
      `Only ${meta.internalLinks} internal link${meta.internalLinks !== 1 ? "s" : ""} found. Internal links distribute SEO authority across your site and guide shoppers toward conversion pages (VDPs, Finance, Trade).`,
      "Add 4–8 contextual internal links per page. From inventory pages, link to Finance, Trade, Service, and key VDPs. From Service, link to Schedule Service and current specials.",
      "Improved crawl efficiency, SEO authority distribution, and shopper navigation toward conversion."
    ));
  }

  // Thin content
  if (meta.wordCount < 300 && meta.wordCount > 50) {
    F.push(mkFinding("Content", "high", false,
      "Thin Content",
      `Only ~${meta.wordCount} words detected. Pages with fewer than 300 words are often classified as thin content by Google, reducing ranking potential. Automotive SRPs and service pages frequently suffer from this — filter UI isn't content.`,
      "Add a 150–300 word introductory section above the fold content explaining what the page offers, who it's for, and why the dealership is the right choice. Include FAQs below the primary content.",
      "Improved topical authority; can move thin pages from supplemental index to main index, recovering organic rankings."
    ));
  }

  return F;
}

// ─── Page-Type Specific Rules ─────────────────────────────────────────────────

function pageTypeFindings(type: PageType, meta: PageMeta | null, domain: string): Finding[] {
  const F: Finding[] = [];
  const text = meta?.rawHtml?.toLowerCase() || "";

  switch (type) {
    case "vdp": {
      if (meta && !meta.schemaTypes.some((t) => t.toLowerCase().includes("vehicle") || t.toLowerCase().includes("car") || t.toLowerCase().includes("product"))) {
        F.push(mkFinding("SEO", "critical", true,
          "Missing Vehicle Schema Markup",
          "VDPs without Vehicle/Product schema markup miss out on rich results. Google can display price, availability, and vehicle details directly in search results for schema-enabled VDPs.",
          "Implement Vehicle schema with: name, description, model, brand, vehicleModelDate, mileageFromOdometer, offers (price, priceCurrency, availability), and image. Use JSON-LD format.",
          "Potential for rich result eligibility; improved VDP visibility in high-intent searches for specific VINs or model years."
        ));
      }
      if (meta && !meta.hasPrice) {
        F.push(mkFinding("Automotive", "high", true,
          "No Price Signal Detected",
          "The vehicle price is not visible in the HTML content. Shoppers who find VDPs via search or social expect to see pricing immediately — hidden or missing prices increase bounce rates significantly.",
          "Ensure the vehicle price is rendered in the static HTML, not just loaded via JavaScript after page load. Also include price in the meta description for SERP preview.",
          "Reduces bounce rate; price-transparent VDPs convert at 2–3x higher rates than price-hidden pages."
        ));
      }
      if (meta && !text.includes("finance") && !text.includes("payment") && !text.includes("per month")) {
        F.push(mkFinding("Automotive", "high", true,
          "No Monthly Payment / Finance CTA",
          "No financing prompt found on this VDP. The majority of car buyers finance their purchase — presenting an estimated monthly payment converts shoppers from browsers to leads.",
          "Add a 'Calculate Payment' widget or 'Get Pre-Approved' CTA directly on the VDP, adjacent to the price. Show an estimated monthly payment (e.g., 'From $X/mo with approved credit').",
          "Finance CTAs on VDPs are among the highest-converting elements — expect 15–25% increase in finance application submissions."
        ));
      }
      if (meta && !text.includes("trade") && !text.includes("trade-in")) {
        F.push(mkFinding("Automotive", "medium", true,
          "No Trade-In CTA on VDP",
          "No trade-in prompt found. Many buyers have a vehicle to trade — not capturing that intent on the VDP means losing a high-intent lead to Carvana or CarMax.",
          "Add a 'Value Your Trade' CTA section near the bottom of the VDP. Link to your trade appraisal tool or KBB ICO integration.",
          "Captures dual-funnel leads (buy + sell); trade-in leads are among the highest-closing leads in automotive."
        ));
      }
      break;
    }

    case "used-inventory-srp":
    case "certified-inventory-srp": {
      if (meta && meta.titleTag && !/\\d+/.test(meta.titleTag)) {
        F.push(mkFinding("Automotive", "high", true,
          "No Inventory Count in Title Tag",
          "Buyers scanning search results are drawn to pages that communicate volume. '200+ Used Cars for Sale' outperforms 'Used Cars' in CTR because it signals selection and legitimacy.",
          "Update the title to include your approximate inventory count: 'Shop [N]+ Used Cars in [City] | [Dealership]'. Update dynamically or refresh monthly.",
          "Improved SERP CTR; inventory counts in titles increase click-through by 15–20% on competitive SRP queries."
        ));
      }
      if (meta && meta.wordCount < 200) {
        F.push(mkFinding("Content", "high", false,
          "SRP Has No Supporting Content",
          "Used inventory pages that consist only of filter UI and vehicle cards are classified as thin content. Google needs textual signals to understand what your page is about and who it serves.",
          "Add a 150–200 word introduction above the inventory grid: describe your inventory selection, financing, and location. Add an FAQ section below the grid with 4–6 questions about buying used cars.",
          "Significant improvement in organic ranking potential for high-volume queries like 'used cars [city]' and 'pre-owned SUVs [city]'."
        ));
      }
      if (meta && !text.includes("certif") && type === "used-inventory-srp") {
        F.push(mkFinding("Automotive", "medium", false,
          "No CPO Upgrade Mention",
          "Used inventory pages that mention Certified Pre-Owned options see higher average transaction values and better conversion from trust-conscious buyers.",
          "Add a callout or section linking to your CPO inventory: 'Want extra confidence? Browse our Certified Pre-Owned vehicles →'",
          "Higher-margin sales; CPO buyers have higher intent and close faster than standard used buyers."
        ));
      }
      break;
    }

    case "new-inventory-srp": {
      if (meta && !text.includes("incentive") && !text.includes("lease") && !text.includes("deal") && !text.includes("offer")) {
        F.push(mkFinding("Automotive", "critical", true,
          "No Current Deals or Incentives Mentioned",
          "New inventory pages without OEM incentives, lease specials, or current-month offers miss the highest-converting new car buyers. These shoppers are comparing dealerships based on deal availability.",
          "Add a prominent 'Current Offers' section at the top of the page featuring active OEM lease deals, APR specials, and factory cash. Update monthly. Link to your Specials page.",
          "New inventory pages with deal messaging see 30–40% higher lead submission rates than inventory-only pages."
        ));
      }
      if (meta && meta.wordCount < 150) {
        F.push(mkFinding("Content", "high", false,
          "New Inventory SRP Lacks Supporting Content",
          "The page reads as filter UI only with no descriptive content to support organic rankings for high-value queries like 'new [brand] [model] [city]'.",
          "Add 150–200 words above the inventory: your new vehicle selection, current OEM programs, financing rates, and why shoppers should choose this dealership. Include the brand name, city, and current year.",
          "Improved ranking for new inventory queries; model-specific content captures buyer research-phase traffic."
        ));
      }
      break;
    }

    case "service": {
      if (meta && !text.includes("schedule") && !text.includes("appointment") && !text.includes("book")) {
        F.push(mkFinding("Automotive", "critical", true,
          "No Online Scheduler CTA",
          "The service page has no visible appointment scheduling prompt. This is the single highest-impact missing element on any service page. Shoppers who can't book online immediately go to competitors.",
          "Add a prominent 'Schedule Service' button in the hero, in the nav, and again in the service list. Link to your OEM-branded scheduler or a form. The CTA should say 'Schedule Service Online — It Takes 60 Seconds'.",
          "Online scheduling CTAs on service pages typically generate 20–40% of all service appointments. This is your highest-ROI fix."
        ));
      }
      if (meta && !meta.hasHours) {
        F.push(mkFinding("Automotive", "high", true,
          "Service Hours Not Visible",
          "No service department hours were detected. Hours are a top-3 question for service shoppers — not displaying them prominently increases phone call friction and drives customers to competitors with clearer information.",
          "Display service hours prominently in the hero or sidebar: 'Service Hours: Mon–Fri 7am–6pm | Sat 8am–4pm | Sun Closed'. Also add to LocalBusiness schema.",
          "Reduces call volume for basic info inquiries; improves walk-in conversion for same-day service."
        ));
      }
      if (meta && !text.includes("special") && !text.includes("coupon") && !text.includes("discount") && !text.includes("offer")) {
        F.push(mkFinding("Automotive", "high", true,
          "No Service Specials or Coupons",
          "Shoppers increasingly comparison-shop service pricing. A service page without specials loses to aftermarket competitors (Jiffy Lube, Firestone) who lead with discounts.",
          "Add a 'Current Service Specials' section: oil change specials, tire rotation deals, brake inspection promotions. Update monthly. Link to your full specials page.",
          "Service specials reduce price-shopping defection and increase same-day appointment conversion."
        ));
      }
      if (meta && !text.includes("certified") && !text.includes("trained") && !text.includes("technician") && !text.includes("factory")) {
        F.push(mkFinding("Content", "medium", false,
          "No Technician Credentialing Content",
          "Service pages that don't mention certified or factory-trained technicians lose trust battles to independent shops that brand heavily on expertise.",
          "Add trust copy: 'Our ASE-certified, factory-trained technicians use only genuine OEM parts and the latest diagnostic equipment. Your vehicle gets the care it deserves.'",
          "Improved trust conversion; credentialing content addresses the #1 objection to dealership service ('it's more expensive')."
        ));
      }
      break;
    }

    case "finance": {
      if (meta && !text.includes("all credit") && !text.includes("bad credit") && !text.includes("rebuild") && !text.includes("first time") && !text.includes("any credit")) {
        F.push(mkFinding("Automotive", "critical", true,
          "No 'All Credit Types Welcome' Messaging",
          "Finance pages that don't explicitly welcome all credit types (including challenged and first-time buyers) miss 40–50% of the finance lead pool. These buyers search specifically for dealerships that will work with them.",
          "Add prominent messaging: 'All credit types welcome — excellent, fair, or rebuilding.' Include a section for first-time buyers and credit-challenged shoppers. These are among your highest-converting leads.",
          "Significant expansion of your finance lead funnel; credit-inclusive messaging increases form completions by 25–40%."
        ));
      }
      if (meta && !text.includes("calculat") && !text.includes("payment estimat") && !text.includes("monthly payment")) {
        F.push(mkFinding("Automotive", "high", true,
          "No Payment Calculator",
          "Buyers on finance pages want to know what their payment will be before submitting a form. A payment calculator keeps shoppers engaged and pre-qualifies their intent.",
          "Embed a simple payment calculator: vehicle price, down payment, term (36/48/60/72 months), and estimated APR. Show real-time estimated monthly payment. This is a standard feature that your page is missing.",
          "Payment calculators on finance pages increase time-on-page by 40%+ and improve pre-qualified lead quality."
        ));
      }
      if (meta && !text.includes("pre-approv") && !text.includes("pre approv") && !text.includes("get approved")) {
        F.push(mkFinding("Automotive", "high", true,
          "No Pre-Approval CTA",
          "The finance page lacks a visible pre-approval call to action. Pre-approval is the primary conversion goal for this page type — shoppers who pre-approve are 3x more likely to purchase within 30 days.",
          "Add a large, prominent CTA: 'Get Pre-Approved in 2 Minutes — No Obligation, Soft Credit Pull.' Place it in the hero, mid-page, and bottom of page.",
          "Pre-approval CTAs are the highest-converting element on finance pages; expect 20–35% increase in form submissions."
        ));
      }
      break;
    }

    case "trade": {
      if (meta && !text.includes("instant") && !text.includes("offer") && !text.includes("apprais")) {
        F.push(mkFinding("Automotive", "critical", true,
          "No Instant Offer or Appraisal Prompt",
          "Shoppers considering trading in their vehicle are actively comparing your offer to Carvana, CarMax, and KBB Instant Cash Offer. A trade page without a prominent 'Get Your Offer' prompt sends them to competitors.",
          "Lead with: 'Get Your Instant Trade-In Offer — Takes 2 Minutes.' Connect to KBB ICO, CarGurus Instant Market Value, or your own appraisal tool. The offer is the conversion point — everything else is supporting content.",
          "Trade-in leads are among the highest-closing leads in automotive. Capturing trade intent on your own site prevents loss to aggregator channels."
        ));
      }
      if (meta && meta.wordCount < 200) {
        F.push(mkFinding("Content", "high", false,
          "Trade Page Has Insufficient Content",
          "The trade page needs to compete with Carvana's high-conviction messaging. Thin trade pages fail to build the trust and urgency needed to get shoppers to submit their vehicle info.",
          "Add: (1) 'How It Works' — 3-step process. (2) 'Why Trade Here' — competitive offer, no-pressure, use toward any vehicle. (3) 'We Buy Cars Even If You Don't Buy Ours' — removes purchase obligation barrier.",
          "More content = more trust = more trade appraisal submissions, which are your best leads."
        ));
      }
      break;
    }

    case "homepage": {
      if (meta && meta.titleTag && !/\\b(city|county|\\d{5}|near|\\w+ville|\\w+town|\\w+burg)\\b/i.test(meta.titleTag) && !/\\b[A-Z][a-z]+(,\\s*[A-Z]{2})\\b/.test(meta.titleTag)) {
        F.push(mkFinding("SEO", "high", true,
          "Homepage Title Missing Location Signal",
          "The homepage title appears to lack a city or location keyword. Local dealerships depend on geo-targeted searches ('Toyota dealer near me', '[Brand] dealer [City]') — not including location in the title is a critical missed opportunity.",
          "Update title: '[Brand] Dealer in [City, State] | [Dealership Name]' or '[Dealership Name] | New & Used Cars in [City], [State]'",
          "Location-optimized homepage titles directly improve visibility in local pack results and geo-targeted organic searches."
        ));
      }
      if (meta && !text.includes("review") && !text.includes("stars") && !text.includes("award") && !text.includes("years")) {
        F.push(mkFinding("Content", "high", false,
          "No Trust Signals on Homepage",
          "The homepage has no visible trust elements (reviews, ratings, awards, years in business). First-time visitors make trust decisions in 3–5 seconds — without social proof, many leave for a competitor.",
          "Add trust signals above the fold or in the first scroll: Google review count + rating, DealerRater rating, years in business, any manufacturer awards (President's Club, etc.), and community involvement.",
          "Trust signals reduce homepage bounce rate and increase the probability a shopper contacts or starts shopping inventory."
        ));
      }
      break;
    }

    case "specials": {
      if (meta && !text.includes("expir") && !text.includes("ends") && !text.includes("through") && !text.includes("limited time")) {
        F.push(mkFinding("Automotive", "high", true,
          "Specials Lack Urgency / Expiration Dates",
          "Deals without expiry dates lose urgency. 'Offer ends March 31' converts significantly better than 'Current specials' because it creates a deadline.",
          "Add expiration language to every deal: 'Offer ends [date] or while supplies last.' Use the current month and year. Update monthly.",
          "Urgency-driven specials pages convert at 2–3x higher rates than evergreen specials pages."
        ));
      }
      break;
    }

    default:
      break;
  }

  return F;
}

// ─── What Is Working ──────────────────────────────────────────────────────────

function calcWhatIsWorking(meta: PageMeta | null, type: PageType): string[] {
  const positives: string[] = [];
  if (!meta) {
    positives.push("Page is publicly accessible and indexable (based on URL availability).");
    positives.push("Page has organic traffic — Google has deemed it relevant enough to rank.");
    return positives;
  }
  if (meta.titleTag && meta.titleTag.length >= 30 && meta.titleTag.length <= 62)
    positives.push(`Title tag is well-formed (${meta.titleTag.length} chars) and within optimal length.`);
  if (meta.metaDesc && meta.metaDesc.length >= 80 && meta.metaDesc.length <= 160)
    positives.push(`Meta description is present and optimal length (${meta.metaDesc.length} chars).`);
  if (meta.h1s.length === 1)
    positives.push(`Single H1 tag present: "${meta.h1s[0].slice(0, 60)}${meta.h1s[0].length > 60 ? "…" : ""}" — correct heading structure.`);
  if (meta.canonical)
    positives.push("Canonical tag is set — no duplicate content risk from URL variants.");
  if (meta.hasSchema)
    positives.push(`Structured data detected (${meta.schemaTypes.slice(0, 2).join(", ")}) — eligible for rich results in Google.`);
  if (meta.mobileReady)
    positives.push("Viewport tag is present — page renders correctly on mobile devices.");
  if (meta.wordCount >= 400)
    positives.push(`Strong content depth (~${meta.wordCount} words) — Google favors pages with substantive content.`);
  if (meta.missingAlt === 0 && meta.totalImgs > 0)
    positives.push(`All ${meta.totalImgs} images have alt text — WCAG compliant and image-search ready.`);
  if (meta.hasPhoneNumber)
    positives.push("Phone number visible in HTML — shoppers can call directly; boosts Local SEO signals.");
  if (meta.hasReviews)
    positives.push("Review/rating content detected — trust signals are present and visible to shoppers.");
  if (meta.hasCTA)
    positives.push(`Calls-to-action detected ("${meta.ctaTexts.slice(0, 2).join('", "')}") — conversion pathways are in place.`);
  if (meta.internalLinks >= 5)
    positives.push(`Good internal link count (${meta.internalLinks} links) — helping distribute SEO authority and guide shoppers.`);

  // Ensure at least 1 positive
  if (positives.length === 0) {
    positives.push("Page is indexed and receiving organic traffic — baseline SEO foundation exists.");
    if (type !== "other") positives.push("Page type is correctly categorized, which supports targeted content strategy.");
  }

  return positives.slice(0, 4);
}

// ─── Content Suggestions ──────────────────────────────────────────────────────

function buildSuggestedContent(type: PageType, meta: PageMeta | null, domain: string, title: string): SuggestedContent {
  const domainClean = domain.replace(/^www\\./, "");

  const contentMap: Record<PageType, SuggestedContent> = {
    "used-inventory-srp": {
      h1Options: [
        "Shop [X]+ Quality Pre-Owned Vehicles — All Makes, All Budgets",
        "Used Cars for Sale Near [City] | Competitive Prices & Easy Financing",
        "[X]+ Pre-Owned Cars, Trucks & SUVs — Priced to Move",
      ],
      introParagraph: `Find your next vehicle from our rotating selection of quality pre-owned cars, trucks, and SUVs. Every vehicle is inspected, fairly priced, and backed by a vehicle history report. Whether you're looking for a fuel-efficient commuter or a capable family SUV, our team at ${domainClean} will find the right fit at the right price. Flexible financing is available for all credit types — including first-time buyers.`,
      ctas: ["Search Inventory", "Get Pre-Approved in Minutes →", "Value My Trade →", "View This Week's Deals"],
      sections: [
        "Shop by Vehicle Type (Cars / Trucks / SUVs / Vans)",
        "Featured Pre-Owned Picks This Week",
        "Finance From $[X]/month — All Credit Types Welcome",
        "Why Buy Pre-Owned Here?",
        "Trusted by [City] Drivers Since [Year]",
      ],
      faqs: [
        { q: "What does a used vehicle inspection include?", a: "Every pre-owned vehicle undergoes a multi-point inspection covering engine, transmission, brakes, tires, safety systems, and cosmetic condition before being listed for sale." },
        { q: "Can I finance a used car with less-than-perfect credit?", a: "Yes — we work with 30+ lenders and welcome all credit types, including first-time buyers and those rebuilding credit. Apply online in minutes with no impact to your score." },
        { q: "Do you accept trade-ins on used vehicle purchases?", a: "Absolutely. We'll give you a competitive trade-in offer that you can apply directly toward your next vehicle — even if you don't buy from us." },
        { q: "How do I know the price is fair?", a: "Every vehicle is priced using current market data and vehicle history. Our prices are transparent, competitive, and posted online before you visit." },
      ],
      internalLinks: [
        "→ Get Pre-Approved: link to /finance",
        "→ Value Your Trade: link to /trade",
        "→ Looking for extra confidence? Browse Certified Pre-Owned: link to /certified-inventory",
        "→ Current Specials: link to /specials",
      ],
    },
    "new-inventory-srp": {
      h1Options: [
        "Browse New [Brand] Vehicles — [City]'s Largest Selection",
        "New Cars, Trucks & SUVs for Sale | Current Incentives Available",
        "Shop New Inventory | [Dealer] — [City], [State]",
      ],
      introParagraph: `Explore our full selection of new vehicles with the latest technology, safety features, and available OEM incentives. Our team at ${domainClean} makes it easy to find the right new vehicle at the right price — with competitive financing rates and a no-pressure buying experience. Current lease and APR specials are updated monthly.`,
      ctas: ["View Current Offers →", "Calculate My Payment", "Get Pre-Approved", "Schedule a Test Drive"],
      sections: [
        "Current Month's OEM Incentives & Lease Deals",
        "Shop by Model",
        "New Vehicle Specials — Updated Monthly",
        "In-Transit Vehicles",
        "Why Buy New Here?",
      ],
      faqs: [
        { q: "What OEM incentives are available this month?", a: "Current manufacturer incentives are updated monthly and vary by model. Check our Specials page for the latest lease deals, cash back offers, and low-APR financing programs." },
        { q: "Can I order a vehicle that's not in stock?", a: "Yes — we can place a factory order for the exact vehicle you want. Contact our sales team to discuss build options and estimated delivery." },
        { q: "What is included in the new vehicle warranty?", a: "New vehicles include the manufacturer's full warranty. Coverage varies by brand — ask our team for details specific to the model you're considering." },
      ],
      internalLinks: [
        "→ Current Specials & Offers: link to /specials",
        "→ Finance Center: link to /finance",
        "→ Compare Models: link to /research",
      ],
    },
    "certified-inventory-srp": {
      h1Options: [
        "Certified Pre-Owned Vehicles — Factory-Backed Confidence at Used Car Prices",
        "Shop [Brand] CPO Vehicles | Extended Warranty Included",
        "Certified Pre-Owned [Brand] in [City] — Rigorously Inspected, Fully Warranted",
      ],
      introParagraph: `Shop our Certified Pre-Owned inventory — vehicles that have passed a rigorous multi-point inspection, include an extended factory warranty, and come with a clean vehicle history report. CPO vehicles give you the confidence of buying new at a fraction of the price. Ask about low CPO financing rates available through the manufacturer.`,
      ctas: ["Browse CPO Inventory", "Compare CPO vs. Used →", "Get Pre-Approved", "Learn About CPO Benefits →"],
      sections: [
        "What Is Certified Pre-Owned?",
        "CPO vs. Standard Used — What's the Difference?",
        "CPO Warranty Coverage Details",
        "Current CPO Financing Offers",
      ],
      faqs: [
        { q: "What makes a vehicle Certified Pre-Owned?", a: "CPO vehicles must pass a manufacturer-defined multi-point inspection, meet age and mileage requirements, and come with an extended factory warranty. Each brand has specific CPO standards." },
        { q: "Is CPO worth the extra cost over standard used?", a: "For most buyers, yes — the extended warranty, inspection peace of mind, and often lower financing rates offset the price premium, especially for vehicles 2–4 years old." },
      ],
      internalLinks: ["→ Used Inventory: link to /used-inventory", "→ Finance Center: link to /finance"],
    },
    vdp: {
      h1Options: [
        "[Year] [Make] [Model] [Trim] — [Mileage] Miles | [Dealership]",
        "[Year] [Make] [Model] for Sale | [City] | Stock #[Stock]",
        "[Year] [Make] [Model] — Priced at $[Price] | [Dealership]",
      ],
      introParagraph: `This [year] [make] [model] is a standout option in our pre-owned inventory. With [mileage] miles and [key features], it's priced competitively and ready to drive home today. View all photos, request more information, or schedule a test drive below. Financing available — get pre-approved in minutes.`,
      ctas: ["Calculate My Payment", "Get Pre-Approved →", "Value My Trade", "Schedule a Test Drive", "Call Us: [Phone]"],
      sections: [
        "Vehicle Overview & Key Features",
        "Full Specifications",
        "Financing This Vehicle — Estimated $X/month",
        "Value Your Current Trade-In",
        "Vehicle History Report",
        "Similar Vehicles You May Like",
      ],
      faqs: [
        { q: "Is this vehicle still available?", a: "Our inventory is updated in real-time. If you see it listed, it's available. Call us or start the online purchase process to hold it today." },
        { q: "Can I see the vehicle history report?", a: "Yes — a Carfax or AutoCheck vehicle history report is available for every vehicle in our inventory. Ask your sales representative." },
        { q: "What financing options are available for this vehicle?", a: "We work with 30+ lenders to offer competitive rates for all credit types. Apply online and get a decision within minutes." },
      ],
      internalLinks: [
        "→ Similar Used Vehicles: link to /used-inventory",
        "→ Finance Center: link to /finance",
        "→ Trade-In Value: link to /trade",
      ],
    },
    service: {
      h1Options: [
        "Certified Auto Service in [City] | [Dealership] Service Center",
        "Factory-Trained Technicians & Genuine OEM Parts | [City]",
        "Schedule Your Service Today — Fast, Trusted, Convenient",
      ],
      introParagraph: `Our [X]-bay service center is staffed by factory-trained, ASE-certified technicians using genuine OEM parts and the latest diagnostic equipment. From routine oil changes to complex repairs, we service all makes and models. Schedule your appointment online — most services available same-day or next-day.`,
      ctas: ["Schedule Service Online →", "View Service Specials", "Call the Service Desk", "Get a Service Quote"],
      sections: [
        "Our Services (Oil Change, Brakes, Tires, A/C, Transmission, etc.)",
        "Current Service Specials — Save This Month",
        "Certified Technicians You Can Trust",
        "Service Hours & Location",
        "Customer Reviews",
        "Frequently Asked Service Questions",
      ],
      faqs: [
        { q: "Do I need an appointment for an oil change?", a: "Walk-ins are welcome, but scheduling online guarantees your preferred time. Most oil changes take 30–45 minutes." },
        { q: "How long does a standard service visit take?", a: "Routine maintenance (oil, filters, tire rotation) typically takes 45–90 minutes. Complex repairs vary — your service advisor will provide a timeline estimate." },
        { q: "Do you use OEM or aftermarket parts?", a: "We use genuine OEM parts for all repairs, ensuring your vehicle maintains its warranty and performs as designed." },
        { q: "Do you offer loaner vehicles or shuttle service?", a: "Yes — loaner vehicles and shuttle service are available for qualifying repairs. Ask your service advisor when scheduling." },
      ],
      internalLinks: [
        "→ Schedule Service: link to /schedule-service",
        "→ Service Specials: link to /service-specials",
        "→ Parts Department: link to /parts",
      ],
    },
    finance: {
      h1Options: [
        "Auto Financing in [City] — All Credit Types Welcome",
        "Get Pre-Approved in Minutes | [Dealership] Finance Center",
        "Low Rates, Flexible Terms — Vehicle Financing Near [City]",
      ],
      introParagraph: `Whether you have excellent credit, are building it, or are starting over — our finance team partners with 30+ local and national lenders to get you the best rate available. Apply online in minutes. No obligation. Decisions within hours. Your dream vehicle is closer than you think.`,
      ctas: ["Apply Now — Takes 2 Minutes →", "Calculate My Payment", "Talk to Our Finance Team", "See This Month's Finance Specials"],
      sections: [
        "Why Finance Through Us?",
        "Payment Calculator",
        "All Credit Types Welcome",
        "Current Manufacturer Finance Offers",
        "Our Lending Partners",
        "Frequently Asked Finance Questions",
      ],
      faqs: [
        { q: "What credit score do I need to get approved?", a: "We work with lenders who accept all credit scores. While a higher score gets better rates, we have programs for 500+ credit scores and first-time buyers with no credit history." },
        { q: "Does applying online affect my credit score?", a: "Our initial application uses a soft credit inquiry, which does not impact your credit score. A hard inquiry only occurs with your permission when finalizing financing." },
        { q: "Can I get pre-approved before choosing a vehicle?", a: "Yes — and we recommend it. Pre-approval lets you know your budget before you shop, making the purchase process faster and more confident." },
        { q: "What documents do I need to finance a car?", a: "Bring your driver's license, proof of insurance, proof of income (pay stubs or bank statements), and proof of residence. We'll handle the rest." },
      ],
      internalLinks: ["→ New Inventory: link to /new-inventory", "→ Used Inventory: link to /used-inventory", "→ Trade-In Value: link to /trade"],
    },
    trade: {
      h1Options: [
        "Get Your Instant Trade-In Offer — [Dealership]",
        "We Buy Cars | Competitive Offers, No Pressure | [City]",
        "Trade In or Sell Your Vehicle — Get a Real Offer Today",
      ],
      introParagraph: `Thinking about trading in your current vehicle? Our trade-in process is simple, fast, and completely transparent. We'll give you a competitive market-based offer for your vehicle — and you can apply it toward any vehicle in our inventory or walk away with cash. We buy cars even if you don't buy from us.`,
      ctas: ["Get My Trade-In Value Now →", "Compare to Carvana/CarMax", "Talk to a Trade Specialist", "Apply Trade Toward a New Vehicle"],
      sections: [
        "How It Works — 3 Simple Steps",
        "Why Trade Here vs. Carvana or CarMax",
        "We Buy Cars — Even If You Don't Buy From Us",
        "How We Calculate Your Offer",
        "Frequently Asked Trade-In Questions",
      ],
      faqs: [
        { q: "How is my trade-in value calculated?", a: "We evaluate your vehicle based on current market data, mileage, condition, and local demand. Our offers are competitive with major car-buying services." },
        { q: "Do I have to buy a car from you to trade in?", a: "No — we buy vehicles from anyone. You can sell us your car without purchasing another." },
        { q: "How long does the appraisal take?", a: "Most vehicle appraisals take 20–30 minutes. You'll receive a written offer valid for 7 days." },
        { q: "What if I still owe money on my trade?", a: "We handle negative equity situations regularly. We'll pay off your existing loan and calculate the remaining balance into your transaction." },
      ],
      internalLinks: ["→ Finance Center: link to /finance", "→ Used Inventory: link to /used-inventory", "→ New Inventory: link to /new-inventory"],
    },
    homepage: {
      h1Options: [
        "[Brand] Dealer in [City], [State] — New & Used Vehicles",
        "Welcome to [Dealership] | [City]'s Trusted Auto Dealer Since [Year]",
        "[Dealership] — New, Used & Certified Vehicles | [City], [State]",
      ],
      introParagraph: `Welcome to [Dealership], [City]'s trusted automotive destination for [X] years. Browse our extensive inventory of new, certified, and pre-owned vehicles, take advantage of our award-winning service center, and experience a no-pressure buying process designed around you. Serving [City], [Nearby City], and all of [County].`,
      ctas: ["Shop New Inventory →", "Shop Used Inventory →", "Schedule Service", "Get Pre-Approved", "Value My Trade"],
      sections: [
        "Featured Inventory — This Week's Top Picks",
        "Current Offers & Incentives",
        "Why Choose [Dealership]?",
        "Service & Parts Center",
        "Customer Reviews",
        "Serving [City] and Surrounding Areas",
      ],
      faqs: [
        { q: "What brands do you carry?", a: "We carry [Brand] new vehicles along with an extensive multi-brand pre-owned inventory. Browse by make or body style to find your match." },
        { q: "Do you have service for all makes and models?", a: "Yes — our certified service center handles all makes and models, not just [Brand] vehicles." },
      ],
      internalLinks: ["→ New Inventory", "→ Used Inventory", "→ Service Center", "→ Finance", "→ Current Specials"],
    },
    specials: {
      h1Options: [
        "[Month] [Year] Specials — Limited-Time Deals on New & Used Vehicles",
        "Current Offers & Incentives | [Dealership] | Ends [Date]",
        "Shop This Month's Best Deals — New, Used & Service Specials",
      ],
      introParagraph: `Take advantage of our current limited-time offers on new vehicles, pre-owned inventory, and service. These specials are updated monthly and expire on the dates listed — don't miss out. Questions? Contact our team or visit us at [Address].`,
      ctas: ["View New Car Deals →", "View Used Car Deals →", "View Service Specials →", "Get Pre-Approved"],
      sections: [
        "New Vehicle Incentives — Expires [Date]",
        "Pre-Owned Specials",
        "Service & Parts Coupons",
        "Finance Rate Specials",
      ],
      faqs: [
        { q: "When do specials expire?", a: "Expiration dates are listed on each offer. Most specials run through the end of the month or while supplies last." },
      ],
      internalLinks: ["→ New Inventory", "→ Used Inventory", "→ Service Department"],
    },
    "model-research": {
      h1Options: [
        "[Year] [Make] [Model] — Full Review, Specs & Pricing | [Dealership]",
        "Is the [Year] [Model] Right for You? Compare Trims & Prices",
        "[Year] [Model] Review — What [City] Shoppers Need to Know",
      ],
      introParagraph: `Looking for everything you need to know about the [year] [make] [model]? We've put together a comprehensive overview — from trim levels and pricing to fuel economy, safety ratings, and real-world performance. Compare configurations and contact our team when you're ready to schedule a test drive.`,
      ctas: ["Check Current Inventory →", "Schedule a Test Drive", "Compare Trim Levels", "Get Pre-Approved"],
      sections: ["Overview & Key Highlights", "Trim Levels & Pricing", "Performance & Fuel Economy", "Safety Features & Ratings", "Interior & Technology", "Compare to Competitors"],
      faqs: [{ q: "What trim levels are available for the [Model]?", a: "The [year] [model] is available in [X] trim levels. See our comparison table above for features and pricing at each level." }],
      internalLinks: ["→ View [Model] Inventory", "→ Finance Center", "→ Compare Models"],
    },
    "oem-research": {
      h1Options: [
        "[Brand] Vehicles at [Dealership] | [City], [State]",
        "Your Local [Brand] Dealer — New & Used [Brand] Vehicles in [City]",
      ],
      introParagraph: `[Dealership] is your local [brand] dealer in [city], offering a full selection of new, certified, and pre-owned [brand] vehicles. Our [brand]-certified technicians provide factory-level service using genuine OEM parts.`,
      ctas: ["Shop [Brand] Inventory →", "Schedule Service", "Current [Brand] Offers →"],
      sections: ["New [Brand] Models", "Pre-Owned [Brand] Vehicles", "Certified [Brand] Service"],
      faqs: [{ q: "Do you carry all [Brand] models?", a: "We stock the full [brand] lineup. Contact us for availability on specific trims or to place a factory order." }],
      internalLinks: ["→ New Inventory", "→ Used Inventory", "→ Service Center"],
    },
    parts: {
      h1Options: [
        "Genuine OEM Parts & Accessories | [Dealership] Parts Center",
        "Order [Brand] Parts Online or In-Store | [City]",
      ],
      introParagraph: `Get genuine OEM parts and accessories for your vehicle at [Dealership]. Our parts department stocks a wide selection of factory-original components for [Brand] vehicles and more. Order online for in-store pickup or have parts shipped directly to you.`,
      ctas: ["Order Parts Online →", "Request a Part →", "Call the Parts Desk"],
      sections: ["Order OEM Parts Online", "Accessories Catalog", "Parts Hours & Contact"],
      faqs: [{ q: "Do you sell parts for all makes and models?", a: "We stock OEM parts for [Brand] vehicles and can source parts for most other makes. Contact us with your VIN for fastest availability." }],
      internalLinks: ["→ Service Center", "→ Schedule Service"],
    },
    about: {
      h1Options: [
        "About [Dealership] | [City]'s Trusted Auto Dealer Since [Year]",
        "Meet the Team at [Dealership] | Community-Focused, Customer-First",
      ],
      introParagraph: `[Dealership] has proudly served [City] and surrounding communities since [year]. As a [family-owned / group-owned] dealership, we built our reputation on transparency, fair pricing, and a no-pressure experience. Meet our team and learn why [X]+ customers trust us with their automotive needs.`,
      ctas: ["Meet Our Team →", "Read Customer Reviews →", "Visit Us Today"],
      sections: ["Our Story", "Meet the Team", "Community Involvement", "Awards & Recognition", "Customer Reviews"],
      faqs: [{ q: "How long has [Dealership] been in business?", a: "We've been serving [City] since [year] — over [X] years of trusted automotive service." }],
      internalLinks: ["→ Contact Us", "→ New Inventory", "→ Service Center"],
    },
    contact: {
      h1Options: [
        "Contact [Dealership] | [City], [State] — We're Here to Help",
        "Get Directions & Contact Information | [Dealership]",
      ],
      introParagraph: `Have a question? Want to schedule a visit? Our team at [Dealership] is ready to help. Reach us by phone, email, or visit us at [Address] in [City]. We're open [days] from [hours].`,
      ctas: ["Get Directions →", "Call Sales", "Call Service", "Send a Message"],
      sections: ["Location & Hours", "Sales Department", "Service Department", "Parts Department", "Send Us a Message"],
      faqs: [{ q: "What are your hours?", a: "Sales: Mon–Sat [hours]. Service: Mon–Fri [hours]. Parts: Mon–Fri [hours]. Visit our Google listing for real-time holiday hours." }],
      internalLinks: ["→ Schedule Service", "→ New Inventory", "→ Finance Center"],
    },
    landing: {
      h1Options: [
        "[Offer/Campaign Name] — [Dealership] | [City]",
        "Exclusive Deal: [Value Proposition] | Limited Time",
      ],
      introParagraph: `You're one step away from [value proposition]. Fill out the form below or call us to take advantage of this exclusive offer. Limited availability — expires [date].`,
      ctas: ["Claim This Offer →", "Call Now", "Get Pre-Approved"],
      sections: ["Offer Details", "How to Redeem", "Why [Dealership]?", "Contact Form"],
      faqs: [{ q: "Is this offer really exclusive?", a: "Yes — this offer is only available through this page and expires on [date] or while supplies last." }],
      internalLinks: ["→ Inventory", "→ Finance", "→ Contact Us"],
    },
    other: {
      h1Options: ["[Page Topic] | [Dealership]", "Learn More About [Topic] at [Dealership]"],
      introParagraph: `Explore this page to learn more about [topic]. The [Dealership] team is here to help with any questions — contact us or browse our inventory online.`,
      ctas: ["Contact Us →", "Browse Inventory →"],
      sections: ["Key Information", "Related Resources", "Contact the Team"],
      faqs: [{ q: "How can I learn more?", a: "Contact our team directly or visit us in [City] to get all the information you need." }],
      internalLinks: ["→ Homepage", "→ Contact Us"],
    },
  };

  return contentMap[type] || contentMap["other"];
}

// ─── Expected Impact ──────────────────────────────────────────────────────────

function buildExpectedImpact(type: PageType, findings: Finding[]): ExpectedImpact {
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHigh = findings.some((f) => f.severity === "high");
  const criticalSEO = findings.some((f) => f.severity === "critical" && f.category === "SEO");
  const criticalAuto = findings.some((f) => f.severity === "critical" && f.category === "Automotive");

  const highTrafficTypes: PageType[] = ["vdp", "used-inventory-srp", "new-inventory-srp", "service", "finance", "homepage"];
  const isHighTraffic = highTrafficTypes.includes(type);

  return {
    seo: criticalSEO
      ? "High — fixing critical SEO issues can recover lost rankings and increase organic impressions by 20–40%"
      : hasHigh ? "Moderate — addressing high-severity SEO items can improve rank position by 3–8 spots on target queries"
      : "Low — page has baseline SEO fundamentals in place; incremental improvements expected",
    leads: criticalAuto
      ? `High — ${type === "service" ? "adding an online scheduler" : type === "finance" ? "pre-approval CTA" : "primary automotive CTA"} can increase lead volume by 20–40% immediately`
      : isHighTraffic && hasHigh ? "Moderate — UX and CRO improvements on this high-traffic page can generate 10–25% more qualified leads"
      : "Low — foundational improvements; lead impact will be incremental",
    engagement: hasCritical
      ? "High — pages with missing content structure (H1, headings, body copy) see 30%+ improvement in time-on-page after fixes"
      : "Moderate — content additions and improved internal linking will reduce bounce rate and increase pages-per-session",
    trust: findings.some((f) => f.title.includes("Trust") || f.title.includes("Review") || f.title.includes("Credenti"))
      ? "High — trust signals are the #1 conversion driver for first-time visitors; adding reviews and credentialing can improve conversion rate by 15–25%"
      : "Low-Moderate — technical and SEO fixes reinforce trust indirectly through professional page presentation",
  };
}

// ─── Action Plan ──────────────────────────────────────────────────────────────

function buildActionPlan(findings: Finding[]): ChangeItem[] {
  const effortMap: Record<Severity, "low" | "medium" | "high"> = {
    critical: "low",
    high: "low",
    medium: "medium",
    low: "high",
  };
  const impactMap: Record<Severity, "low" | "medium" | "high"> = {
    critical: "high",
    high: "high",
    medium: "medium",
    low: "low",
  };

  return findings
    .sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 8)
    .map((f) => ({
      action: f.recommendation,
      effort: effortMap[f.severity],
      impact: impactMap[f.severity],
      category: f.category,
    }));
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function analyzePage(
  page: ParsedPage,
  meta: PageMeta | null,
  fetchStatus: FetchStatus,
  totalPages: number,
  domain: string
): PageResult {
  findingCounter = 0;

  const findings: Finding[] = [];

  if (meta && fetchStatus === "success") {
    findings.push(...universalSEO(meta, domain));
  }
  findings.push(...pageTypeFindings(page.pageType, meta, domain));

  if (!meta || fetchStatus !== "success") {
    findings.push(mkFinding("Technical", "high", false,
      `Page Could Not Be Fetched (${fetchStatus})`,
      fetchStatus === "blocked"
        ? "The page is protected by Cloudflare or a bot-detection system. Server-side analysis was not possible."
        : fetchStatus === "timeout"
        ? "The page took too long to respond. This may indicate server performance issues affecting both users and search crawlers."
        : fetchStatus === "access-denied"
        ? "The server returned a 403 Forbidden error. The page may be gated or restricted."
        : "The page could not be fetched. Recommendations below are based on page type classification.",
      "Manually review this page using your browser's developer tools (F12 → Elements). Check the items in the action plan below against the live page.",
      "Manual review required — automated analysis not available for this page."
    ));
  }

  const opportunityScore = calcOpportunityScore(page.rank, totalPages, page.pageType, findings);
  const priority = scoreToPriority(opportunityScore);
  const whatIsWorking = calcWhatIsWorking(meta, page.pageType);
  const whatToChange = buildActionPlan(findings);
  const suggestedContent = buildSuggestedContent(page.pageType, meta, domain, page.title);
  const expectedImpact = buildExpectedImpact(page.pageType, findings);

  return {
    page,
    meta,
    fetchStatus,
    opportunityScore,
    priority,
    whatIsWorking,
    findings,
    whatToChange,
    suggestedContent,
    expectedImpact,
  };
}
