import { PageMeta } from "./types";

/**
 * Extract SEO + content metadata from a raw HTML string.
 * Runs client-side using DOMParser (browser only).
 */
export function extractMeta(html: string, pageUrl: string): PageMeta {
  const doc = new DOMParser().parseFromString(html, "text/html");

  function qs(sel: string) { return doc.querySelector(sel); }
  function qsa(sel: string) { return Array.from(doc.querySelectorAll(sel)); }
  function attr(sel: string, a: string) { return (qs(sel)?.getAttribute(a) || "").trim(); }

  const titleTag = qs("title")?.textContent?.trim() || "";
  const metaDesc = attr('meta[name="description"]', "content");
  const canonical = attr('link[rel="canonical"]', "href");
  const ogTitle = attr('meta[property="og:title"]', "content");
  const ogDesc = attr('meta[property="og:description"]', "content");
  const viewport = attr('meta[name="viewport"]', "content");

  const h1s = qsa("h1").map((e) => e.textContent?.trim() || "").filter(Boolean);
  const h2s = qsa("h2").map((e) => e.textContent?.trim() || "").filter(Boolean);
  const h3s = qsa("h3").map((e) => e.textContent?.trim() || "").filter(Boolean);

  const imgs = qsa("img");
  const totalImgs = imgs.length;
  const missingAlt = imgs.filter((i) => !(i.getAttribute("alt") || "").trim()).length;

  const bodyText = doc.body?.textContent || "";
  const wordCount = bodyText
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 2).length;

  let host = "";
  try { host = new URL(pageUrl).hostname; } catch { /* ignore */ }

  let internalLinks = 0;
  let externalLinks = 0;
  qsa("a[href]").forEach((a) => {
    const h = a.getAttribute("href") || "";
    if (!h || h.startsWith("#") || h.startsWith("mailto:") || h.startsWith("tel:")) return;
    if (h.startsWith("/") || h.includes(host)) internalLinks++;
    else if (h.startsWith("http")) externalLinks++;
  });

  const schemaScripts = qsa('script[type="application/ld+json"]');
  const hasSchema = schemaScripts.length > 0;
  const schemaTypes: string[] = [];
  schemaScripts.forEach((s) => {
    try {
      const data = JSON.parse(s.textContent || "{}");
      const type = data["@type"];
      if (type) schemaTypes.push(Array.isArray(type) ? type.join(", ") : type);
    } catch { /* ignore */ }
  });

  const mobileReady = !!viewport && viewport.includes("width=device-width");

  // Automotive-specific signals
  const allText = bodyText.toLowerCase();
  const hasPhoneNumber = /(\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4}|\d{3}[\s.-]\d{3}[\s.-]\d{4})/.test(bodyText);
  const hasPrice = /\$[\d,]+/.test(bodyText);

  const ctaKeywords = ["schedule", "get approved", "apply now", "contact us", "call us",
    "shop now", "view inventory", "get a quote", "trade in", "value my trade",
    "book appointment", "get directions", "see specials", "view deals"];
  const ctaTexts: string[] = [];
  qsa("a, button").forEach((el) => {
    const text = (el.textContent || "").trim().toLowerCase();
    if (text.length > 2 && text.length < 60 && ctaKeywords.some((k) => text.includes(k))) {
      ctaTexts.push(text);
    }
  });
  const hasCTA = ctaTexts.length > 0;

  const hasVideo = qsa("video, iframe[src*='youtube'], iframe[src*='vimeo']").length > 0;
  const hasReviews = /(\d+(\.\d)?\s*stars?|\d+\s*reviews?|google reviews|dealerrater)/i.test(bodyText);
  const hasHours = /(mon|tue|wed|thu|fri|sat|sun)\s*-?\s*(mon|tue|wed|thu|fri|sat|sun|:|am|pm)/i.test(bodyText)
    || /(hours|open until|closed on)/i.test(bodyText);

  return {
    titleTag, metaDesc, canonical, ogTitle, ogDesc, viewport,
    h1s, h2s, h3s, wordCount, totalImgs, missingAlt,
    internalLinks, externalLinks, hasSchema, schemaTypes, mobileReady,
    hasPhoneNumber, hasPrice, hasCTA, ctaTexts, hasVideo, hasReviews, hasHours,
    rawHtml: html,
  };
}
