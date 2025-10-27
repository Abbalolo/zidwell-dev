// app/api/track-login/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { user_id, email } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown";
    const userAgent = req.headers.get("user-agent") || "Unknown";

    if (!user_id || !email) {
      return NextResponse.json({ error: "user_id and email are required" }, { status: 400 });
    }

    // 1️⃣ Log it to the audit table
    const { error: activityError } = await supabase
      .from("user_activity_logs")
      .insert({
        user_id,
        email,
        action: "login",
        ip_address: ip,
        user_agent: userAgent,
      });

    if (activityError) {
      console.error("Error logging user activity:", activityError);
    }

    // 2️⃣ Create login history entry
    const { data: loginHistory, error: historyError } = await supabase
      .from("login_history")
      .insert({
        user_id,
        ip_address: ip,
        user_agent: userAgent,
        login_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (historyError) {
      console.error("Error creating login history:", historyError);
    }

    // 3️⃣ Update last_login on users table
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ 
        last_login: new Date().toISOString(),
        // Store the login_history ID for tracking logout
        current_login_session: loginHistory?.id 
      })
      .eq("id", user_id);

    if (userUpdateError) {
      console.error("Error updating user last_login:", userUpdateError);
    }

    return NextResponse.json({ 
      message: "Login recorded",
      login_history_id: loginHistory?.id 
    });
  } catch (error) {
    console.error("Login tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}