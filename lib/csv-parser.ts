import { ParsedPage } from "./types";
import { classifyPage } from "./page-classifier";

export interface CSVParseResult {
  pages: ParsedPage[];
  metricLabel: string;
  error?: string;
}

/**
 * Normalize a raw number string from GA4:
 *   "12,345" → 12345   "1.2K" → 1200   "1.5M" → 1500000
 */
function cleanNum(raw: string): number {
  if (!raw) return 0;
  const s = String(raw).trim().replace(/,/g, "");
  if (!s || s === "-" || s.toLowerCase() === "(not set)") return 0;
  if (/\d[kK]$/.test(s)) return Math.round(parseFloat(s) * 1_000);
  if (/\d[mM]$/.test(s)) return Math.round(parseFloat(s) * 1_000_000);
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n);
}

function splitCSVLine(line: string, delim: string): string[] {
  if (delim === "\t") return line.split("\t").map((c) => c.trim());
  const cols: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

export function parseGA4Text(raw: string, source: string): CSVParseResult {
  const allLines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Find the header row — skip GA4 comment/metadata lines that start with #
  let headerIdx = -1;
  for (let i = 0; i < Math.min(allLines.length, 30); i++) {
    const line = allLines[i];
    const lower = line.toLowerCase();
    if (line.startsWith("#")) continue; // GA4 comment rows e.g. "# Pages and screens"
    if (/^[\d\s,\-.]+$/.test(line)) continue; // Pure number rows
    if (
      lower.includes("page") ||
      lower.includes("path") ||
      lower.includes("screen") ||
      lower.includes("landing") ||
      lower.includes("views") ||
      lower.includes("sessions") ||
      lower.includes("users") ||
      lower.includes("event")
    ) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) headerIdx = 0;

  const dataLines = allLines.slice(headerIdx);
  if (dataLines.length < 2) {
    return {
      pages: [],
      metricLabel: "Views",
      error: `No data rows found in ${source}. Make sure you exported the Pages and Screens report from GA4.`,
    };
  }

  const delim = dataLines[0].includes("\t") ? "\t" : ",";
  const rawHeaders = splitCSVLine(dataLines[0], delim);
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  function findCol(...names: string[]): number {
    for (const name of names) {
      const exact = headers.indexOf(name);
      if (exact >= 0) return exact;
    }
    for (const name of names) {
      const fuzzy = headers.findIndex((h) => h.includes(name) || name.includes(h));
      if (fuzzy >= 0) return fuzzy;
    }
    return -1;
  }

  const iPath = findCol(
    "pagepathplusquerystring",
    "pagepathandscreenclass",
    "pagepath",
    "landingpage",
    "screenname",
    "screenclass",
    "path",
    "page"
  );

  const iTitle = findCol(
    "pagetitleandscreenclass",
    "pagetitleandscreenname",
    "pagetitle",
    "screentitle",
    "title"
  );

  // IMPORTANT: check "views" before "screenpageviews" — GA4 UI exports use "Views"
  const iViews = findCol(
    "views",
    "screenpageviews",
    "pageviews",
    "screenviews",
    "sessions",
    "engagedsessions",
    "activeusers",
    "totalusers",
    "eventcount"
  );

  const metricLabel = iViews >= 0 ? rawHeaders[iViews] : "Views";

  if (iPath < 0) {
    return {
      pages: [],
      metricLabel,
      error: `Could not find a page path column. Detected headers: ${rawHeaders.slice(0, 6).join(", ")}`,
    };
  }
  if (iViews < 0) {
    return {
      pages: [],
      metricLabel,
      error: `Could not find a traffic column. Detected headers: ${rawHeaders.slice(0, 6).join(", ")}`,
    };
  }

  const SKIP = [/^\(not set\)$/i, /^\(other\)$/i, /^total$/i, /^grand total$/i];
  const pages: Omit<ParsedPage, "pageType" | "url">[] = [];

  for (let i = 1; i < dataLines.length; i++) {
    const cols = splitCSVLine(dataLines[i], delim);
    if (!cols || cols.length < 2) continue;
    const rawPath = (cols[iPath] || "").trim();
    if (!rawPath) continue;
    if (SKIP.some((re) => re.test(rawPath))) continue;
    if (/^\d[\d,.]+$/.test(rawPath)) continue; // Pure numbers in path column

    let path = rawPath;
    if (path.startsWith("http")) {
      try { path = new URL(path).pathname; } catch { /* keep as-is */ }
    }
    if (!path.startsWith("/")) path = "/" + path;

    const views = cleanNum(cols[iViews] || "");

    // Skip rows where views is 0 AND the path looks like a header repeat
    // (zero-view rows are valid — only skip if clearly not a real page)
    pages.push({
      id: "p" + pages.length,
      rank: pages.length + 1,
      path,
      title: iTitle >= 0 ? (cols[iTitle] || "").trim() : "",
      views,
    });
  }

  if (pages.length === 0) {
    return { pages: [], metricLabel, error: "No valid page rows found after parsing." };
  }

  // Sort by views descending and re-rank
  pages.sort((a, b) => b.views - a.views);
  pages.forEach((p, i) => {
    p.rank = i + 1;
    p.id = "p" + i;
  });

  return {
    pages: pages as ParsedPage[], // pageType + url added by caller
    metricLabel,
  };
}

export function enrichPages(pages: ParsedPage[], baseUrl: string): ParsedPage[] {
  return pages.map((p) => ({
    ...p,
    pageType: classifyPage(p.path, p.title),
    url: baseUrl.replace(/\/+$/, "") + p.path,
  }));
}
