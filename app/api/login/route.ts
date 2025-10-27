
import { NextResponse } from "next/server";
import supabase from "@/app/supabase/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1️⃣ Sign in the user
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData?.session) {
      return NextResponse.json(
        { error: authError?.message || "Invalid email or password" },
        { status: 401 }
      );
    }


    const { access_token, refresh_token, expires_in } = authData.session;
    const userId = authData.user.id;

    // 2️⃣ Set HTTP-only cookies
    const cookieStore = await cookies();
    cookieStore.set("sb-access-token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: expires_in,
    });

    cookieStore.set("sb-refresh-token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    // 3️⃣ Try to get profile from `users` table
    const { data: userProfile } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, phone, wallet_balance, zidcoin_balance, referral_code, bvn_verification, role, city, state, address, date_of_birth, profile_picture, current_login_session"
      )
      .eq("id", userId)
      .maybeSingle();

    let profile: any = null;
    let isPending = false;

    // 4️⃣ If not found, try from `pending_users`
    if (!userProfile) {
      const { data: pendingProfile } = await supabase
        .from("pending_users")
        .select(
          "id, auth_id, first_name, last_name, email, phone, bvn_verification, referred_by, verified, created_at"
        )
        .eq("auth_id", userId)
        .maybeSingle();

      if (!pendingProfile) {
        return NextResponse.json(
          { error: "Account not found. Please sign up first." },
          { status: 404 }
        );
      }

      isPending = true;

      profile = {
        id: pendingProfile.id,
        firstName: pendingProfile.first_name,
        lastName: pendingProfile.last_name,
        email: pendingProfile.email,
        phone: pendingProfile.phone,
        walletBalance: 0,
        zidcoinBalance: 0,
        bvnVerification: pendingProfile.bvn_verification ?? "pending",
        role: "pending",
        referralCode: null,
        state: null,
        city: null,
        address: null,
        dateOfBirth: null,
        referredBy: pendingProfile.referred_by ?? null,
        verified: pendingProfile.verified ?? false,
        createdAt: pendingProfile.created_at ?? null,
      };

      
    } else {
      profile = {
        id: userProfile.id,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        email: userProfile.email,
        phone: userProfile.phone,
        currentLoginSession: userProfile.current_login_session,
        // walletBalance: userProfile.wallet_balance,
        zidcoinBalance: userProfile.zidcoin_balance,
        bvnVerification: userProfile.bvn_verification,
        role: userProfile.role,
        referralCode: userProfile.referral_code,
        state: userProfile.state,
        city: userProfile.city,
        address: userProfile.address,
        dateOfBirth: userProfile.date_of_birth,
        profilePicture: userProfile.profile_picture,
      };
    }

    // ✅ Return final response
    return NextResponse.json({
      profile,
      isVerified: profile.bvnVerification === "verified",
      isPending,
    });
  } catch (err: any) {
    console.error("Login API Error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
