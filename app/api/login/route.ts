import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1️⃣ Sign in the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: "User does not exist or invalid credentials" },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // 2️⃣ Fetch BVN status from both tables in parallel
    const [pendingUserRes, userRes] = await Promise.all([
      supabase
        .from("pending_user")
        .select("bvn_verification")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("users")
        .select("bvn_verification")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const pendingBVN = pendingUserRes.data?.bvn_verification;
    const userBVN = userRes.data?.bvn_verification;

    const isVerified = pendingBVN === "verified" || userBVN === "verified";
    const bvnStatus = isVerified ? "verified" : "pending";

    // 3️⃣ Set cookie
    const res = NextResponse.json({
      user: authData.user,
      session: authData.session,
      bvn_status: bvnStatus,
    });

    res.cookies.set({
      name: "can_use_letter",
      value: bvnStatus,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 
    });

    return res;
  } catch (err: any) {
    console.error("❌ Login API Error:", err);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again later." },
      { status: 500 }
    );
  }
}
