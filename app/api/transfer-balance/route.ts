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
      senderAccountNumber,
      senderBankName,
      amount,
      accountNumber,
      accountName,
      bankName,
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

    // Calculate fees upfront
    const withdrawalAmount = Number(amount);
    let withdrawalAppFee = withdrawalAmount * 0.01; // 1% fee
    withdrawalAppFee = Math.max(withdrawalAppFee, 20); // ₦20 minimum
    withdrawalAppFee = Math.min(withdrawalAppFee, 1000); // ₦1000 maximum
    withdrawalAppFee = Number(withdrawalAppFee.toFixed(2));
    
    // Estimate Nomba fee (you might want to make this dynamic based on actual Nomba fees)
    const estimatedNombaFee = 10; // Example: ₦10 flat fee
    const totalFees = Number((estimatedNombaFee + withdrawalAppFee).toFixed(2));
    const totalDeduction = withdrawalAmount + totalFees;

    console.log("💰 Pre-check withdrawal calculations:");
    console.log("   - Withdrawal amount:", withdrawalAmount);
    console.log("   - Estimated Nomba fee:", estimatedNombaFee);
    console.log("   - Our app fee:", withdrawalAppFee);
    console.log("   - Total fees:", totalFees);
    console.log("   - Total deduction:", totalDeduction);

    // Check balance including fees
    if (user.wallet_balance < totalDeduction) {
      return NextResponse.json(
        { 
          message: "Insufficient wallet balance (including fees)",
          required: totalDeduction,
          current: user.wallet_balance,
          shortage: totalDeduction - user.wallet_balance
        },
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

    // Sender & Receiver details as objects
    const senderDetails = {
      name: senderName,
      accountNumber: senderAccountNumber,
      bankName: senderBankName,
    };

    const receiverDetails = {
      name: accountName,
      accountNumber: accountNumber,
      bankName: bankName, 
    };

    const merchantTxRef = `WD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert pending withdrawal transaction WITH fee information
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        sender: senderDetails,         
        receiver: receiverDetails,    
        amount: withdrawalAmount,
        total_deduction: totalDeduction, // Store the total amount to deduct
        fee: totalFees, // Store the total fees
        status: "pending", // CRITICAL: Keep as pending until webhook confirms
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

    // Send transfer to Nomba
    const res = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
      },
      body: JSON.stringify({
        amount: withdrawalAmount,
        accountNumber,
        accountName,
        bankCode,
        senderName,
        merchantTxRef,
        narration: narration || "Withdrawal",
      }),
    });

    const data = await res.json();
    console.log("Nomba transfer response:", data);

    // Check if Nomba API returned an error
    if (!res.ok || !data.success) {
      console.error("Nomba API error:", data);
      
      // Update transaction to failed immediately
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: data,
        })
        .eq("id", pendingTx.id);

      return NextResponse.json(
        { 
          error: "Withdrawal failed",
          message: data.message || "Failed to process withdrawal",
          details: data
        },
        { status: 400 }
      );
    }

    // Save Nomba response but KEEP STATUS AS PENDING
    // Wait for webhook to confirm success/failure
    await supabase
      .from("transactions")
      .update({
        external_response: data,
        reference: data?.data?.reference || null,
        // Don't update status here - wait for webhook
      })
      .eq("id", pendingTx.id);

    return NextResponse.json({
      message: "Withdrawal initiated successfully. Waiting for confirmation.",
      merchantTxRef,
      transactionId: pendingTx.id,
      status: "pending",
      note: "Your balance will be updated once the transaction is confirmed",
    });
  } catch (error: any) {
    console.error("Withdraw API error:", error);
    return NextResponse.json(
      { error: "Server error: " + error.message },
      { status: 500 }
    );
  }
}