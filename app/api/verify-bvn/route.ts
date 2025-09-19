// app/api/verify-bvn/route.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { authId, bvn } = await req.json();
    if (!bvn || !authId) {
      return new Response(
        JSON.stringify({ message: "Missing BVN or authId" }),
        { status: 400 }
      );
    }

    // 👉 Replace with real BVN API logic
    const isValid = /^\d{11}$/.test(bvn);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: "Invalid BVN" }),
        { status: 400 }
      );
    }

    // ✅ Update pending_users
    const { data, error: updateError } = await supabase
      .from("pending_users")
      .update({
        bvn_verification: "verified",
        verified: true,
      })
      .eq("auth_id", authId)
      .select("id, first_name, last_name, email");


    if (updateError) {
      return new Response(
        JSON.stringify({ message: "Failed to update BVN status" }),
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ message: "No matching pending user found" }),
        { status: 404 }
      );
    }

    // 🎉 Success response with user info
    return new Response(
      JSON.stringify({
        success: true,
        message: "BVN successfully verified. You can now proceed.",
        user: data[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Unexpected server error:", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
