import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, first_name, last_name, phone, referred_by } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1️⃣ Insert or update pending user
    const { data, error } = await supabase
      .from("pending_users")
      .upsert(
        {
          auth_id: id,
          email: email.toLowerCase(),
          first_name,
          last_name,
          phone,
          referred_by: referred_by || "",
          verified: false,
          bvn_verification: "pending",
          created_at: new Date().toISOString(),
        },
        { onConflict: "auth_id" }
      )
      .select();

    if (error) {
      console.error("❌ Supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Failed to retrieve saved pending user" },
        { status: 500 }
      );
    }

    // ✅ Success
    return NextResponse.json(
      {
        success: true,
        message: "Pending user saved. Awaiting BVN verification.",
        user: data[0],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err.message);
    return NextResponse.json(
      { error: "Failed to save pending user" },
      { status: 500 }
    );
  }
}
