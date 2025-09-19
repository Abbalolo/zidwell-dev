// app/api/electricity/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let transactionId: string | null = null;

  const token = await getNombaToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      userId,
      disco,
      meterNumber,
      meterType,
      amount,
      payerName,
      merchantTxRef,
    } = body;

    // 1. Check wallet balance
 const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (Number(user.wallet_balance) < Number(amount)) {
      return NextResponse.json(
        { message: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 2. Create transaction as "pending"
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

    // 3. Deduct from wallet before API call
      const newWalletBalance = Number(user.wallet_balance) - Number(amount);
    const { error: updateError } = await supabase
      .from("users")
      .update({
        wallet_balance: newWalletBalance,
      })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to deduct balance" },
        { status: 500 }
      );
    }

    try {
      // 4. Call Nomba electricity API
      const apiResponse = await axios.post(
        "https://sandbox.nomba.com/v1/bill/electricity",
        {
          disco,
          customerId: meterNumber,
          meterType,
          amount,
          payerName,
          merchantTxRef,
        },
        {
          maxBodyLength: Infinity,
          headers: {
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ Success → mark transaction success
      await supabase
        .from("transactions")
        .update({
          status: "success",
          description: `Electricity token generated for ${meterNumber}`,
        })
        .eq("id", transaction.id);

      // ✅ Return token + updated wallet balance
      return NextResponse.json({
        ...apiResponse.data,
        newWalletBalance: newWalletBalance,
      });
    } catch (apiError: any) {
      console.error(
        "Electricity purchase API error:",
        apiError.response?.data || apiError.message
      );

      // Refund wallet on failure
      await supabase
        .from("wallets")
        .update({ balance: Number(user.wallet_balance) }) // revert back
        .eq("user_id", userId);

      // Mark transaction failed
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
    console.error("Electricity purchase error:", error.message);

    // fallback: mark transaction failed if created
    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
