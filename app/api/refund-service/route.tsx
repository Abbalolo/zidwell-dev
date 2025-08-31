import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { userId, amount, description } = await req.json();

    if (!userId || !amount) {
      return NextResponse.json(
        { error: "Missing userId or amount" },
        { status: 400 }
      );
    }

    // ✅ Fetch user wallet
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const newBalance = (user.wallet_balance || 0) + amount;

    // ✅ Update wallet balance
    const { error: updateError } = await supabase
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update wallet" },
        { status: 500 }
      );
    }

    // ✅ Log transaction in "transactions" table
    await supabase.from("transactions").insert([
      {
        user_id: userId,
        type: "refund",
        amount,
        description: description || "Refund issued",
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      message: "Refund successful",
      walletBalance: newBalance,
    });
  } catch (error: any) {
    console.error("Refund error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
