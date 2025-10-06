import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("🔔 Nomba webhook payload:", payload);

    if (payload.event_type !== "payment_success") {
      return NextResponse.json({ message: "Ignored event" }, { status: 200 });
    }

    const data = payload.data;

    if (data.order?.orderReference) {
      // ✅ INVOICE PAYMENT FLOW
      const { orderReference } = data.order;
      const {
        transactionAmount,
        type: paymentType,
        transactionId,
      } = data.transaction;

      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_reference", orderReference)
        .single();

      if (invError || !invoice) {
        throw new Error("Invoice not found in database");
      }

      if (invoice.status !== "paid") {
        // 1. Mark invoice as paid
        const { error: updateError } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            transaction_id: transactionId,
            payment_method: paymentType,
          })
          .eq("order_reference", orderReference);

        if (updateError) throw new Error("Failed to update invoice status");

        // 2. Send confirmation + PDF
        const resp = await fetch(`${baseUrl}/api/sign-invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: invoice.invoice_id,
            sendPaymentConfirmation: true,
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`sign-invoice API failed: ${resp.status} ${errText}`);
        }

        // 3. Fee calculation (3.5%)
        const feeRate = 0.035;
        let creditedAmount = invoice.total_amount;
        let fee = 0;

        if (invoice.fee_option === "absorbed") {
          fee = Math.ceil(invoice.total_amount * feeRate);
          creditedAmount = invoice.total_amount - fee;
        } else if (invoice.fee_option === "customer") {
          fee = Math.ceil(invoice.total_amount * feeRate);
          // customer already paid fee → initiator still gets full total
        }

        // 4. Credit initiator’s wallet
        if (!invoice.user_id) {
          throw new Error("Invoice missing user_id, cannot credit wallet");
        }

        const { error: balanceError } = await supabase.rpc(
          "increment_wallet_balance",
          { user_id: invoice.user_id, amt: creditedAmount }
        );
        if (balanceError)
          throw new Error("Failed to credit initiator's wallet");

        // 5. Record transaction
        const { error: txError } = await supabase.from("transactions").insert({
          user_id: invoice.user_id,
          type: "invoice_payment",
          amount: creditedAmount,
          status: "success",
          description:
            invoice.fee_option === "absorbed"
              ? `Invoice payment ₦${invoice.total_amount} (₦${fee} fee deducted)`
              : `Invoice payment ₦${invoice.total_amount} (customer paid fee)`,
          reference: transactionId,
          merchant_tx_ref: `INV_PAY_${Date.now()}`,
        });
        if (txError) throw new Error("Failed to insert invoice transaction");

        console.log(
          `✅ Invoice paid. Initiator ${invoice.user_id} credited ₦${creditedAmount}`
        );
      }
    } else {
      // ✅ WALLET DEPOSIT FLOW
      console.log("data", data);

      const { transactionAmount, transactionId, fee, aliasAccountReference } =
        data.transaction;
      const userId = aliasAccountReference;
      console.log("User ID from merchant data:", userId);

      // 2️⃣ Net amount = amount - Nomba fee - App fee
      const nombaFee = fee || 0;
      const netAmount = parseFloat((transactionAmount - nombaFee).toFixed(2));

      console.log("Transaction amount (₦):", transactionAmount);
      console.log("Nomba fee (₦):", nombaFee);
      console.log("Net amount (₦):", netAmount);

      // 3️⃣ Verify user exists
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("id, wallet_balance")
        .eq("id", userId)
        .maybeSingle();

      if (userError) throw new Error("User lookup failed");
      if (!existingUser) throw new Error(`User with ID ${userId} not found.`);

      // 4️⃣ Update wallet balance directly (no RPC)
      const newBalance = parseFloat(existingUser.wallet_balance) + netAmount;

      const { error: updateError } = await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", existingUser.id);

      if (updateError) throw new Error("Failed to update wallet balance");

      // 5️⃣ Record transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: existingUser.id,
        type: "deposit",
        amount: netAmount,
        status: "success",
        description: `Wallet deposit of ₦${transactionAmount}`,
        reference: transactionId,
        merchant_tx_ref: `DEP_${Date.now()}`,
      });

      if (txError) throw new Error("Failed to insert deposit transaction");

      console.log(
        `✅ Wallet deposit credited for user ${userId} with ₦${netAmount}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Webhook stopped:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
