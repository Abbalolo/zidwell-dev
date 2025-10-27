// app/api/withdraw/route.ts
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
      amount,
      accountNumber,
      accountName,
      bankCode,
      narration,
      pin,
    } = await req.json();

    // Basic validation
    if (
      !userId ||
      !pin ||
      !amount ||
      amount < 100 ||
      !accountNumber ||
      !accountName ||
      !bankCode
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

    // Fetch user with PIN + wallet balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ✅ Verify transaction PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 }
      );
    }



    if (user.wallet_balance < amount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance (including fees)" },
        { status: 400 }
      );
    }

    // Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Nomba token missing" },
        { status: 401 }
      );
    }

    const merchantTxRef = `WD_${Date.now()}`;

    // Insert pending withdrawal transaction
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        amount,
        total_deduction: amount,
        status: "pending",
        description: `Withdrawal to ${accountName} (${accountNumber})`,
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

    // Send transfer to Nomba
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
 console.log("transfer data", data)
    if(data?.code === "400") {
      return NextResponse.json({
      message: data.description,
      
    });
    }

   

    // Save Nomba response and set status to processing
    await supabase
      .from("transactions")
      .update({
        external_response: JSON.stringify(data || {}),
        status: "success",
        reference: data?.data?.reference || null,
      })
      .eq("id", pendingTx.id);


    return NextResponse.json({
      message: "Withdrawal initiated (processing). Waiting for webhook confirmation.",
      merchantTxRef,
      transactionId: pendingTx.id,
      nombaResponse: data,
    });
  } catch (error: any) {
    console.error("Withdraw API error:", error);
    return NextResponse.json(
      { error: "Server error: " + error.message || error.description },
      { status: 500 }
    );
  }
}
