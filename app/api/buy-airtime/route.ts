"use server";

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let transactionId: string | null = null;
  let userId: string | undefined;
  let amount: number | undefined;

  try {
    const body = await req.json();
    userId = body.userId;
    amount = body.amount;
    const { phoneNumber, network, merchantTxRef, senderName, pin } = body;

    if (!userId || !pin || !amount || amount < 100) {
      return NextResponse.json(
        { message: "Invalid input: userId, pin are required and amount must be >= 100" },
        { status: 400 }
      );
    }

    // Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify transaction PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid Transaction PIN" }, { status: 401 });
    }

    // Deduct wallet using RPC and create transaction
    const { data: rpcResult, error: rpcError } = await supabase.rpc("deduct_wallet_balance", {
      user_id: userId,
      amt: amount,
      transaction_type: "airtime",
      reference: merchantTxRef,
      description: `Airtime on ${network} for ${phoneNumber}`,
    });

    if (rpcError) {
      console.log(rpcError, "rpcError");
      return NextResponse.json({ message: "Wallet deduction failed", detail: rpcError.message }, { status: 500 });
    }

    if (rpcResult[0].status !== "OK") {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    // Transaction ID from RPC
    transactionId = rpcResult[0].tx_id;

    // Call Nomba API
    const response = await axios.post(
      `${process.env.NOMBA_URL}/v1/bill/topup`,
      {
        amount,
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

    // Mark transaction as success
    await supabase.from("transactions").update({ status: "success" }).eq("id", transactionId);

    return NextResponse.json({
      message: "Airtime purchase successful",
      transaction: response.data,
    });
  } catch (error: any) {
    console.error("Airtime Purchase Error:", error.response?.data || error.message);

    // Refund if userId and amount exist
    if (userId && amount) {
      try {
        await supabase.rpc("refund_wallet_balance", { user_id: userId, amt: amount });
        if (transactionId) {
          await supabase.from("transactions").update({ status: "failed_refunded" }).eq("id", transactionId);
        }
      } catch (refundError) {
        console.error("Refund failed:", refundError);
        if (transactionId) {
          await supabase.from("transactions").update({ status: "refund_pending" }).eq("id", transactionId);
        }
      }
    }

    return NextResponse.json(
      { message: "Transaction failed, user refunded if deducted", detail: error.message },
      { status: 500 }
    );
  }
}
