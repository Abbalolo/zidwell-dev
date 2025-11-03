// app/api/create-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NOMBA_URL = process.env.NOMBA_URL!;

export async function POST(req: NextRequest) {
  try {
    // Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Nomba token missing" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { email, fullName, planId, amount, planName, userId, features } = body;

    if (!email || !planId || !amount || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Determine base URL
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    // ✅ Generate orderReference ≤ 50 chars
    const shortId = Math.random().toString(36).substring(2, 8); // 6 chars
    const timestamp = Date.now().toString().slice(-6); // last 6 digits
    const orderReference = `SUB-${planId}-${timestamp}-${shortId}`; // ~25 chars

    const localPaymentId = uuidv4();
    const anonToken = uuidv4().replace(/-/g, "");

    // Create subscription record first
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .insert([
        {
          user_id: userId,
          plan_id: planId,
          plan_name: planName,
          amount: numericAmount,
          status: "pending",
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
          features: features,
          merchant_reference: orderReference,
        },
      ])
      .select()
      .single();

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);
      return NextResponse.json(
        { error: "Failed to create subscription record" },
        { status: 500 }
      );
    }

    // Create pending payment in DB
    await supabase.from("payments").insert([
      {
        payment_reference: orderReference,
        provider: "nomba",
        amount: numericAmount,
        currency: "NGN",
        status: "pending",
        metadata: {
          localPaymentId,
          anonToken,
          planId,
          planName,
          email,
          fullName,
          subscriptionId: subscription.id,
          userId: userId,
          type: "subscription"
        },
      },
    ]);

    // Use webhook callback URL
    const callbackUrl = `${baseUrl}/api/webhook`;
    const redirectUrl = `${baseUrl}/dashboard/subscription/success?subscriptionId=${subscription.id}`;
    const cancelUrl = `${baseUrl}/dashboard/subscription/canceled`;

    const nombaPayload = {
      order: {
        orderReference,
        callbackUrl,
        customerEmail: email,
        customerName: fullName,
        amount: numericAmount * 100, // Convert to kobo
        currency: "NGN",
        accountId: process.env.NOMBA_ACCOUNT_ID,
        metadata: {
          type: "subscription",
          planId,
          planName,
          subscriptionId: subscription.id,
          userId: userId,
          localPaymentId,
        },
      },
      paymentMethod: {
        channels: ["card"],
      },
      redirectUrl,
      cancelUrl,
    };

    const nombaRes = await fetch(`${NOMBA_URL}/v1/checkout/order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nombaPayload),
    });

    const data = await nombaRes.json();
    console.log("Nomba checkout response:", data);

    if (!nombaRes.ok) {
      // Mark subscription as failed if payment initialization fails
      await supabase
        .from("user_subscriptions")
        .update({ status: "failed" })
        .eq("id", subscription.id);

      return NextResponse.json(
        { 
          error: "Failed to create checkout", 
          detail: data?.description || data?.message 
        },
        { status: 502 }
      );
    }

    const checkoutUrl =
      data?.data?.checkoutLink ||
      data?.data?.checkoutUrl ||
      data?.data?.checkout_url ||
      null;

    if (!checkoutUrl) {
      // Mark subscription as failed if no checkout URL
      await supabase
        .from("user_subscriptions")
        .update({ status: "failed" })
        .eq("id", subscription.id);

      return NextResponse.json(
        { error: "Nomba did not return a checkout URL", detail: data },
        { status: 502 }
      );
    }

    // Update subscription with payment reference
    await supabase
      .from("user_subscriptions")
      .update({ 
        payment_reference: data.data?.reference 
      })
      .eq("id", subscription.id);

    return NextResponse.json({
      success: true,
      checkoutUrl,
      orderReference,
      localPaymentId,
      anonToken,
      subscriptionId: subscription.id,
    });
  } catch (err: any) {
    console.error("Create checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}