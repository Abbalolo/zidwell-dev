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
    if (!token) {
      return NextResponse.json(
        { error: "Unable to authenticate with Nomba" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, pin, amount, phoneNumber, network, merchantTxRef, senderName } = body;

    if (!userId || !pin || !amount || !phoneNumber || !network || !merchantTxRef || !senderName) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1️⃣ Fetch user wallet & pin
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
      transaction_type: "data",
      reference: merchantTxRef,
      description: `Data purchase on ${network} for ${phoneNumber}`,
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
      const response = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/data`,
        {
          amount: parsedAmount,
          phoneNumber,
          network,
          merchantTxRef,
          senderName: senderName || "Zidwell User",
        },
        {
          headers: {
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 4️⃣ Mark transaction as success
      await supabase
        .from("transactions")
        .update({ status: "success", description: `Data purchase successful for ${phoneNumber}` })
        .eq("id", transactionId);

      return NextResponse.json({
        success: true,
        message: "Data purchase successful",
        transactionId,
        nombaResponse: response.data,
      });
    } catch (nombaError: any) {
      console.error("Data Purchase API error:", nombaError.response?.data || nombaError.message);

      // Refund wallet via RPC
      await supabase.rpc("refund_wallet_balance", { user_id: userId, amt: parsedAmount });

      await supabase
        .from("transactions")
        .update({ status: "failed_refunded", description: `Data purchase failed for ${phoneNumber}` })
        .eq("id", transactionId);

      return NextResponse.json({ error: "Data purchase failed" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Unexpected Data purchase error:", err.message);
    if (transactionId) await supabase.from("transactions").update({ status: "failed" }).eq("id", transactionId);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
