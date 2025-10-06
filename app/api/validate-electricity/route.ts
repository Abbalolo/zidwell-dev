// app/api/electricity/validate/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";

export async function GET(req: NextRequest) {
  try {
    const token = await getNombaToken();

    const { searchParams } = new URL(req.url);

    const disco = searchParams.get("disco");
    const customerId = searchParams.get("customerId");
    console.log("disco", disco);
    console.log("customerId", customerId);
    if (!disco || !customerId) {
      return NextResponse.json(
        { error: "Missing service or meterNumber" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/electricity/lookup`,
      {
        params: {
          disco,
          customerId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        maxBodyLength: Infinity,
      
      }
    );

    console.log(response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "❌ Electricity validation error:",
      error.response?.data || error.message
    );

    console.log("error", error);
    return NextResponse.json(
      { error: "Failed to validate electricity meter" },
      { status: 500 }
    );
  }
}
