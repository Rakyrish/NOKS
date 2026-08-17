import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "noks_admin_token";
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

/**
 * Edge-level gate only: redirects to /admin/login when the session cookie is
 * plainly absent, so a logged-out visitor never even renders an admin page.
 * This is a UX shortcut, not the security boundary — every admin API call is
 * independently authenticated by Django (see lib/admin/api.ts), which is what
 * actually enforces access.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
