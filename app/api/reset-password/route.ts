import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = {
      resetCode: body.resetCode,
      newPin: body.newPin,
      confirmPin: body.confirmPin,
    };

    const response = await axios.post(
      "https://api.paybeta.ng/v1/wallet/pin/reset",
      payload,
      {
        headers: {
          "P-API-KEY": process.env.PAYBETA_API_KEY as string,
          "Content-Type": "application/json",
        },
        maxBodyLength: Infinity,
      }
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error("ERROR resetting pin:", error.response?.data || error.message);
    return NextResponse.json(
      {
        message: "Failed to reset pin",
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
