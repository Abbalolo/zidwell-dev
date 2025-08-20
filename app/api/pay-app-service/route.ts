// app/api/deductFunds/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, amount, description } = await req.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 1. Fetch current balance
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }
    // 1. Check if user exists
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Check balance separately
    if (user.wallet_balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 3. Deduct funds using RPC
    const { data: newBalance, error: deductError } = await supabase.rpc(
      "decrement_wallet_balance",
      { user_id: userId, amt: amount }
    );

    if (deductError) {
      return NextResponse.json({ error: deductError.message }, { status: 400 });
    }

    // 4. Record transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      amount,
      type: "debit",
      status: "success",
      reference: crypto.randomUUID(),
      description: description || "Service charge",
    });

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Funds deducted and transaction recorded",
      newBalance,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
