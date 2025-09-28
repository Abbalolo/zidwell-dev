import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("sb-access-token")?.value;
  const verified = req.cookies.get("verified")?.value;

  // ✅ 1. Require a valid session for any dashboard page
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    // If no session cookie → redirect to login
    if (!accessToken) {
      const res = NextResponse.redirect(new URL("/auth/login", req.url));
      res.cookies.delete("sb-access-token");
      res.cookies.delete("sb-refresh-token");
      res.cookies.delete("verified");
      return res;
    }

   
    if (verified === "false") {
      const res = NextResponse.redirect(new URL("/onboarding", req.url));
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
