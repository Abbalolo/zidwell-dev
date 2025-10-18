import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import bcrypt from "bcryptjs";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";

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
    const { pin, userId, customerId, amount, cableTvPaymentType, payerName, merchantTxRef } = body;

    if (!userId || !pin || !customerId || !amount || !cableTvPaymentType || !payerName || !merchantTxRef) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    const parsedAmount = Number(amount);

    // 1️⃣ Fetch user wallet & PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_balance, transaction_pin")
      .eq("id", userId)
      .single();

    if (userError || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.transaction_pin) return NextResponse.json({ error: "Transaction PIN not set" }, { status: 400 });

    // 2️⃣ Verify transaction PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) return NextResponse.json({ message: "Invalid transaction PIN" }, { status: 401 });

    // 3️⃣ Deduct wallet and create transaction via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc("deduct_wallet_balance", {
      user_id: userId,
      amt: parsedAmount,
      transaction_type: "cable", // set type to cable
      reference: merchantTxRef,
      description: `Cable TV purchase for ${customerId}`,
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return NextResponse.json({ error: "Wallet deduction failed", detail: rpcError.message }, { status: 500 });
    }

    if (rpcResult[0].status !== "OK") {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    transactionId = rpcResult[0].tx_id;

    // 4️⃣ Call Nomba API
    try {
      const response = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/cabletv`,
        { customerId, amount: parsedAmount, cableTvPaymentType, payerName, merchantTxRef },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            "Content-Type": "application/json",
          },
          maxBodyLength: Infinity,
        }
      );

      // 5️⃣ Mark transaction success
      await supabase
        .from("transactions")
        .update({ status: "success", description: `Cable TV payment successful for ${customerId}` })
        .eq("id", transactionId);

      return NextResponse.json({ success: true, data: response.data });
    } catch (nombaError: any) {
      console.error("Cable TV API error:", nombaError.response?.data || nombaError.message);

      // Refund wallet via RPC
      await supabase.rpc("refund_wallet_balance", { user_id: userId, amt: parsedAmount });

      await supabase
        .from("transactions")
        .update({ status: "failed_refunded", description: `Cable TV purchase failed for ${customerId}` })
        .eq("id", transactionId);

      return NextResponse.json({ error: "Cable TV purchase failed" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Unexpected cable purchase error:", err.message);
    if (transactionId) await supabase.from("transactions").update({ status: "failed" }).eq("id", transactionId);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
