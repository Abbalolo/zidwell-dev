import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let transactionId: string | null = null;

  try {
    const token = await getNombaToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId, pin, disco, meterNumber, meterType, amount, payerName, merchantTxRef } = body;

    if (!userId || !pin || !disco || !meterNumber || !meterType || !amount || !payerName || !merchantTxRef) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    const parsedAmount = Number(amount);

    // 1️⃣ Fetch user wallet & PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) return NextResponse.json({ message: "Invalid transaction PIN" }, { status: 401 });

    // 2️⃣ Deduct wallet and create transaction via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc("deduct_wallet_balance", {
      user_id: userId,
      amt: parsedAmount,
      transaction_type: "electricity",
      reference: merchantTxRef,
      description: `Electricity purchase for ${meterNumber} (${meterType})`,
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return NextResponse.json({ error: "Wallet deduction failed", detail: rpcError.message }, { status: 500 });
    }

    if (rpcResult[0].status !== "OK") {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    transactionId = rpcResult[0].tx_id;

    // 3️⃣ Call Nomba API
    try {
      const apiResponse = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/electricity`,
        {
          disco,
          customerId: meterNumber,
          meterType,
          amount: parsedAmount,
          payerName,
          merchantTxRef,
        },
        {
          headers: {
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 4️⃣ Update transaction status → success
      await supabase
        .from("transactions")
        .update({ status: "success", description: `Electricity token generated for ${meterNumber}` })
        .eq("id", transactionId);

      return NextResponse.json({
        success: true,
        token: apiResponse.data,
      });
    } catch (apiError: any) {
      console.error("⚠️ Electricity API error:", apiError.response?.data || apiError.message);

      // Refund wallet via RPC
      await supabase.rpc("refund_wallet_balance", { user_id: userId, amt: parsedAmount });

      await supabase
        .from("transactions")
        .update({ status: "failed_refunded", description: `Electricity purchase failed for ${meterNumber}` })
        .eq("id", transactionId);

      return NextResponse.json({ error: "Failed to purchase electricity token" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("⚠️ Electricity purchase error:", err.message);
    if (transactionId) await supabase.from("transactions").update({ status: "failed" }).eq("id", transactionId);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
