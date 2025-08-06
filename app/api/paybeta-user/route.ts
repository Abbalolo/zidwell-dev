import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_TOKEN_SECRET = process.env.JWT_TOKEN_SECRET || "your-own-secret-key";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("paybeta_user")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

try {
  const decodedUser = jwt.verify(token, JWT_TOKEN_SECRET);
  return NextResponse.json({ user: decodedUser });
} catch (err: any) {
  console.error("JWT ERROR:", err.message);
  return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
}
}
