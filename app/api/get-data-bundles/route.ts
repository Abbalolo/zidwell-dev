import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

import { getNombaToken } from "@/lib/nomba";

export async function GET(req: NextRequest) {
  const token = await getNombaToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const service = req.nextUrl.searchParams.get("service");

  if (!service) {
    return NextResponse.json(
      { error: "Missing service parameter in query string" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/data-plan/${service}`,
      {
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
      "Error fetching data list:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch data bundle list" },
      { status: 500 }
    );
  }
}
