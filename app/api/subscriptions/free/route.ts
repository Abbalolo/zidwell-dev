// app/api/subscriptions/free/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, planName } = await req.json();

    if (!userId || !planName) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year for free plan

    // Create free subscription
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .insert([
        {
          user_id: userId,
          plan_id: "pay-per-use",
          plan_name: planName,
          amount: 0,
          status: "active",
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: false,
          features: [],
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update user's subscription tier
    await supabase
      .from("users")
      .update({
        subscription_tier: "pay_per_use",
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      message: "Free plan activated successfully",
      subscription
    });
  } catch (error: any) {
    console.error("Free subscription error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}