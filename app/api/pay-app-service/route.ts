import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { userId, amount, description, pin } = body;

    amount = Number(amount);

    if (!userId || !amount || amount <= 0 || !pin) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // ✅ Fetch user and verify PIN
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: fetchError?.message || "User not found" },
        { status: 404 }
      );
    }

    if (!user.transaction_pin) {
      return NextResponse.json(
        { error: "Transaction PIN not set" },
        { status: 400 }
      );
    }

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid transaction PIN" }, { status: 401 });
    }

    // ✅ Call RPC `deduct_wallet_balance`
    const reference = crypto.randomUUID();
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: amount,
        transaction_type: "debit",
        reference,
        description: description || "Funds deducted",
      }
    );

    if (rpcError) {
      console.error("❌ RPC deduct_wallet_balance failed:", rpcError.message);
      return NextResponse.json(
        { error: "Failed to deduct wallet balance via RPC" },
        { status: 500 }
      );
    }

    // RPC returns tx_id, new_balance, status
    const result =
      Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : rpcData;

    if (!result || result.status !== "OK") {
      return NextResponse.json(
        { error: result?.status || "Deduction failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Funds deducted successfully",
      reference,
      transactionId: result.tx_id,
      newWalletBalance: result.balance || result.new_balance,
    });
  } catch (err: any) {
    console.error("❌ Deduct Funds Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
