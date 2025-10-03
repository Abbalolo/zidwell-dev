import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

// 🔐 Middleware-style admin check
export async function requireAdmin() {
  try {
    const supabase = createServerComponentClient<any>({ cookies })

    // 🔑 1. Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError.message)
      return { ok: false, status: 401, error: "Authentication failed" }
    }

    if (!user) {
      return { ok: false, status: 401, error: "Not authenticated" }
    }

    // 🔎 2. Check user role from `users` table
    const { data, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError) {
      console.error("Role check error:", roleError.message)
      return { ok: false, status: 500, error: "Failed to fetch user role" }
    }

    if (!data || data.role !== "admin") {
      return { ok: false, status: 403, error: "Access denied: Admins only" }
    }

    // ✅ All good
    return { ok: true, user }
  } catch (error: any) {
    console.error("Unexpected error:", error.message)
    return { ok: false, status: 500, error: "Internal server error" }
  }
}
