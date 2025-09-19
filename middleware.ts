import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const verified = req.cookies.get("verified")?.value;

  // Only protect dashboard routes
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!verified) {
      // No cookie → not authenticated
      return NextResponse.redirect(new URL("/auth/login", req.url));
    } else if (verified === "false") {
      // User not verified → redirect to onboarding
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
