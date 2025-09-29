import { getNombaToken } from "@/lib/nomba";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getNombaToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/transfers/banks`,
      {
        method: "GET",
        headers: {
          accountId: process.env.NOMBA_ACCOUNT_ID as string,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.json();
      console.error("❌ Nomba API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch banks", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
