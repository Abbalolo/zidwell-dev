// app/api/nomba-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    console.log("payload", payload);

    const timestamp = req.headers.get("nomba-timestamp");
    const signature = req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");
console.log("signature", signature)
console.log("timestamp", timestamp)
    if (!timestamp || !signature) return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });

    // Verify signature
    const message = `${payload.event_type}:${payload.requestId}:${payload.data?.merchant?.aliasAccountReference || ""}:${payload.data?.transaction?.transactionId || ""}:${payload.data?.transaction?.type || ""}:${payload.data?.transaction?.time || ""}:${payload.data?.transaction?.responseCode || ""}:${timestamp}`;
    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY).update(message);
    const expectedSignature = hmac.digest("base64");

    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventType = payload.event_type;
    const txType = payload.data?.transaction?.type || "";
    const merchantRef = payload.data?.transaction?.merchantTxRef || payload.data?.transaction?.merchant_tx_ref || null;
    const nombaTransactionId = payload.data?.transaction?.transactionId || null;
    const fee = Number(payload.data?.transaction?.fee || 0);
    const amount = Number(payload.data?.transaction?.amount || 0);
    const totalDeduction = amount + fee;

    let userId = payload.data?.merchant?.aliasAccountReference || null;
    if (!userId && txType === "transfer") userId = payload.data?.transaction?.merchantTxRef;

    if (!userId) return NextResponse.json({ message: "No user ID found. Ignored." }, { status: 200 });

    // Find pending transaction
    const { data: pendingTx } = await supabase
      .from("transactions")
      .select("*")
      .or(`merchant_tx_ref.eq.${merchantRef},reference.eq.${merchantRef}`)
      .maybeSingle();

    console.log("pendingTx", pendingTx);

    if (!pendingTx) return NextResponse.json({ message: "Transaction not found" }, { status: 200 });
    if (["success", "failed"].includes(pendingTx.status)) return NextResponse.json({ message: "Transaction already processed" }, { status: 200 });

    // ✅ Handle deposit success
    if ((eventType === "payment_success" && ["deposit","card_deposit"].includes(txType)) ||
        (eventType === "payout_success" && txType === "transfer")) {

      // Update transaction success + external_response
      await supabase.from("transactions").update({
        status: "success",
        reference: nombaTransactionId,
        fee,
        total_deduction: totalDeduction,
        external_response: payload,
      }).eq("id", pendingTx.id);

      // Increment wallet safely
      const { error: rpcError } = await supabase.rpc("increment_wallet_balance", { user_id: userId, amt: amount });
      if (rpcError) console.error("RPC wallet error:", rpcError);

      // Record fee transaction if fee > 0
      if (fee > 0) {
        await supabase.from("transactions").insert([{
          user_id: userId,
          type: "fee",
          amount: fee,
          total_deduction: fee,
          status: "success",
          description: "Transaction fee",
          merchant_tx_ref: `FEE_${pendingTx.merchant_tx_ref || pendingTx.reference}`,
        }]);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Handle failure (deposit/transfer)
    if ((eventType === "payment_failed" && ["deposit","card_deposit"].includes(txType)) ||
        (eventType === "payout_failed" && txType === "transfer")) {

      await supabase.from("transactions").update({
        status: "failed",
        external_response: payload,
      }).eq("id", pendingTx.id);

      return NextResponse.json({ refunded: true }, { status: 200 });
    }

    return NextResponse.json({ message: "Event ignored" }, { status: 200 });

  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
