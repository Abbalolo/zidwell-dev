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

    // 👉 Simulated BVN validation logic
    const isValid = /^\d{11}$/.test(bvn);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: "Invalid BVN" }),
        { status: 400 }
      );
    }

    // ✅ Update pending_users as verified
    const { data, error: updateError } = await supabase
      .from("pending_users")
      .update({
        bvn_verification: "verified",
        verified: true,
      })
      .eq("id", authId)
      .select("id, first_name, last_name, email");

    // ❗ If update fails, revert back to pending
    if (updateError) {
      await supabase
        .from("pending_users")
        .update({
          bvn_verification: "pending",
          verified: false,
        })
        .eq("id", authId);

      return new Response(
        JSON.stringify({ message: "Failed to update BVN status" }),
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      // Revert since user not found
      await supabase
        .from("pending_users")
        .update({
          bvn_verification: "pending",
          verified: false,
        })
        .eq("id", authId);
console.log("No matching pending user found for authId:", authId);
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

    try {
      const { authId } = await req.json(); 
      if (authId) {
        await supabase
          .from("pending_users")
          .update({
            bvn_verification: "pending",
            verified: false,
          })
          .eq("id", authId);
      }
    } catch (rollbackErr) {
      console.error("⚠️ Failed to rollback BVN status:", rollbackErr);
    }

    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
