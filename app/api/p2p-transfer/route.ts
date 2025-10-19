import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json();
    const { userId, receiverAccountId, amount: rawAmount, narration, pin } = body;

    // Basic validation
    if (!userId || !receiverAccountId || !rawAmount || !pin) {
      return NextResponse.json(
        { message: "Missing required fields", required: ["userId", "receiverAccountId", "amount", "pin"] },
        { status: 400 }
      );
    }

    const amount = Number(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: "Invalid transfer amount" }, { status: 400 });
    }

    // Fetch sender (include wallet_id for self-transfer check)
    const { data: sender, error: senderError } = await supabase
      .from("users")
      .select("id, first_name, last_name, wallet_balance, transaction_pin, wallet_id")
      .eq("id", userId)
      .single();

    if (senderError || !sender) {
      return NextResponse.json({ message: "Sender not found" }, { status: 404 });
    }

    // Prevent sending to yourself (compare wallet_id)
    if (sender.wallet_id && sender.wallet_id === receiverAccountId) {
      return NextResponse.json({ message: "You cannot transfer to your own account" }, { status: 400 });
    }

    // Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValidPin = await bcrypt.compare(plainPin, sender.transaction_pin);
    if (!isValidPin) {
      return NextResponse.json({ message: "Invalid transaction PIN" }, { status: 401 });
    }

    // Ensure sufficient balance (no fee)
    if (Number(sender.wallet_balance) < amount) {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    // Fetch receiver by wallet_id
    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select("id, first_name, last_name, wallet_balance")
      .eq("wallet_id", receiverAccountId)
      .single();

    if (receiverError || !receiver) {
      return NextResponse.json({ message: "Receiver not found" }, { status: 404 });
    }

    // Create pending sender transaction
    const merchantTxRef = `P2P_${Date.now()}`;
    const { data: pendingSenderTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "p2p_transfer",
        amount,
        fee: 0,
        total_deduction: amount,
        status: "processing",
        narration: narration || "P2P Wallet Transfer",
        description: `P2P transfer to ${receiver.first_name || ""} ${receiver.last_name || ""}`,
        merchant_tx_ref: merchantTxRef,
      })
      .select("id")
      .single();

    if (txError || !pendingSenderTx) {
      console.error("Could not create sender transaction:", txError);
      return NextResponse.json({ message: "Could not create transaction record" }, { status: 500 });
    }

    // 1) Deduct from sender using your RPC (decrement_wallet_balance)
    const { error: decErr } = await supabase.rpc("decrement_wallet_balance", {
      user_id: userId,
      amt: amount,
    });

    if (decErr) {
      console.error("decrement_wallet_balance error:", decErr);
      // mark sender tx as failed
      await supabase.from("transactions").update({ status: "failed" }).eq("id", pendingSenderTx.id);
      return NextResponse.json({ message: "Failed to deduct sender wallet", detail: decErr }, { status: 500 });
    }

    // 2) Credit receiver using your RPC (increment_wallet_balance)
    const { error: incErr } = await supabase.rpc("increment_wallet_balance", {
      user_id: receiver.id,
      amt: amount,
    });

    if (incErr) {
      console.error("increment_wallet_balance error:", incErr);
      // Attempt to refund sender (best-effort)
      try {
        await supabase.rpc("increment_wallet_balance", { user_id: userId, amt: amount });
      } catch (refundErr) {
        console.error("Refund to sender failed:", refundErr);
        // mark sender tx as refund_pending
        await supabase.from("transactions").update({ status: "refund_pending" }).eq("id", pendingSenderTx.id);
        return NextResponse.json(
          { message: "Critical: credit failed and refund failed. Manual intervention required." },
          { status: 500 }
        );
      }

      // mark sender tx as failed_refunded
      await supabase.from("transactions").update({ status: "failed_refunded" }).eq("id", pendingSenderTx.id);
      return NextResponse.json({ message: "Credit to receiver failed. Sender refunded." }, { status: 500 });
    }

    // 3) Create receiver transaction record (p2p_received)
    const { error: receiverTxErr } = await supabase.from("transactions").insert({
      user_id: receiver.id,
      type: "p2p_received",
      amount,
      status: "success",
      description: `Received ₦${amount} from ${sender.first_name || ""} ${sender.last_name || ""}`,
      narration: narration || "P2P Received",
      merchant_tx_ref: merchantTxRef,
    });

    if (receiverTxErr) {
      console.error("Failed to create receiver transaction record:", receiverTxErr);
      // Not fatal — the balances are already updated; log and continue.
    }

    // 4) Update sender transaction to success
    await supabase
      .from("transactions")
      .update({ status: "success", reference: merchantTxRef })
      .eq("id", pendingSenderTx.id);

    return NextResponse.json({
      status: "success",
      message: "P2P transfer completed",
      amount,
      reference: merchantTxRef,
      senderTxId: pendingSenderTx.id,
    });
  } catch (err: any) {
    console.error("P2P Transfer Error:", err);
    return NextResponse.json({ error: err.message || "Unexpected server error" }, { status: 500 });
  }
}
