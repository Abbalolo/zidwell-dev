import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";

export async function GET(req: NextRequest) {
  const token = await getNombaToken();
  const service = req.nextUrl.searchParams.get("service");

  if (!service) {
    return NextResponse.json(
      { error: "Missing service parameter in query string" },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/cableTvProduct?cableTvType=${service}`,
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "Error fetching GOTV bouquet:",
      error.response?.data || error.message
    );
    if (error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: 400,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch GOTV bouquet" },
      { status: 500 }
    );
  }
}
