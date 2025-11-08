import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { accNumber } = await req.json();

    if (!accNumber) {
      return NextResponse.json({ error: "Account Number is required" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, wallet_id")
      .eq("bank_account_number", accNumber)
      .single();

      console.log(user, error);

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      receiverId: user.id,
      receiverName: `${user.first_name} ${user.last_name}`,
      walletId: user.wallet_id,
    });
  } catch (err: any) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// (Optional) Block GET requests
export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
