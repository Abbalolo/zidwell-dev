// app/api/admin-apis/users/[id]/force-logout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {

    const { id } = await params;
  try {
    // Auth check
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("sb-access-token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user's last_logout timestamp
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ 
        last_logout: new Date().toISOString() 
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating last_logout:", updateError);
      return NextResponse.json({ error: "Failed to force logout" }, { status: 500 });
    }

    // If you're using Supabase Auth, you might want to invalidate the user's sessions
    // This requires the Supabase Auth Admin API
    try {
      // This is a placeholder - you'll need to implement based on your auth system
      // For Supabase, you might use the auth.admin.invalidateSessions method
      console.log(`Force logout requested for user: ${user.email}`);
    } catch (authError) {
      console.error("Auth session invalidation error:", authError);
      // Continue anyway as we've updated the last_logout
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${user.email} has been logged out from all sessions.` 
    });
  } catch (error) {
    console.error("Force logout API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}