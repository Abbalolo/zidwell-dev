import { NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const {
      userId,
      senderName,
      senderAccountNumber,
      senderBankName,
      amount,
      accountNumber,
      accountName,
      bankName,
      bankCode,
      narration,
      pin,
      fee,
      totalDebit,
    } = await req.json();

    // ✅ Validate inputs
    if (
      !userId ||
      !pin ||
      !amount ||
      amount < 100 ||
      !accountNumber ||
      !accountName ||
      !bankCode ||
      !bankName
    ) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // ✅ Verify user + PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid transaction PIN" }, { status: 401 });
    }

    const totalDeduction = totalDebit || amount + fee;
    if (user.wallet_balance < totalDeduction) {
      return NextResponse.json(
        { message: "Insufficient wallet balance (including fees)" },
        { status: 400 }
      );
    }

    // ✅ Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Nomba token missing" },
        { status: 401 }
      );
    }

    const merchantTxRef = `WD_${Date.now()}`;

    // ✅ Insert pending transaction
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        sender: {
          name: senderName,
          accountNumber: senderAccountNumber,
          bankName: senderBankName,
        },
        receiver: {
          name: accountName,
          accountNumber,
          bankName,
        },
        amount,
        fee,
        total_deduction: totalDeduction,
        status: "pending",
        narration: narration || "Withdrawal",
        merchant_tx_ref: merchantTxRef,
      })
      .select("*")
      .single();

    if (txError || !pendingTx) {
      return NextResponse.json({ error: "Could not create transaction record" }, { status: 500 });
    }

    // ✅ Deduct wallet balance first
    const { error: rpcError } = await supabase.rpc("deduct_wallet_balance", {
      user_id: pendingTx.user_id,
      amt: totalDeduction,
      transaction_type: "withdrawal",
      reference: merchantTxRef,
      description: `Withdrawal of ₦${amount} (fee ₦${fee})`,
    });

    if (rpcError) {
      return NextResponse.json({ error: "Failed to deduct wallet balance" }, { status: 500 });
    }

    // ✅ Call Nomba transfer API
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
        senderName,
        merchantTxRef,
        narration,
      }),
    });

    const data = await res.json();
    // console.log("transfer data", data);

    // ✅ Handle failure immediately
    if (data.code === "400") {
      console.log("❌ Nomba transfer failed:", data.description);

      // Update transaction to failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: data,
        })
        .eq("id", pendingTx.id);

      // Refund wallet balance (reverse previous deduction)
      const refundReference = `refund_${merchantTxRef}`;
      const { error: refundErr } = await supabase.rpc("deduct_wallet_balance", {
        user_id: user.id,
        amt: -totalDeduction, 
        transaction_type: "credit",
        reference: refundReference,
        description: `Refund for failed withdrawal of ₦${amount} (fee ₦${fee})`,
      });

      if (refundErr) {
        console.error("❌ Refund failed:", refundErr);
        return NextResponse.json(
          { message: "Transfer failed, refund pending", nombaResponse: data },
          { status: 400 }
        );
      }



      return NextResponse.json(
        {
          message: "Withdrawal failed, funds refunded successfully.",
          reason: data.description || "Transfer not successful",
          refunded: true,
        },
        { status: 400 }
      );
    }

    // ✅ If success, update transaction to processing
    await supabase
      .from("transactions")
      .update({
        status: "processing",
        reference: data?.data?.reference || null,
        external_response: data,
      })
      .eq("id", pendingTx.id);

    return NextResponse.json({
      message: "Withdrawal initiated successfully.",
      transactionId: pendingTx.id,
      merchantTxRef,
      nombaResponse: data,
    });
  } catch (error: any) {
    console.error("Withdraw API error:", error);
    return NextResponse.json(
      { error: "Server error: " + (error.message || error.description) },
      { status: 500 }
    );
  }
}
