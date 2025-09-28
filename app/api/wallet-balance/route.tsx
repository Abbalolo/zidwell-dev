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

    // Fetch wallet_balance for the specific user
    const { data, error } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .maybeSingle(); // safer: won't throw error if user not found

    if (error) {
      console.error("❌ Supabase query error:", error.message);
      return NextResponse.json({ error: "Database query failed" }, { status: 500 });
    }

    if (!data) {
      console.warn(`⚠️ No user found with ID: ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ wallet_balance: data.wallet_balance });
  } catch (err: any) {
    console.error("❌ Unexpected error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
