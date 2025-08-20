import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const secretHash = process.env.FLW_SECRET_WEBHOOK_KEY!;

    // ✅ Verify webhook signature
    if (req.headers.get("verif-hash") !== secretHash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { txRef, amount, status } = payload;
console.log(txRef)
    if (status === "successful") {
      // ✅ Case 1: Wallet Funding
      if (txRef.startsWith("fund-")) {
        const parts = txRef.split("-");
        const userId = parts.slice(1).join("-"); 

        const { error } = await supabase.rpc("increment_wallet_balance", {
          user_id: userId,
          amt: amount,
        });
        if (error) throw error;
      }

      // ✅ Case 2: Invoice Payment
      else if (txRef.startsWith("inv-")) {
        const invoiceId = txRef.replace("inv-", "");

        // 1. Find the invoice in Supabase
        const { data: invoice, error: invError } = await supabase
          .from("invoices")
          .select("issuerId, payment_status")
          .eq("id", invoiceId)
          .single();

        if (invError || !invoice) throw new Error("Invoice not found");

        if (invoice.payment_status !== "paid") {
          // 2. Credit issuer’s wallet
          const { error: walletError } = await supabase.rpc(
            "increment_wallet_balance",
            {
              user_id: invoice.issuerId,
              amt: amount,
            }
          );
          if (walletError) throw walletError;

          // 3. Mark invoice as paid
          const { error: updateError } = await supabase
            .from("invoices")
             .update({ payment_status: "paid", paid_at: new Date().toISOString() })
            .eq("id", invoiceId);

          if (updateError) throw updateError;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Webhook Error:", error.message);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
