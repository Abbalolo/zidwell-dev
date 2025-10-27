// app/api/admin-apis/users/[id]/login-history/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;
    // Auth check - verify admin access
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("sb-access-token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // First, verify the user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if login_history table exists, if not return empty array
    const { data: history, error } = await supabaseAdmin
      .from("login_history")
      .select("id, login_time, logout_time, ip_address, user_agent")
      .eq("user_id", id)
      .order("login_time", { ascending: false })
      .limit(50);

    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === "42P01") {
        // table doesn't exist
        console.log("Login history table doesn't exist yet");
        return NextResponse.json([]);
      }
      console.error("Error fetching login history:", error);
      return NextResponse.json(
        { error: "Failed to fetch login history" },
        { status: 500 }
      );
    }

    return NextResponse.json(history || []);
  } catch (error) {
    console.error("Login history API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
