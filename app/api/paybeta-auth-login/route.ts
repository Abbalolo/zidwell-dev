import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";

const JWT_TOKEN_SECRET = process.env.JWT_TOKEN_SECRET || "your-custom-secret-key";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await axios.post(
      "https://api.paybeta.ng/v1/wallet/login",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "P-API-KEY": process.env.PAYBETA_API_KEY || "",
        },
      }
    );

    const { token, user } = response.data;

    console.log("from paybeta", user)

    // Sign the user object into a JWT
    const userJWT = jwt.sign(user, JWT_TOKEN_SECRET, { expiresIn: "1d" });

    // Create the response
    const res = NextResponse.json({ user }, { status: 200 });

    // Set cookies on the response
    res.cookies.set("paybeta_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    res.cookies.set("paybeta_user", userJWT, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error: any) {
    console.error("Login error:", error?.response?.data || error.message);
    return NextResponse.json({ message: "Login failed" }, { status: 401 });
  }
}
