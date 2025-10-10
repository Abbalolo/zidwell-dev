import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export const runtime = "nodejs"; // For Edge fix

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-nomba-signature");
    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ Missing NOMBA_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    // ✅ Verify webhook signature
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(rawBody);
    const digest = hmac.digest("hex");

    if (digest !== signature) {
      console.error("❌ Invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log("✅ Webhook Received:", event);

    // ✅ Only process successful payments
    if (
      !["payment.success", "transfer.success"].includes(event?.eventType) ||
      !event?.data?.orderReference
    ) {
      return NextResponse.json({ message: "Ignored webhook" }, { status: 200 });
    }

    const {
      amount,
      currency,
      fee,
      orderReference,
      userId,
      paymentMethod,
    } = event.data;

    if (!userId) {
      console.error("❌ Missing userId in webhook payload");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ✅ Prevent duplicate processing
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference", orderReference)
      .single();

    if (existingTx) {
      console.log("⚠️ Duplicate webhook ignored:", orderReference);
      return NextResponse.json({ message: "Duplicate ignored" }, { status: 200 });
    }

    // ✅ Start safe wallet update transaction
    const netAmount =
      paymentMethod === "bank_transfer" ? amount - fee : amount;

    const { data: user } = await supabase.from("users").select("wallet_balance").eq("id", userId).single();

    if (!user) throw new Error("User not found");

    const newBalance = Number(user.wallet_balance) + Number(netAmount);

    // ✅ Insert pending transaction FIRST
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: netAmount,
        status: "success",
        type: "credit",
        reference: orderReference,
        description: `Wallet funding via ${paymentMethod}`,
      })
      .select()
      .single();

    if (txError) {
      console.error("❌ Transaction insert failed:", txError);
      throw txError;
    }

    // ✅ Update wallet balance
    const { error: walletError } = await supabase
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("id", userId);

    if (walletError) {
      // ❗Rollback transaction if wallet credit failed
      await supabase.from("transactions").delete().eq("id", tx.id);
      throw walletError;
    }

    return NextResponse.json({ message: "Wallet funded" }, { status: 200 });

  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Webhook OK ✅" });
}
