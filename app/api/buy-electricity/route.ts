// app/api/electricity/purchase/route.ts
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

  // ✅ Get Nomba token
  const token = await getNombaToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      userId,
      pin,
      disco,
      meterNumber,
      meterType,
      amount,
      payerName,
      merchantTxRef,
    } = body;

    // ✅ Validate request body
    if (
      !userId ||
      !pin ||
      !disco ||
      !meterNumber ||
      !meterType ||
      !amount ||
      !payerName ||
      !merchantTxRef
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // ✅ 1. Fetch user wallet + PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ 2. Check if transaction PIN is set
    if (!user.transaction_pin) {
      return NextResponse.json(
        { error: "Transaction PIN not set" },
        { status: 400 }
      );
    }

    // ✅ 3. Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 }
      );
    }

    // ✅ 4. Check wallet balance
    if (Number(user.wallet_balance) < Number(amount)) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // ✅ 5. Create transaction as "pending"
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          type: "electricity",
          amount,
          status: "pending",
          reference: merchantTxRef,
          description: `Electricity purchase for ${meterNumber} (${meterType})`,
        },
      ])
      .select("id")
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    transactionId = transaction.id;

    // ✅ 6. Deduct wallet before calling API
    const newWalletBalance = Number(user.wallet_balance) - Number(amount);
    const { error: updateError } = await supabase
      .from("users")
      .update({ wallet_balance: newWalletBalance })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update wallet balance" },
        { status: 500 }
      );
    }

    // ✅ 7. Call Nomba API
    try {
      const apiResponse = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/electricity`,
        {
          disco,
          customerId: meterNumber,
          meterType,
          amount,
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

      // ✅ 8. Update transaction status → success
      await supabase
        .from("transactions")
        .update({
          status: "success",
          description: `Electricity token generated for ${meterNumber}`,
        })
        .eq("id", transaction.id);

      return NextResponse.json({
        success: true,
        token: apiResponse.data,
        newWalletBalance,
      });
    } catch (apiError: any) {
      console.error(
        "⚠️ Electricity API error:",
        apiError.response?.data || apiError.message
      );

      // ✅ Refund on API failure
      await supabase
        .from("users")
        .update({ wallet_balance: user.wallet_balance }) // revert
        .eq("id", userId);

      await supabase
        .from("transactions")
        .update({
          status: "failed",
          description: `Electricity purchase failed for ${meterNumber}`,
        })
        .eq("id", transaction.id);

      return NextResponse.json(
        { error: "Failed to purchase electricity token" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("⚠️ Electricity purchase error:", error.message);

    // ✅ Mark transaction failed if created
    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
