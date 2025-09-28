import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Fetch only wallet_balance
    const { data, error } = await supabase
      .from("users")
      .select("wallet_id, bank_name, bank_account_name, bank_account_number ")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
        wallet_id: data.wallet_id,
        bank_name: data.bank_name,
        bank_account_name: data.bank_account_name ,
        bank_account_number: data.bank_account_number 
    });
  } catch (err: any) {
    console.error("❌ Unexpected error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
