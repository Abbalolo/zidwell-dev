// app/api/cable/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import bcrypt from "bcryptjs"; // ✅ for PIN verification
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let transactionId: string | null = null;

  try {
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      pin,
      userId,
      customerId,
      amount,
      cableTvPaymentType,
      payerName,
      merchantTxRef,
    } = body;

    if (
      !userId ||
      !pin ||
      !customerId ||
      !amount ||
      !cableTvPaymentType ||
      !payerName ||
      !merchantTxRef
    ) {
      console.log("here 4");
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);

    // ✅ 1. Fetch wallet & PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_balance, transaction_pin")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ 2. Verify transaction PIN
    if (!user.transaction_pin) {
      console.log("here3");
      return NextResponse.json(
        { error: "Transaction PIN not set" },
        { status: 400 }
      );
    }

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);

    if (!isValid) {
      console.log("here1");
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 }
      );
    }

    // ✅ 3. Check balance
    if (Number(user.wallet_balance) < parsedAmount) {
      console.log("here2");
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // ✅ 4. Create transaction as "pending"
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          type: "cable",
          amount: parsedAmount,
          status: "pending",
          reference: merchantTxRef,
          description: `Cable TV purchase for ${customerId}`,
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

    // ✅ 5. Deduct wallet before calling Nomba API
    const newWalletBalance = Number(user.wallet_balance) - parsedAmount;
    const { error: deductError } = await supabase
      .from("users")
      .update({ wallet_balance: newWalletBalance })
      .eq("id", userId);

    if (deductError) {
      return NextResponse.json(
        { error: "Failed to deduct wallet balance" },
        { status: 500 }
      );
    }

    // ✅ 6. Call Nomba API
    try {
      const response = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/cabletv`,
        {
          customerId,
          amount: parsedAmount,
          cableTvPaymentType,
          payerName,
          merchantTxRef,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            "Content-Type": "application/json",
          },
          maxBodyLength: Infinity,
        }
      );

      // ✅ 7. Mark transaction success
      await supabase
        .from("transactions")
        .update({
          status: "success",
          description: `Cable TV payment successful for ${customerId}`,
        })
        .eq("id", tx.id);

      return NextResponse.json({
        success: true,
        data: response.data,
        newWalletBalance,
      });
    } catch (nombaError: any) {
      console.error(
        "⚠️ Cable TV API error:",
        nombaError.response?.data || nombaError.message
      );

      // ✅ 8. Refund balance
      await supabase
        .from("users")
        .update({ wallet_balance: user.wallet_balance }) // revert to original balance
        .eq("id", userId);

      // ✅ Mark transaction failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          description: `Cable TV purchase failed for ${customerId}`,
        })
        .eq("id", tx.id);

      return NextResponse.json(
        {
          error: nombaError.response?.data || "Cable TV purchase failed",
          newWalletBalance: user.wallet_balance,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("⚠️ Cable purchase error:", err.message);

    // ✅ Mark transaction failed if created
    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
