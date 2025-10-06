// app/api/data/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
    const {
      userId,
      pin,
      amount,
      phoneNumber,
      network,
      merchantTxRef,
      senderName,
    } = body;

    // ✅ Basic validation
    if (
      !userId ||
      !pin ||
      !amount ||
      !phoneNumber ||
      !network ||
      !merchantTxRef ||
      !senderName
    ) {
      return NextResponse.json(
        {
          error:
            "All required fields (userId, pin, amount, phoneNumber, network, merchantTxRef) must be provided",
        },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // ✅ 1. Fetch user wallet & pin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.transaction_pin) {
      return NextResponse.json(
        { error: "Transaction PIN not set" },
        { status: 400 }
      );
    }

    // ✅ Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 }
      );
    }

    // ✅ Check wallet balance
    const walletBalance = Number(user.wallet_balance);
    if (walletBalance < parsedAmount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // ✅ 2. Create a pending transaction
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          type: "data",
          amount: parsedAmount,
          status: "pending",
          reference: merchantTxRef,
          description: `Data purchase on ${network} for ${phoneNumber}`,
        },
      ])
      .select("id")
      .single();

    if (txError || !tx) {
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    transactionId = tx.id;

    // ✅ 3. Call Nomba API for data purchase
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

    // ✅ 4. Deduct wallet balance only if Nomba was successful
    const newWalletBalance = walletBalance - parsedAmount;
    const { error: walletUpdateError } = await supabase
      .from("users")
      .update({ wallet_balance: newWalletBalance })
      .eq("id", userId);

    if (walletUpdateError) {
      // Refund scenario
      await supabase
        .from("transactions")
        .update({ status: "refund_pending" })
        .eq("id", transactionId);

      return NextResponse.json(
        { error: "Nomba success but wallet deduction failed. Refund pending." },
        { status: 500 }
      );
    }

    // ✅ 5. Mark transaction as success
    await supabase
      .from("transactions")
      .update({ status: "success" })
      .eq("id", transactionId);

    // ✅ Return Nomba response + updated balance
    return NextResponse.json({
      success: true,
      message: "Data purchase successful",
      transactionId,
      nombaResponse: response.data,
      newWalletBalance,
    });
  } catch (error: any) {
    console.error(
      "❌ Data Purchase Error:",
      error.response?.data || error.message
    );

    // ✅ Rollback transaction if any error occurs
    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
