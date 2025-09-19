// app/api/data/purchase/route.ts
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

  try {
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, amount, phoneNumber, network, merchantTxRef, senderName } =
      body;

    // ✅ 1. Fetch wallet balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (Number(user.wallet_balance) < Number(amount)) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // ✅ 2. Create pending transaction
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          type: "data",
          amount,
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

    // ✅ 3. Call Nomba API
    const response = await axios.post(
      "https://sandbox.nomba.com/v1/bill/data",
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

    // ✅ 4. Deduct wallet

      const newWalletBalance = Number(user.wallet_balance) - Number(amount);
    const { error: updateError } = await supabase
      .from("users")
      .update({
        wallet_balance: newWalletBalance,
      })
      .eq("id", userId);

    if (updateError) {
      // Mark as refund pending
      await supabase
        .from("transactions")
        .update({ status: "refund_pending" })
        .eq("id", transactionId);

      return NextResponse.json(
        {
          error:
            "Nomba success but wallet deduction failed. Refund pending.",
        },
        { status: 500 }
      );
    }

    // ✅ 5. Update transaction success
    await supabase
      .from("transactions")
      .update({ status: "success" })
      .eq("id", transactionId);

       // ✅ Return updated wallet balance so client can sync localStorage
    return NextResponse.json({
      ...response.data,
      newWalletBalance,
    });
  } catch (error: any) {
    console.error(
      "Data Purchase Error:",
      error.response?.data || error.message
    );

    if (transactionId) {
      // ✅ Always mark failed if Nomba or server crashed
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    return NextResponse.json(
      { error: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
