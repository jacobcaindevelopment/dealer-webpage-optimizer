import { PageType } from "./types";

interface Rule {
  type: PageType;
  pathPatterns?: RegExp[];
  titlePatterns?: RegExp[];
}

const RULES: Rule[] = [
  // VDP — must come before SRP rules
  {
    type: "vdp",
    pathPatterns: [/\/vdp\//i, /vehicle-detail/i, /\/vin\//i, /\/listing\//i, /detail\.htm/i],
    titlePatterns: [/\b(vin|stock|mileage|\d{4,6}\s*(miles|mi))\b/i],
  },
  // Certified inventory
  {
    type: "certified-inventory-srp",
    pathPatterns: [/certified/i, /cpo/i, /\/pre-owned\//i],
  },
  // New inventory
  {
    type: "new-inventory-srp",
    pathPatterns: [/\/new[\-_]?(inventory|cars?|vehicles?|car[s]?)/i, /new-inventory/i, /new-car/i],
    titlePatterns: [/new (cars?|vehicles?|inventory|\w+ for sale)/i],
  },
  // Used inventory
  {
    type: "used-inventory-srp",
    pathPatterns: [/\/used[\-_]?(inventory|cars?|vehicles?)/i, /used-inventory/i, /used-car/i, /pre-owned/i, /preowned/i],
    titlePatterns: [/used (cars?|vehicles?|trucks?|suvs?|inventory)/i],
  },
  // All inventory
  {
    type: "used-inventory-srp",
    pathPatterns: [/\/all[\-_]?inventory/i],
  },
  // Service
  {
    type: "service",
    pathPatterns: [/\/service/i, /schedule-service/i, /auto-repair/i, /maintenance/i],
    titlePatterns: [/service (center|department|specials?)/i, /schedule service/i, /oil change/i],
  },
  // Parts
  {
    type: "parts",
    pathPatterns: [/\/parts/i, /oem-parts/i, /accessories/i],
    titlePatterns: [/\bparts\b/i, /accessories/i],
  },
  // Finance
  {
    type: "finance",
    pathPatterns: [/\/financ/i, /get-financed/i, /apply-online/i, /credit-application/i],
    titlePatterns: [/financ(e|ing)/i, /get (pre-)?approved/i, /credit application/i],
  },
  // Trade
  {
    type: "trade",
    pathPatterns: [/\/trade/i, /sell-your-car/i, /sell-us-your/i, /instant-offer/i, /value-your/i],
    titlePatterns: [/trade[\s-]?in/i, /sell (your|us) (car|vehicle)/i, /instant cash offer/i],
  },
  // Specials
  {
    type: "specials",
    pathPatterns: [/\/specials?/i, /\/deals?/i, /\/offers?/i, /\/incentives?/i],
    titlePatterns: [/specials?|deals?|offers?|incentives?/i],
  },
  // OEM / make research
  {
    type: "oem-research",
    pathPatterns: [/\/research\/(chevrolet|ford|toyota|honda|nissan|bmw|mercedes|audi|jeep|ram|gmc|cadillac|buick|chrysler|dodge|lincoln|volvo|mazda|subaru|hyundai|kia|genesis|lexus|acura|infiniti|porsche|land-rover|jaguar|mitsubishi|volkswagen|fiat|alfa)/i],
  },
  // Model research
  {
    type: "model-research",
    pathPatterns: [/\/research\//i, /model-overview/i, /compare-models/i],
    titlePatterns: [/\d{4}\s+\w+\s+(review|specs|overview|compare)/i],
  },
  // About
  {
    type: "about",
    pathPatterns: [/\/about/i, /our-dealership/i, /meet-the-team/i, /our-story/i],
    titlePatterns: [/about (us|the dealership)/i],
  },
  // Contact
  {
    type: "contact",
    pathPatterns: [/\/contact/i, /get-in-touch/i, /directions/i, /location/i],
    titlePatterns: [/contact (us|the dealership)/i, /get directions/i],
  },
  // Landing page (generic campaign pages)
  {
    type: "landing",
    pathPatterns: [/\/lp\//i, /\/landing/i, /\/campaign/i, /\/promo/i],
  },
  // Homepage — LAST because "/" matches anything
  {
    type: "homepage",
    pathPatterns: [/^\/$/],
  },
];

export function classifyPage(path: string, title: string): PageType {
  const normalPath = path.toLowerCase();
  const normalTitle = (title || "").toLowerCase();

  for (const rule of RULES) {
    const pathMatch = rule.pathPatterns?.some((re) => re.test(normalPath));
    const titleMatch = rule.titlePatterns?.some((re) => re.test(normalTitle));

    if (rule.pathPatterns && rule.titlePatterns) {
      if (pathMatch || titleMatch) return rule.type;
    } else if (rule.pathPatterns) {
      if (pathMatch) return rule.type;
    } else if (rule.titlePatterns) {
      if (titleMatch) return rule.type;
    }
  }

  return "other";
}
