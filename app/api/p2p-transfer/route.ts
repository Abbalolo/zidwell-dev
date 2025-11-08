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
      receiverAccountId, 
      amount,
      narration,
      pin,
    } = await req.json();
    
    if (
      !userId ||
      !pin ||
      !amount ||
      amount < 100 ||
      !receiverAccountId
    ) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // ✅ Verify user + PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, first_name, last_name, transaction_pin, wallet_balance, wallet_id")
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

    // ✅ Check balance
    if (user.wallet_balance < amount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // ✅ Get receiver details (optional - for transaction record)
    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select("id, first_name, last_name, wallet_id")
      .eq("wallet_id", receiverAccountId) 
      .single();

    const receiverName = receiver ? `${receiver.first_name} ${receiver.last_name}` : "Unknown User";
    const receiverWalletId = receiver?.wallet_id || receiverAccountId;

    // ✅ Prevent self-transfer
    if (user.wallet_id === receiverAccountId) {
      return NextResponse.json({ message: "You cannot transfer to your own wallet" }, { status: 400 });
    }

    // ✅ Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Nomba token missing" },
        { status: 401 }
      );
    }

    const merchantTxRef = `P2P_${Date.now()}`;
    const senderName = `${user.first_name} ${user.last_name}`;

    // ✅ Insert pending transaction
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "p2p_transfer",
        sender: {
          name: senderName,
          wallet_id: user.wallet_id,
        },
        receiver: {
          name: receiverName,
          wallet_id: receiverWalletId,
        },
        amount,
        fee: 0, // No fee for P2P transfers
        total_deduction: amount,
        status: "pending",
        narration: narration || "P2P Transfer",
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
      amt: amount,
      transaction_type: "p2p_transfer",
      reference: merchantTxRef,
      description: `P2P transfer of ₦${amount} to ${receiverName}`,
    });

    if (rpcError) {
      return NextResponse.json({ error: "Failed to deduct wallet balance" }, { status: 500 });
    }

    const res = await fetch(`${process.env.NOMBA_URL}/v1/transfers/wallet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
      },
      body: JSON.stringify({
        amount,
        receiverAccountId: receiverWalletId,
        merchantTxRef,
        narration: narration || "P2P Transfer",
        senderName: senderName,
      }),
    });



    const data = await res.json();

    // ✅ Handle failure immediately (same logic as withdrawal)
    if (data.code !== "00") {
      console.log("❌ Nomba P2P transfer failed:", data.description);

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
        amt: -amount, 
        transaction_type: "credit",
        reference: refundReference,
        description: `Refund for failed P2P transfer of ₦${amount}`,
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
          message: "P2P transfer failed, funds refunded successfully.",
          reason: data.description || "Transfer not successful",
          refunded: true,
        },
        { status: 400 }
      );
    }

    // ✅ If Nomba API success, update transaction to processing (webhook will handle final status)
    await supabase
      .from("transactions")
      .update({
        status: "processing",
        reference: data?.data?.id || null,
        external_response: data,
      })
      .eq("id", pendingTx.id);

    return NextResponse.json({
      message: "P2P transfer initiated successfully.",
      transactionId: pendingTx.id,
      merchantTxRef,
      nombaResponse: data,
    });
  } catch (error: any) {
    console.error("P2P API error:", error);
    return NextResponse.json(
      { error: "Server error: " + (error.message || error.description) },
      { status: 500 }
    );
  }
}