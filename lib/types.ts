// ─── Page Types ──────────────────────────────────────────────────────────────

export type PageType =
  | "homepage"
  | "new-inventory-srp"
  | "used-inventory-srp"
  | "certified-inventory-srp"
  | "vdp"
  | "service"
  | "parts"
  | "finance"
  | "trade"
  | "specials"
  | "oem-research"
  | "model-research"
  | "about"
  | "contact"
  | "landing"
  | "other";

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  homepage: "Homepage",
  "new-inventory-srp": "New Inventory SRP",
  "used-inventory-srp": "Used Inventory SRP",
  "certified-inventory-srp": "Certified Inventory SRP",
  vdp: "Vehicle Detail Page",
  service: "Service Page",
  parts: "Parts Page",
  finance: "Finance Page",
  trade: "Trade / Sell Your Car",
  specials: "Specials Page",
  "oem-research": "OEM Research Page",
  "model-research": "Model Research Page",
  about: "About Page",
  contact: "Contact Page",
  landing: "Landing Page",
  other: "Other",
};

export type Priority = "Fix Now" | "High Opportunity" | "Needs Content Rebuild" | "Monitor";
export type Severity = "critical" | "high" | "medium" | "low";
export type Category = "SEO" | "UX/CRO" | "Content" | "Technical" | "Automotive";

export type FetchStatus =
  | "success"
  | "blocked"
  | "timeout"
  | "redirect-error"
  | "non-html"
  | "access-denied"
  | "error"
  | "pending"
  | "skipped";

// ─── Parsed Page (from CSV) ───────────────────────────────────────────────────

export interface ParsedPage {
  id: string;
  rank: number;
  path: string;
  title: string;
  views: number;
  pageType: PageType;
  url: string;
}

// ─── Extracted HTML Metadata ──────────────────────────────────────────────────

export interface PageMeta {
  titleTag: string;
  metaDesc: string;
  canonical: string;
  ogTitle: string;
  ogDesc: string;
  viewport: string;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  wordCount: number;
  totalImgs: number;
  missingAlt: number;
  internalLinks: number;
  externalLinks: number;
  hasSchema: boolean;
  schemaTypes: string[];
  mobileReady: boolean;
  hasPhoneNumber: boolean;
  hasPrice: boolean;
  hasCTA: boolean;
  ctaTexts: string[];
  hasVideo: boolean;
  hasReviews: boolean;
  hasHours: boolean;
  rawHtml: string;
}

// ─── Analysis Output ──────────────────────────────────────────────────────────

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  isQuickWin: boolean;
  title: string;
  description: string;
  recommendation: string;
  impact: string;
}

export interface ChangeItem {
  action: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  category: Category;
}

export interface SuggestedContent {
  h1Options: string[];
  introParagraph: string;
  ctas: string[];
  sections: string[];
  faqs: Array<{ q: string; a: string }>;
  internalLinks: string[];
}

export interface ExpectedImpact {
  seo: string;
  leads: string;
  engagement: string;
  trust: string;
}

export interface PageResult {
  page: ParsedPage;
  meta: PageMeta | null;
  fetchStatus: FetchStatus;
  opportunityScore: number;
  priority: Priority;
  whatIsWorking: string[];
  findings: Finding[];
  whatToChange: ChangeItem[];
  suggestedContent: SuggestedContent;
  expectedImpact: ExpectedImpact;
}

// ─── Session / History ────────────────────────────────────────────────────────

export interface DPOSession {
  id: string;
  domain: string;
  baseUrl: string;
  metricLabel: string;
  allPages: ParsedPage[];
  selectedIds: string[];
  results: PageResult[];
  createdAt: string;
  completedAt?: string;
}

export interface HistoryEntry {
  id: string;
  domain: string;
  createdAt: string;
  pageCount: number;
  topPriority: Priority;
}
