import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("paybeta_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const response = await axios.post(
      "https://api.paybeta.ng/v1/wallet/balance",
      body, 
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          "P-API-KEY": process.env.PAYBETA_API_KEY || "",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error("Paybeta balance error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        message: "Failed to fetch wallet balance",
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
