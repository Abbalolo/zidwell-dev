import { NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { userId, amount, accountNumber, accountName, bankCode, narration } =
      await req.json();

    // ✅ Validate required fields
    if (!userId || !amount || !accountNumber || !accountName || !bankCode) {
      return NextResponse.json(
        {
          message: "Missing required fields",
          requiredFields: ["userId", "amount", "accountNumber", "accountName", "bankCode"],
        },
        { status: 400 }
      );
    }

    // ✅ Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { message: "Amount must be a valid number greater than 0" },
        { status: 400 }
      );
    }

    // ✅ Validate accountNumber
    if (typeof accountNumber !== "string" || accountNumber.length < 10) {
      return NextResponse.json(
        { message: "Account number must be a valid string with at least 10 digits" },
        { status: 400 }
      );
    }

    // ✅ Optional: Validate narration length
    if (narration && narration.length > 120) {
      return NextResponse.json(
        { message: "Narration should not be longer than 120 characters" },
        { status: 400 }
      );
    }

    // ✅ Calculate fees
    const feeRate = 0.0075;
    const fee = Math.ceil(amount * feeRate);
    const totalDeduction = amount + fee;

    // ✅ Fetch user wallet
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id,wallet_balance")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user || user.wallet_balance < totalDeduction) {
      return NextResponse.json(
        { message: "Insufficient wallet balance (including fees)" },
        { status: 400 }
      );
    }

    // ✅ Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: Nomba token missing" }, { status: 401 });
    }

    // Unique reference
    const merchantTxRef = `WD_${Date.now()}`;

    // ✅ Create pending transaction
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        amount,
        status: "pending",
        description: `Withdrawal to ${accountName} (${accountNumber})`,
        narration: narration || "Withdrawal",
        merchant_tx_ref: merchantTxRef,
      })
      .select("id")
      .single();

    if (txError) {
      console.log("Transaction error:", txError);
      return NextResponse.json(
        { error: "Could not create transaction record" },
        { status: 500 }
      );
    }

    // ✅ Trigger transfer from Nomba
    const res = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
      },
      body: JSON.stringify({
        amount,
        accountNumber,
        accountName,
        bankCode,
        senderName: "My App",
        merchantTxRef,
        narration: "Withdrawal",
      }),
    });

    const data = await res.json();
    const newStatus = res.ok && data?.status === "success" ? "success" : "failed";

    // ✅ Update transaction status
    await supabase
      .from("transactions")
      .update({
        status: newStatus,
        reference: data?.data?.reference || null,
      })
      .eq("id", pendingTx.id);

    // ✅ Deduct wallet and record fee
    if (newStatus === "success") {
      await supabase
        .from("users")
        .update({ wallet_balance: user.wallet_balance - totalDeduction })
        .eq("id", userId);

      await supabase.from("transactions").insert({
        user_id: userId,
        type: "fee",
        amount: fee,
        status: "success",
        description: `Withdrawal fee (0.75%) for ₦${amount}`,
        narration: narration || "Withdrawal fee",
        merchant_tx_ref: `FEE_${merchantTxRef}`,
      });
    }

    return NextResponse.json({
      message: "Withdrawal request processed",
      status: newStatus,
      fee,
      totalDeduction,
      nombaResponse: data,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Server error: " + error.message }, { status: 500 });
  }
}
