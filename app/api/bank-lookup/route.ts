import { getNombaToken } from "@/lib/nomba";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const token = await getNombaToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "accountNumber and bankCode are required" },
        { status: 400 }
      );
    }

    const url = `${process.env.NOMBA_URL}/v1/transfers/bank/lookup`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accountId: process.env.NOMBA_ACCOUNT_ID as string,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountNumber,
        bankCode,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Nomba lookup failed:", errorText);
      return NextResponse.json(
        { error: "Failed to lookup account", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("❌ Server error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
