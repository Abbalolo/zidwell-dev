import { NextRequest, NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, first_name, last_name } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ Format expiryDate as "YYYY-MM-DD HH:mm:ss"
    const expiry = new Date(Date.now() + 30 * 60 * 1000);
    const expiryDate =
      expiry.getFullYear() +
      "-" +
      String(expiry.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(expiry.getDate()).padStart(2, "0") +
      " " +
      String(expiry.getHours()).padStart(2, "0") +
      ":" +
      String(expiry.getMinutes()).padStart(2, "0") +
      ":" +
      String(expiry.getSeconds()).padStart(2, "0");

    const res = await fetch(`${process.env.NOMBA_URL}/v1/accounts/virtual`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountName: `${first_name} ${last_name}`,
        accountRef: `tmp-${userId}-${Date.now()}`,
        currency: "NGN",
        expiryDate: expiryDate,
      }),
    });

    const data = await res.json();

    console.log("temporary acc", data);

    if (!res.ok) {
      console.error("❌ Nomba Error:", data);
      return NextResponse.json(
        { error: "Failed to create virtual account", details: data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      account: data.data,
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create virtual account", details: error.message },
      { status: 500 }
    );
  }
}
