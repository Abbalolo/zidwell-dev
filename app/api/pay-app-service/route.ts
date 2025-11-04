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

    // ✅ FIX: RPC returns an ARRAY, extract the first item
    const result = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : rpcData;
    console.log("🔍 RPC Result:", result);

    if (!result || result.status !== "OK") {
      return NextResponse.json(
        { error: result?.status || "Deduction failed" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "success"
        // removed updated_at since column doesn't exist
      })
      .eq("id", result.tx_id);

    if (updateError) {
      console.error("❌ Failed to update transaction status:", updateError.message);

    } else {
      console.log("✅ Transaction status updated to success");
    }

    // ✅ FIX: Remove updated_at from users table update too
    const { error: balanceUpdateError } = await supabase
      .from("users")
      .update({
        wallet_balance: result.new_balance
      })
      .eq("id", userId);

    if (balanceUpdateError) {
      console.error("❌ Failed to update user wallet balance:", balanceUpdateError.message);
      // Log but don't fail the request
    } else {
      console.log("✅ User balance updated to:");
    }

    return NextResponse.json({
      success: true,
      message: "Funds deducted successfully",
      reference,
      transactionId: result.tx_id,
      newWalletBalance: result.new_balance,
      status: "success"
    });
  } catch (err: any) {
    console.error("❌ Deduct Funds Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}