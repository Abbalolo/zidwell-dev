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
    // ✅ Move token retrieval inside handler
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Nomba token missing" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, fullName, planId, amount } = body;

    if (!email || !planId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

        const orderReference = `Subscription-plan-${planId}-${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}`


    const localPaymentId = uuidv4();
    const anonToken = uuidv4().replace(/-/g, "");

    // ✅ Create pending payment in DB
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
          email,
          fullName,
        },
      },
    ]);

    const callbackUrl = `${baseUrl}?ref=${orderReference}`;

    const nombaPayload = {
      order: {
        orderReference,
        callbackUrl,
        customerEmail: email,
        amount: numericAmount,
        currency: "NGN",
        accountId: process.env.NOMBA_ACCOUNT_ID,
        metadata: {
          planId,
          localPaymentId,
          fullName,
        },
      },
      paymentMethod: {
        channels: ["card"],
      },
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
      return NextResponse.json(
        { error: "Failed to create checkout", detail: data },
        { status: 502 }
      );
    }

    const checkoutUrl =
      data?.data?.checkoutLink ||
      data?.data?.checkoutUrl ||
      data?.data?.checkout_url ||
      null;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      orderReference,
      localPaymentId,
      anonToken,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
