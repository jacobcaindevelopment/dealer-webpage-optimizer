import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/access";
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete("dwo_access");
  return response;
}
