// app/api/airtime/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
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
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, amount, phoneNumber, network, merchantTxRef, senderName } =
      body;

    // 1. Fetch wallet
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (Number(user.wallet_balance) < Number(amount)) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // 2. Create pending transaction record
    const { data: newTx, error: txError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          type: "airtime",
          amount,
          status: "pending",
          reference: merchantTxRef,
          description: `Airtime/Data purchase on ${network} for ${phoneNumber}`,
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

    // 3. Call Nomba API
    const response = await axios.post(
      "https://sandbox.nomba.com/v1/bill/topup",
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

    // 4. Deduct wallet balance
    const newWalletBalance = Number(user.wallet_balance) - Number(amount);

    const { error: updateError } = await supabase
      .from("users")
      .update({ wallet_balance: newWalletBalance })
      .eq("id", userId);

    if (updateError) {
      // wallet deduction failed → refund pending
      await supabase
        .from("transactions")
        .update({ status: "refund_pending" })
        .eq("id", transactionId);

      return NextResponse.json(
        { message: "Purchase succeeded but wallet deduction failed" },
        { status: 500 }
      );
    }

    // 5. Mark transaction as success
    await supabase
      .from("transactions")
      .update({ status: "success" })
      .eq("id", transactionId);

    // Return updated wallet balance so client can sync localStorage
    return NextResponse.json({
      ...response.data,
      newWalletBalance,
    });
  } catch (error: any) {
    console.error(
      "Airtime Purchase Error:",
      error.response?.data || error.message
    );

    if (transactionId) {
      // always mark failed if Nomba or server crashed
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
