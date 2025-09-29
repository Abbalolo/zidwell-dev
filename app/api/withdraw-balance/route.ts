import { NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { userId, amount, accountNumber, accountName, bankCode } =
      await req.json();

    const feeRate = 0.0075;
    const fee = Math.ceil(amount * feeRate);
    const totalDeduction = amount + fee;

    // 2. Fetch user balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id,wallet_balance")
      .eq("id", userId)
      .single();

    if (userError) {
      console.log("here");
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user || user.wallet_balance < totalDeduction) {
      return NextResponse.json(
        { message: "Insufficient wallet balance (including fee)" },
        { status: 400 }
      );
    }

    // 3. Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const merchantTxRef = `WD_${Date.now()}`;

    // 4. Insert pending withdrawal transaction
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        amount,
        status: "pending",
        description: `Withdrawal to ${accountName} (${accountNumber})`,
        merchant_tx_ref: merchantTxRef,
      })
      .select("id")
      .single();

    if (txError) {
      console.log("txError", txError);
      return NextResponse.json(
        { error: "Could not create transaction record" },
        { status: 500 }
      );
    }

    // 5. Call Nomba Withdraw API
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
    console.log(data);
    // 6. Update transaction status
    const newStatus =
      res.ok && data?.status === "success" ? "success" : "failed";

    await supabase
      .from("transactions")
      .update({
        status: newStatus,
        reference: data?.data?.reference || null,
      })
      .eq("id", pendingTx.id);

    // 7. Deduct wallet balance & insert fee transaction if successful
    if (newStatus === "success") {
      // Deduct total (withdrawal + fee)
      await supabase
        .from("users")
        .update({ wallet_balance: user.wallet_balance - totalDeduction })
        .eq("id", userId);

      // Record fee separately
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "fee",
        amount: fee,
        status: "success",
        description: `Withdrawal fee (0.75%) for ₦${amount}`,
        merchant_tx_ref: `FEE_${merchantTxRef}`,
      });
    }

    return NextResponse.json({
      ...data,
      fee,
      totalDeduction,
    });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
