import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { URL } from "node:url";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractUserIdFromCallback(callbackUrl?: string | null) {
  if (!callbackUrl) return null;
  try {
    const u = new URL(callbackUrl);
    return u.searchParams.get("userId");
  } catch (err) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // raw body
    const buf = await req.arrayBuffer();
    const rawBody = Buffer.from(buf).toString("utf8");

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error("Webhook: invalid JSON body");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("🔔 Nomba webhook (raw):", rawBody);
    console.log("🔔 parsed:", payload);

    // signature verification
    const signatureKey = process.env.NOMBA_PRIVATE_KEY;
    if (!signatureKey) {
      console.error("Missing NOMBA_PRIVATE_KEY env var");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const nombaSig = req.headers.get("nomba-sig-value") ?? req.headers.get("nomba-signature") ?? "";
    const nombaTimestamp = req.headers.get("nomba-timestamp") ?? "";

    if (!nombaSig || !nombaTimestamp) {
      console.error("Missing nomba signature headers");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const ev = payload.event_type ?? "";
    const reqId = payload.requestId ?? "";
    const merchantUserId = payload?.data?.merchant?.userId ?? "";
    const merchantWalletId = payload?.data?.merchant?.walletId ?? "";
    const txn = payload?.data?.transaction ?? {};
    const txnId = txn?.transactionId ?? txn?.transaction_id ?? txn?.id ?? "";
    const txnType = txn?.type ?? "";
    const txnTime = txn?.time ?? "";
    const txnRespCode = txn?.responseCode ?? "";

    const hashingPayload = `${ev}:${reqId}:${merchantUserId}:${merchantWalletId}:${txnId}:${txnType}:${txnTime}:${txnRespCode}`;
    const message = `${hashingPayload}:${nombaTimestamp}`;

    const computed = createHmac("sha256", signatureKey).update(message).digest("hex");

    // timing-safe compare
    const computedBuf = Buffer.from(computed, "utf8");
    const headerBuf = Buffer.from(nombaSig, "utf8");
    let signatureValid = false;
    try {
      if (computedBuf.length === headerBuf.length && timingSafeEqual(computedBuf, headerBuf)) {
        signatureValid = true;
      }
    } catch (e) {
      signatureValid = false;
    }

    if (!signatureValid) {
      console.error("Signature verification failed", { computed, header: nombaSig });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Signature verified");

    // invoice flow: handle orderReference first
    const orderRef = payload?.data?.order?.orderReference ?? payload?.data?.order?.orderId ?? null;
    if (orderRef) {
      console.log("Invoice flow orderRef:", orderRef);
      // attempt to find invoice
      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_reference", orderRef)
        .single();

      if (!invError && invoice) {
        if (invoice.status !== "paid") {
          const transactionId = txnId || `INV-${Date.now()}`;

          const { error: updateError } = await supabase
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              transaction_id: transactionId,
              payment_method: txnType ?? payload?.data?.order?.paymentMethod ?? "nomba",
            })
            .eq("order_reference", orderRef);

          if (updateError) {
            console.error("Failed to update invoice", updateError);
            return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
          }

          // credit initiator via RPC
          if (invoice.user_id) {
            const creditedAmount = Number(invoice.total_amount) || 0;
            const { error: rpcErr } = await supabase.rpc("increment_wallet_balance", {
              user_id: invoice.user_id,
              amt: creditedAmount,
            });
            if (rpcErr) console.error("Failed to credit invoice initiator", rpcErr);
            else console.log(`✅ Invoice initiator ${invoice.user_id} credited ₦${creditedAmount}`);

            await supabase.from("transactions").insert({
              user_id: invoice.user_id,
              type: "invoice_payment",
              amount: creditedAmount,
              status: "success",
              reference: transactionId,
              merchant_tx_ref: `INV_PAY_${Date.now()}`,
              description: `Invoice payment for order ${orderRef}`,
            });
          }
        } else {
          console.log("Invoice already paid");
        }
      } else {
        console.log("No invoice matched orderRef:", orderRef);
      }
      return NextResponse.json({ ok: true });
    }

    // only process payment events
    const eventType = payload.event_type;
    if (!["payment_success", "virtual_account_transaction", "transaction_success"].includes(eventType)) {
      console.log("Ignored event type:", eventType);
      return NextResponse.json({ ok: true });
    }

    // read canonical fields
    const transactionAmount = Number(payload?.data?.transaction?.transactionAmount ?? payload?.data?.order?.amount ?? payload?.data?.transaction?.amount ?? 0);
    const transactionFee = Number(payload?.data?.transaction?.fee ?? 0);
    const transactionId = txnId || `${Date.now()}`;
    const paymentMethodRaw = payload?.data?.transaction?.type ?? payload?.data?.order?.paymentMethod ?? "";
    const merchantTxRef = payload?.data?.transaction?.merchantTxRef ?? payload?.data?.order?.merchantTxRef ?? null;

    console.log("Payment:", { transactionId, transactionAmount, transactionFee, paymentMethodRaw });

    // Idempotency check using transactions.reference
    const { data: existingTxn, error: checkErr } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", transactionId)
      .limit(1)
      .maybeSingle();

    if (checkErr) {
      console.error("Error checking existing transaction", checkErr);
      // in doubt, fail so Nomba retries
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (existingTxn) {
      console.log("Duplicate transaction detected, ignoring:", transactionId);
      return NextResponse.json({ ok: true });
    }

    // determine userId
    let userId = extractUserIdFromCallback(payload?.data?.order?.callbackUrl ?? payload?.data?.order?.callbackURL ?? null);
    if (!userId) {
      userId = payload?.data?.aliasAccountReference ?? payload?.data?.transaction?.aliasAccountReference ?? payload?.data?.merchant?.userId ?? null;
    }

    if (!userId) {
      console.error("User ID not found in payload; cannot credit");
      return NextResponse.json({ error: "User id not found" }, { status: 400 });
    }

    const netAmount = Number((transactionAmount - transactionFee).toFixed(2));
    if (netAmount <= 0) {
      console.error("Net amount not positive:", netAmount);
      return NextResponse.json({ error: "Invalid net amount" }, { status: 400 });
    }

    // Now call the atomic RPC
    const txType = (paymentMethodRaw.toLowerCase().includes("card") || payload?.data?.order?.paymentMethod === "card_payment")
      ? "card_deposit"
      : "bank_deposit";

    console.log("Calling RPC process_webhook_transaction", { userId, netAmount, txType, transactionId });

    const { data: rpcRes, error: rpcErr } = await supabase.rpc("process_webhook_transaction", {
      p_user_id: userId,
      p_amount: netAmount,
      p_type: txType,
      p_reference: transactionId,
      p_description: `Deposit via ${txType} of ₦${transactionAmount} (fee ₦${transactionFee})`,
      p_transaction_fee: transactionFee
    });

    if (rpcErr) {
      console.error("RPC process_webhook_transaction failed", rpcErr);
      // return 500 so Nomba retries
      return NextResponse.json({ error: "RPC failed" }, { status: 500 });
    }

    // rpcRes can be array/row depending on driver; handle both
    const rpcSuccess = Array.isArray(rpcRes) ? rpcRes[0]?.success ?? false : rpcRes?.success ?? false;
    const rpcMessage = Array.isArray(rpcRes) ? rpcRes[0]?.message ?? '' : rpcRes?.message ?? '';

    if (!rpcSuccess) {
      console.error("RPC reported failure:", rpcMessage);
      // if duplicate_reference -> treat as success to avoid double credit
      if (rpcMessage === 'duplicate_reference') {
        console.log("RPC says duplicate_reference; returning ok");
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: `RPC failed: ${rpcMessage}` }, { status: 500 });
    }

    console.log("✅ RPC processed successfully; deposit completed:", transactionId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook handler unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "unexpected" }, { status: 500 });
  }
}
