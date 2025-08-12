// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Use the same secret used to sign the JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_TOKEN_SECRET || "your-custom-secret-key");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect routes that start with /dashboard
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("paybeta_user")?.value;

  if (!token) {
    // Redirect to login if token missing
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    // Verify the JWT
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    // Redirect if verification fails
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"], // Match all dashboard routes
};
