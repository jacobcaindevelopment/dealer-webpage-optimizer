import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";

const TIMEOUT_MS = process.env.FETCH_TIMEOUT_MS ? Number(process.env.FETCH_TIMEOUT_MS) : 12_000;
const USER_AGENT = process.env.FETCH_USER_AGENT ?? "Mozilla/5.0 (compatible; DealerWebpageOptimizer/1.0)";

// Cap responses at 5MB to prevent memory exhaustion
const MAX_BYTES = 5 * 1024 * 1024;

// In-memory rate limiter — resets per serverless instance.
// For production scale, replace with Redis/Upstash.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  if (record.count >= RATE_LIMIT) return true;
  record.count++;
  return false;
}

function isPrivateIP(ip: string): boolean {
  // IPv4 private / reserved ranges
  const v4Blocked = [
    /^127\./,                                    // loopback
    /^0\./,                                      // this network
    /^10\./,                                     // RFC1918
    /^192\.168\./,                               // RFC1918
    /^172\.(1[6-9]|2\d|3[01])\./,                // RFC1918 172.16–172.31
    /^169\.254\./,                               // link-local / cloud metadata
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // carrier-grade NAT RFC6598
    /^198\.51\.100\./,                           // TEST-NET-2
    /^203\.0\.113\./,                            // TEST-NET-3
    /^192\.0\.2\./,                              // TEST-NET-1
    /^255\./,                                    // broadcast
  ];
  if (v4Blocked.some((re) => re.test(ip))) return true;

  // IPv6 private / reserved ranges
  const v6Blocked = [
    /^::1$/,        // loopback
    /^fc/i,         // fc00::/7 unique local
    /^fd/i,         // fc00::/7 unique local
    /^fe[89ab]/i,   // fe80::/10 link-local
    /^::ffff:/i,    // IPv4-mapped — recurse on the embedded v4
  ];
  if (v6Blocked.some((re) => re.test(ip))) {
    if (ip.toLowerCase().startsWith("::ffff:")) {
      return isPrivateIP(ip.slice(7));
    }
    return true;
  }

  return false;
}

async function assertSafeUrl(urlString: string): Promise<void> {
  const parsed = new URL(urlString);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("blocked");
  }

  const hostname = parsed.hostname.toLowerCase();

  const BLOCKED_HOSTNAMES = ["localhost", "metadata.google.internal"];
  if (BLOCKED_HOSTNAMES.includes(hostname)) throw new Error("blocked");

  // Resolve DNS and check the actual IPs (defends against DNS rebinding).
  let addresses: string[] = [];
  try {
    const result = await dns.lookup(hostname, { all: true });
    addresses = result.map((r) => r.address);
  } catch {
    throw new Error("blocked");
  }

  for (const ip of addresses) {
    if (isPrivateIP(ip)) throw new Error("blocked");
  }
}

export async function POST(req: NextRequest) {
  // Origin check — only accept same-origin (or localhost in dev)
  const origin = req.headers.get("origin") ?? "";
  const host = req.headers.get("host") ?? "";
  const devMode = process.env.NODE_ENV === "development";

  const originAllowed =
    devMode ||
    origin === "" ||
    origin.includes(host) ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("https://localhost");

  if (!originAllowed) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }

  // Rate limit per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ status: "rate-limited" }, { status: 429 });
  }

  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid request body." }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ status: "error", error: "Invalid URL." }, { status: 400 });
  }

  try {
    await assertSafeUrl(url);
  } catch {
    return NextResponse.json({ status: "blocked" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    clearTimeout(timer);

    if (response.status === 403 || response.status === 401) {
      return NextResponse.json({
        status: "access-denied",
        httpStatus: response.status,
        error: `Server returned HTTP ${response.status}.`,
      });
    }

    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({
        status: "redirect-error",
        httpStatus: response.status,
        error: `Unresolved redirect (HTTP ${response.status}).`,
      });
    }

    if (!response.ok) {
      return NextResponse.json({
        status: "error",
        httpStatus: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return NextResponse.json({
        status: "non-html",
        error: `Unexpected content type: ${contentType}`,
      });
    }

    // Cap response size before decoding
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ status: "too-large" }, { status: 400 });
    }
    const html = new TextDecoder().decode(buffer);

    if (
      html.includes("cf-browser-verification") ||
      html.includes("challenge-platform") ||
      html.includes("Just a moment") ||
      html.includes("DDoS protection by Cloudflare") ||
      (html.length < 5000 && html.includes("cloudflare"))
    ) {
      return NextResponse.json({
        status: "blocked",
        error: "Cloudflare or bot-protection challenge detected. Automated access not possible.",
      });
    }

    return NextResponse.json({
      status: "success",
      html,
      finalUrl: response.url,
      httpStatus: response.status,
    });
  } catch (err: unknown) {
    clearTimeout(timer);

    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({
        status: "timeout",
        error: `Request timed out after ${TIMEOUT_MS / 1000}s.`,
      });
    }

    const message = err instanceof Error ? err.message : "Unknown fetch error";

    if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
      return NextResponse.json({ status: "error", error: `Could not connect: ${message}` });
    }

    return NextResponse.json({ status: "error", error: message });
  }
}
