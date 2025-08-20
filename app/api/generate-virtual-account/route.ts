
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, first_name, last_name, phone, amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // ✅ Generate temporary virtual account number
    const response = await axios.post(
      "https://api.flutterwave.com/v3/virtual-account-numbers",
      {
        email,
        is_permanent: false, 
        currency: "NGN",
        amount,
        narration: `Fund Wallet - ${first_name} ${last_name}`,
        tx_ref: `fund-${userId}-${Date.now()}`, 
        phonenumber: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    const account = response.data.data;

    return NextResponse.json({
      success: true,
      account, 
    });
  } catch (error: any) {
    console.error("❌ Flutterwave Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to create virtual account",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
