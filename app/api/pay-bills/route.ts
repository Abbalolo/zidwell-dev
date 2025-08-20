// app/api/flutterwave/pay-bill/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, biller_code, amount, customer_id } = await req.json();

    // Check user balance
    const { data: user } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (!user || user.wallet_balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

  
    await supabase.rpc("decrement_wallet_balance", { user_id: userId, amt: amount });

    // Call Flutterwave Bills API
    const response = await axios.post(
      "https://api.flutterwave.com/v3/bills",
      {
        country: "NG",
        customer: customer_id,
        amount,
        recurrence: "ONCE",
        type: "BILLS",
        reference: `bill-${Date.now()}`,
        biller_code,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "bill",
      amount,
      status: "success",
      reference: response.data.data?.reference,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Bill payment error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || "Bill payment failed" },
      { status: 500 }
    );
  }
}
