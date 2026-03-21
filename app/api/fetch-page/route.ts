import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 12_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid request body." }, { status: 400 });
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ status: "error", error: "Invalid URL." }, { status: 400 });
  }

  // Prevent SSRF — only allow http/https
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ status: "error", error: "Only HTTP/HTTPS URLs are allowed." }, { status: 400 });
    }
    // Block private IP ranges
    const hostname = parsed.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname === "::1"
    ) {
      return NextResponse.json({ status: "error", error: "Private IPs not allowed." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ status: "error", error: "Malformed URL." }, { status: 400 });
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

    // Access denied
    if (response.status === 403 || response.status === 401) {
      return NextResponse.json({
        status: "access-denied",
        httpStatus: response.status,
        error: `Server returned HTTP ${response.status}.`,
      });
    }

    // Redirect error (too many, loop, etc.)
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({
        status: "redirect-error",
        httpStatus: response.status,
        error: `Unresolved redirect (HTTP ${response.status}).`,
      });
    }

    // Non-success
    if (!response.ok) {
      return NextResponse.json({
        status: "error",
        httpStatus: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      });
    }

    // Content-type check
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return NextResponse.json({
        status: "non-html",
        error: `Unexpected content type: ${contentType}`,
      });
    }

    // Check for Cloudflare challenge in response
    const html = await response.text();
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

    // Common blocked patterns
    if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
      return NextResponse.json({ status: "error", error: `Could not connect: ${message}` });
    }

    return NextResponse.json({ status: "error", error: message });
  }
}
