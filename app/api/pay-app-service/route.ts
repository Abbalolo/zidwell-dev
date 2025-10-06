// app/api/deductFunds/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);



export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { userId, amount, description, pin } = body;

    amount = Number(amount); 

    // console.log(userId, amount, pin)
    if (!userId || !amount || amount <= 0 || !pin) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

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
      return NextResponse.json({ message: "Invalid transaction PIN" }, { status: 401 });
    }

    const currentBalance = Number(user.wallet_balance ?? 0);
    if (currentBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    let newWalletBalance: number | null = null;
    let deductError;

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "decrement_wallet_balance",
      { user_id: userId, amt: amount }
    );

    if (rpcError) {
      console.error("⚠️ RPC failed, falling back to manual update:", rpcError.message);

      // fallback method
      const updatedBalance = currentBalance - amount;
      const { error: updateError } = await supabase
        .from("users")
        .update({ wallet_balance: updatedBalance })
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to deduct balance" },
          { status: 500 }
        );
      }

      newWalletBalance = updatedBalance;
      deductError = updateError;
    } else {

      newWalletBalance =
        Array.isArray(rpcData) && rpcData.length > 0
          ? rpcData[0].wallet_balance || rpcData[0].balance
          : currentBalance - amount;
    }

    // ✅ 5. Record transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      amount,
      type: "debit",
      status: "success",
      reference: crypto.randomUUID(),
      description: description || "Funds deducted",
    });

    if (txError) {
      // ⚠️ Attempt rollback (optional)
      await supabase
        .from("users")
        .update({ wallet_balance: currentBalance })
        .eq("id", userId);

      return NextResponse.json(
        { error: "Transaction logging failed. Deduction rolled back." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Funds deducted and transaction recorded",
      newWalletBalance,
    });
  } catch (err: any) {
    console.error("❌ Deduct Funds Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
