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
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Fetch only wallet_balance
    const { data, error } = await supabase
      .from("businesses")
      .select(
        "business_name, business_category, registration_number, tax_id, business_address, business_description, bank_name, bank_account_number, bank_account_name, bank_code"
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      data,
      bank_code: data.bank_code,
      bank_name: data.bank_name,
      bank_account_name: data.bank_account_name,
      bank_account_number: data.bank_account_number,
    });
  } catch (err: any) {
    console.error("❌ Unexpected error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
