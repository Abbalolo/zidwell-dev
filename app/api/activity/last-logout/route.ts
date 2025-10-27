// app/api/track-logout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to track logout
async function trackUserLogout(userId: string, loginHistoryId?: string) {
  const logoutTime = new Date().toISOString();
  
  // If we have a specific login history ID, update that record
  if (loginHistoryId) {
    const { error } = await supabase
      .from("login_history")
      .update({ logout_time: logoutTime })
      .eq("id", loginHistoryId);

    if (error) {
      console.error("Error updating login_history:", error);
      return { error };
    }
  } else {
    // Otherwise, find the most recent login without logout time and update it
    const { data: recentLogin, error: findError } = await supabase
      .from("login_history")
      .select("id")
      .eq("user_id", userId)
      .is("logout_time", null)
      .order("login_time", { ascending: false })
      .limit(1)
      .single();

    if (!findError && recentLogin) {
      const { error } = await supabase
        .from("login_history")
        .update({ logout_time: logoutTime })
        .eq("id", recentLogin.id);

      if (error) {
        console.error("Error updating recent login history:", error);
      }
    }
  }

  // Update user's last_logout timestamp and clear current session
  const { error: userUpdateError } = await supabase
    .from("users")
    .update({ 
      last_logout: logoutTime,
      current_login_session: null 
    })
    .eq("id", userId);

  if (userUpdateError) {
    console.error("Error updating user last_logout:", userUpdateError);
    return { error: userUpdateError };
  }

  return { error: null };
}

export async function POST(req: Request) {
  try {
    const { user_id, email, login_history_id } = await req.json();
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
        action: "logout",
        ip_address: ip,
        user_agent: userAgent,
      });

    if (activityError) {
      console.error("Error logging user activity:", activityError);
    }

    // 2️⃣ Track logout in login_history
    const { error: logoutError } = await trackUserLogout(user_id, login_history_id);

    if (logoutError) {
      console.error("Error tracking logout:", logoutError);
    }

    return NextResponse.json({ message: "Logout recorded" });
  } catch (error) {
    console.error("Logout tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}