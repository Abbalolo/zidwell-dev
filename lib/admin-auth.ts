// lib/admin-auth-utils.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify if the current user is an admin
 */
export async function verifyAdmin(authToken: string) {
  try {
    if (!authToken) {
      return { 
        isAdmin: false, 
        error: "No authentication token provided" 
      };
    }

    // Get user from Supabase
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken);

    if (userError || !user) {
      return { 
        isAdmin: false, 
        error: "Invalid authentication token" 
      };
    }

    // Check if user has admin role
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { 
        isAdmin: false, 
        error: "Insufficient permissions" 
      };
    }

    return { 
      isAdmin: true, 
      user 
    };
  } catch (error) {
    console.error("Admin verification error:", error);
    return { 
      isAdmin: false, 
      error: "Authentication failed" 
    };
  }
}

/**
 * Check if request is from admin
 */
export async function requireAdmin(request: Request) {
  // Get token from Authorization header or cookies
  const authHeader = request.headers.get("authorization");
  let authToken = authHeader?.replace("Bearer ", "");
  
  // If no auth header, try cookies
  if (!authToken) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map(c => c.split("="))
      );
      authToken = cookies["sb-access-token"];
    }
  }
  
  const result = await verifyAdmin(authToken || "");
  
  if (!result.isAdmin) {
    return NextResponse.json(
      { error: result.error || "Unauthorized" },
      { status: 403 }
    );
  }
  
  return result.user;
}