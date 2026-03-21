import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that never require authentication
const PUBLIC_PREFIXES = ["/access", "/api/access", "/api/logout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass through Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Always pass through public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check access cookie
  const cookie = request.cookies.get("dwo_access");
  if (cookie?.value === "granted") {
    return NextResponse.next();
  }

  // Not authenticated → redirect to access page
  const accessUrl = request.nextUrl.clone();
  accessUrl.pathname = "/access";
  return NextResponse.redirect(accessUrl);
}

export const config = {
  // Run on all routes except Next.js static internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
