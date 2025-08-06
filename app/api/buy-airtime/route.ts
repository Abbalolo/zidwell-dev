import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {

  const cookieStore = await cookies();
  const token = cookieStore.get("paybeta_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }


    const body = await req.json();

    const payload = {
      amount: body.amount,
      service: body.service,
      customerId: body.customerId,
      reference: body.reference,
      pin: body.pin,
    };
    // console.log("Airtime Purchase Payload:", payload);

    const response = await axios.post(
      'https://api.paybeta.ng/v1/wallet/payment',
      payload,
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          "P-API-KEY": process.env.PAYBETA_API_KEY || "",
          "Authorization": `Bearer ${token}`
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    // console.error("Airtime Purchase Error:", error.response?.data || error.message);

    // Return full error response from Paybeta if available
    if (error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: 400,
      });
    }

    // Generic fallback error
    return NextResponse.json(
      {
        message: "An unexpected server error occurred.",
        detail: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
