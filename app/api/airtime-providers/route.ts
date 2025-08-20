// app/api/billers/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    // Call Flutterwave Biller Information API
    const response = await axios.get(
      "https://api.flutterwave.com/v3/bills/CABLEBILL/billers?country=NG",
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          accept: "application/json",
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "Flutterwave Error:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      {
        error: "Failed to fetch biller information",
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
