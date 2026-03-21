import { PageType, Priority, Severity, Finding } from "./types";

// Business value weights per page type (0–10)
export const PAGE_BUSINESS_VALUE: Record<PageType, number> = {
  vdp: 10,
  "used-inventory-srp": 9,
  "new-inventory-srp": 9,
  "certified-inventory-srp": 8,
  service: 8,
  finance: 8,
  trade: 7,
  homepage: 7,
  specials: 6,
  "model-research": 5,
  "oem-research": 4,
  parts: 5,
  landing: 6,
  about: 2,
  contact: 4,
  other: 3,
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 15,
  high: 10,
  medium: 5,
  low: 2,
};

/**
 * Opportunity Score = traffic importance × business value × quality gap × fixability
 * Returns 0–100.
 */
export function calcOpportunityScore(
  rank: number,
  totalPages: number,
  pageType: PageType,
  findings: Finding[]
): number {
  // Traffic importance: higher rank = more traffic = higher score
  const trafficScore = Math.round(((totalPages - rank + 1) / totalPages) * 35);

  // Business value: 0–25 based on page type
  const businessValue = Math.round((PAGE_BUSINESS_VALUE[pageType] / 10) * 25);

  // Quality gap: sum of finding weights, capped at 40
  const qualityGap = Math.min(
    findings.reduce((s, f) => s + (SEVERITY_WEIGHT[f.severity] || 0), 0),
    40
  );

  return trafficScore + businessValue + qualityGap;
}

export function scoreToPriority(score: number): Priority {
  if (score >= 70) return "Fix Now";
  if (score >= 50) return "High Opportunity";
  if (score >= 30) return "Needs Content Rebuild";
  return "Monitor";
}
