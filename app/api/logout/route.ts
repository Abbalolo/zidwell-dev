// pages/api/logout.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ message: "Logged out" });

  // Clear HTTP-only cookies
  res.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  res.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
  res.cookies.set("verified", "", { path: "/", maxAge: 0 });

  return res;
}
