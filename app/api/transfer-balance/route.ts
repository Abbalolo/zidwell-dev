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
      fee = 0, // ✅ fee from client
      totalDebit, // ✅ total amount (amount + fee)
    } = await req.json();

    // 🧩 Validate required fields
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
        {
          message: "Missing required fields",
          requiredFields: [
            "userId",
            "amount",
            "accountNumber",
            "accountName",
            "bankCode",
            "bankName",
            "pin",
          ],
        },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { message: "Amount must be a valid number greater than 0" },
        { status: 400 }
      );
    }

    if (typeof accountNumber !== "string" || accountNumber.length < 6) {
      return NextResponse.json(
        { message: "Account number must be a valid string" },
        { status: 400 }
      );
    }

    // 🔍 Fetch user and verify PIN
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
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 }
      );
    }

    // 🧾 Ensure user has enough balance (including fees)
    const totalDeduction = totalDebit || amount + fee;
    if (user.wallet_balance < totalDeduction) {
      return NextResponse.json(
        { message: "Insufficient wallet balance (including fees)" },
        { status: 400 }
      );
    }

    // 🔐 Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Nomba token missing" },
        { status: 401 }
      );
    }

    // 🧾 Details
    const senderDetails = {
      name: senderName,
      accountNumber: senderAccountNumber,
      bankName: senderBankName,
    };

    const receiverDetails = {
      name: accountName,
      accountNumber,
      bankName,
    };

    const merchantTxRef = `WD_${Date.now()}`;

    // 🧩 Prevent duplicate
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id, status")
      .eq("merchant_tx_ref", merchantTxRef)
      .maybeSingle();

    if (existingTx) {
      console.log("⚠️ Duplicate transaction prevented:", merchantTxRef);
      return NextResponse.json({
        message: "Transaction already exists",
        transactionId: existingTx.id,
      });
    }

    // 📝 Insert pending transaction (with fee)
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        sender: senderDetails,
        receiver: receiverDetails,
        amount,
        fee, // ✅ include fee
        total_deduction: totalDeduction, // ✅ amount + fee
        status: "pending",
        description: `Withdrawal to ${receiverDetails.name} (${receiverDetails.accountNumber})`,
        narration: narration || "Withdrawal",
        merchant_tx_ref: merchantTxRef,
      })
      .select("*")
      .single();

    if (txError || !pendingTx) {
      console.error("Could not create transaction record:", txError);
      return NextResponse.json(
        { error: "Could not create transaction record" },
        { status: 500 }
      );
    }

    // 🔁 Deduct balance via RPC
    const reference = pendingTx.merchant_tx_ref;
    const withdrawalAmount = amount;
    const totalFees = fee;

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: pendingTx.user_id,
        amt: totalDeduction,
        transaction_type: "debit",
        reference,
        description: `Withdrawal of ₦${withdrawalAmount} (including ₦${totalFees} fee)`,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return NextResponse.json(
        { error: "Failed to deduct wallet balance" },
        { status: 500 }
      );
    }

    // 🚀 Send transfer request to Nomba
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
        narration: "Withdrawal",
      }),
    });

    const data = await res.json();
    console.log("transfer data", data);

    // 🗂️ Update transaction with Nomba response
    await supabase
      .from("transactions")
      .update({
        external_response: data,
        status: "processing",
        reference: data?.data?.reference || null,
      })
      .eq("id", pendingTx.id);

    return NextResponse.json({
      message:
        "Withdrawal initiated (processing). Waiting for webhook confirmation.",
      merchantTxRef,
      transactionId: pendingTx.id,
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
