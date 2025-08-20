// app/api/auth/generate-token/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const body = await req.json();
  const { user } = body;

  const secret = process.env.JWT_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "JWT secret not set" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Missing user data" }, { status: 400 });
  }

  try {
    const token = jwt.sign(user, secret, { expiresIn: "7d" });
    return NextResponse.json({ token });
  } catch (err) {
    console.error("Token generation failed", err);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
