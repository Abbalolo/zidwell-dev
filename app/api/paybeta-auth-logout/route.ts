// app/api/paybeta-logout/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("paybeta_token")?.value;

  try {
    if (token) {
      await axios.post(
        "https://api.paybeta.ng/v1/wallet/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "P-API-KEY": process.env.PAYBETA_API_KEY || "",
          },
        }
      );
    }

    // ✅ Create response and set cookies to expire
    const response = NextResponse.json({ message: "Logged out successfully" });

    response.cookies.set("paybeta_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("paybeta_user", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

      

    return response;
  } catch (error: any) {
    console.error("Logout error:", error?.response?.data || error.message);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
