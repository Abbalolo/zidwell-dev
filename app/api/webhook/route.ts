import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("Nomba webhook payload:", payload);

    // ✅ Only handle successful payments
    if (payload.event_type !== "payment_success") {
      return NextResponse.json({ message: "Ignored event type" }, { status: 200 });
    }

    const {
      order: { orderReference },
      transaction: { transactionAmount, type: paymentType, transactionId },
      merchant: { userId: issuerId },
    } = payload.data;

    console.log("OrderReference:", orderReference);
    console.log("Transaction amount:", transactionAmount);
    console.log("Transaction ID:", transactionId);

    // 1️⃣ Find the invoice using orderReference
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("invoice_id", orderReference)
      .single();

    if (invError || !invoice) {
      console.error("Invoice not found:", invError);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2️⃣ Only update if not already paid
    if (invoice.status !== "paid") {
      // 2a️⃣ Credit issuer wallet
      const { error: walletError } = await supabase.rpc("increment_wallet_balance", {
        user_id: issuerId,
        amt: transactionAmount,
      });
      if (walletError) throw walletError;

      // 2b️⃣ Update invoice with payment info
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          transaction_id: transactionId,
          payment_method: paymentType,
        })
        .eq("invoice_id", orderReference);

      if (updateError) throw updateError;

      console.log(`Invoice ${orderReference} marked as paid.`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Nomba webhook error:", error.message);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
