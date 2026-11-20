import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("gd_auth_token")?.value;

  const isAuthRoute = pathname === "/login";
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/demand") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/follow-ups") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/quotations") ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/branches") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/settings");

  // If attempting to access protected dashboard routes without auth token
  if (isDashboardRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and visiting login page, redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/demand/:path*",
    "/leads/:path*",
    "/follow-ups/:path*",
    "/inventory/:path*",
    "/quotations/:path*",
    "/campaigns/:path*",
    "/notifications/:path*",
    "/reports/:path*",
    "/branches/:path*",
    "/staff/:path*",
    "/settings/:path*",
    "/login",
  ],
};

