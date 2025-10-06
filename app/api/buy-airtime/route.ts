// app/api/airtime/purchase/route.ts
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

  try {
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      userId,
      amount,
      phoneNumber,
      network,
      merchantTxRef,
      senderName,
      pin,
    } = body;

    if (!userId || !pin || amount < 100) {
      return NextResponse.json(
        {
          error:
            "Invalid input: userId and pin are required, and amount must be at least 100.",
        },
        { status: 400 }
      );
    }

    // ✅ Fetch user with PIN + wallet balance in a single query
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid Transaction PIN" },
        { status: 401 }
      );
    }

    // ✅ Check wallet balance
    if (Number(user.wallet_balance) < Number(amount)) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // ✅ Create pending transaction record
    const { data: newTx, error: txError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          type: "airtime",
          amount,
          status: "pending",
          reference: merchantTxRef,
          description: `Airtime on ${network} for ${phoneNumber}`,
        },
      ])
      .select("id")
      .single();

    if (txError) {
      return NextResponse.json(
        { message: "Could not create transaction record" },
        { status: 500 }
      );
    }

    transactionId = newTx.id;

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

    // ✅ Deduct wallet balance
    const newWalletBalance = Number(user.wallet_balance) - Number(amount);
    const { error: updateError } = await supabase
      .from("users")
      .update({ wallet_balance: newWalletBalance })
      .eq("id", userId);

    if (updateError) {
      await supabase
        .from("transactions")
        .update({ status: "refund_pending" })
        .eq("id", transactionId);

      return NextResponse.json(
        { message: "Purchase succeeded but wallet deduction failed" },
        { status: 500 }
      );
    }

    // ✅ Mark transaction as success
    await supabase
      .from("transactions")
      .update({ status: "success" })
      .eq("id", transactionId);

    // ✅ Final response
    return NextResponse.json({
      message: "Airtime purchase successful",
      transaction: response.data,
      newWalletBalance,
    });
  } catch (error: any) {
    console.error(
      "Airtime Purchase Error:",
      error.response?.data || error.message
    );

    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    return NextResponse.json(
      { message: "Transaction failed", detail: error.message },
      { status: 500 }
    );
  }
}
