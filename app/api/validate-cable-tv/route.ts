// app/api/cable/validate/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";

export async function GET(req: Request) {
  try {
    const token = await getNombaToken();
    const { searchParams } = new URL(req.url);

    const cableTvType = searchParams.get("cableTvType");
    const customerId = searchParams.get("customerId");

    if (!cableTvType || !customerId) {
      return NextResponse.json(
        { error: "Missing service or smartCardNumber" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/cabletv/lookup`,
      {
        params: {
          customerId,
          cableTvType,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        maxBodyLength: Infinity,
      }
    );

    console.log("✅ Cable Validation Response:", response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "❌ Cable validation error:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Failed to validate cable details" },
      { status: 500 }
    );
  }
}
