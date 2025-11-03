// app/api/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: any }> }
) {
  
  try {
    const subscriptionId = (await params).id;


    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error: any) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}