// app/api/save-user/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, first_name, last_name, phone } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("users").upsert(
      {
        id,
        email: email.toLowerCase(),
        first_name,
        last_name,
        phone,
        wallet_balance: 0,
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" } 
    );

    if (error) {
      console.error("❌ Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Unexpected Error:", error.message);
    return NextResponse.json(
      { error: "Failed to save user to Supabase" },
      { status: 500 }
    );
  }
}
