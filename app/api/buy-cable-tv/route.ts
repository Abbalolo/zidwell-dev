// app/api/cable/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      userId,
      customerId,
      amount,
      cableTvPaymentType,
      payerName,
      merchantTxRef,
    } = body;

    const parsedAmount = Number(amount);

    // 1. Fetch wallet balance from users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (Number(user.wallet_balance) < parsedAmount) {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // 2. Create transaction as "pending"
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

    // 3. Deduct wallet balance before API call
    const { error: deductError } = await supabase.rpc(
      "decrement_wallet_balance",
      {
        user_id: userId,
        amt: parsedAmount, // ✅ match function param
      }
    );

    if (deductError) {
      console.error("deductError", deductError);
      return NextResponse.json(
        { error: "Failed to deduct balance" },
        { status: 500 }
      );
    }

    try {
      // 4. Call Nomba API
      const response = await axios.post(
        "https://sandbox.nomba.com/v1/bill/cabletv",
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

      // 5. Mark transaction as success
      await supabase
        .from("transactions")
        .update({ status: "success" })
        .eq("id", tx.id);

      // ✅ Fetch updated wallet balance
      const { data: updatedUser } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", userId)
        .single();

      return NextResponse.json({
        success: true,
        data: response.data,
        newWalletBalance: updatedUser?.wallet_balance ?? null,
      });
    } catch (nombaError: any) {
      console.error(
        "Cable TV API error:",
        nombaError.response?.data || nombaError.message
      );

      // Refund wallet if API fails
      await supabase.rpc("credit_balance", {
        user_id: userId,
        amt: parsedAmount, // ✅ match function param
      });

      // Mark transaction failed
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", tx.id);

      // ✅ Fetch updated wallet balance after refund
      const { data: updatedUser } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", userId)
        .single();

      return NextResponse.json(
        {
          error: nombaError.response?.data || "Cable purchase failed",
          newBalance: updatedUser?.wallet_balance ?? null,
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("Cable purchase error:", err.message);

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
