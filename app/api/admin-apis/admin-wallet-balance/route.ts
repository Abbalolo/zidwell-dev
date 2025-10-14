import { NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";

export async function GET() {
  try {
    // 1. Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch wallet balance
    const response = await fetch(`${process.env.NOMBA_URL}/v1/accounts/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Nomba API Error: ${err}`);
    }

    const data = await response.json();
    return NextResponse.json({
      nomba_wallet_balance: data?.balance ?? 0,
    });

  } catch (error: any) {
    console.error("Admin Wallet Balance Error:", error);
    return NextResponse.json(
      { error: error?.message || "Something failed" },
      { status: 500 }
    );
  }
}
