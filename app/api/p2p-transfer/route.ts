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

    // Validate input
    if (!userId || !receiverAccountId || !rawAmount || !pin) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const amount = Number(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: "Invalid transfer amount" }, { status: 400 });
    }

    // Fetch sender details
    const { data: sender, error: senderError } = await supabase
      .from("users")
      .select("id, first_name, last_name, wallet_balance, transaction_pin, wallet_id")
      .eq("id", userId)
      .single();

    if (senderError || !sender)
      return NextResponse.json({ message: "Sender not found" }, { status: 404 });

    // Prevent self-transfer
    if (sender.wallet_id && sender.wallet_id === receiverAccountId)
      return NextResponse.json({ message: "You cannot transfer to your own wallet" }, { status: 400 });

    // Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValidPin = await bcrypt.compare(plainPin, sender.transaction_pin);
    if (!isValidPin)
      return NextResponse.json({ message: "Invalid transaction PIN" }, { status: 401 });

    // Check receiver
    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("wallet_id", receiverAccountId)
      .single();

    if (receiverError || !receiver)
      return NextResponse.json({ message: "Receiver not found" }, { status: 404 });

    const reference = `P2P_${Date.now()}`;
    const description = `P2P transfer to ${receiver.first_name || ""} ${receiver.last_name || ""}`;

    // ✅ 1. Use RPC to deduct balance and create sender transaction
    const { data: rpcData, error: rpcError } = await supabase.rpc("deduct_wallet_balance", {
      user_id: userId,
      amt: amount,
      transaction_type: "p2p_transfer",
      reference,
      description,
    });

    if (rpcError) {
      console.error("RPC Error (deduct_wallet_balance):", rpcError);
      return NextResponse.json({ message: "Failed to deduct wallet", detail: rpcError }, { status: 500 });
    }

    const [rpcResult] = rpcData || [];
    if (!rpcResult || rpcResult.status !== "OK") {
      return NextResponse.json(
        { message: rpcResult?.status || "Debit failed", balance: rpcResult?.current_balance },
        { status: 400 }
      );
    }

    // ✅ 2. Credit receiver
    const { error: creditError } = await supabase.rpc("increment_wallet_balance", {
      user_id: receiver.id,
      amt: amount,
    });

    if (creditError) {
      console.error("Receiver credit failed:", creditError);
      // Refund sender if credit fails
      await supabase.rpc("increment_wallet_balance", { user_id: userId, amt: amount });
      return NextResponse.json(
        { message: "Receiver credit failed. Sender refunded." },
        { status: 500 }
      );
    }

    // ✅ 3. Record receiver transaction
    await supabase.from("transactions").insert({
      user_id: receiver.id,
      type: "p2p_received",
      amount,
      status: "success",
      description: `Received ₦${amount} from ${sender.first_name || ""} ${sender.last_name || ""}`,
      narration: narration || "P2P Received",
      reference,
    });

    return NextResponse.json({
      status: "success",
      message: "Transfer completed successfully",
      reference,
      sender_tx_id: rpcResult.tx_id,
    });
  } catch (err: any) {
    console.error("Transfer Error:", err);
    return NextResponse.json({ message: err.message || "Unexpected server error" }, { status: 500 });
  }
}
