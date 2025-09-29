// app/api/electricity/providers/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";

export async function GET() {
  const token = await getNombaToken();

  try {
    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/electricity/discos`,
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "Electricity provider fetch error:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch electricity providers" },
      { status: 500 }
    );
  }
}
