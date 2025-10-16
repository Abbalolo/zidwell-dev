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
    console.log("rawBody:", rawBody);

    const payload = JSON.parse(rawBody);
    console.log("payload parsed:", payload);

    const timestamp = req.headers.get("nomba-timestamp");
    const signature = req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");
    console.log("signature header:", signature);
    console.log("timestamp header:", timestamp);

    if (!timestamp || !signature) {
      console.log("Missing signature headers");
      return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
    }

    // Build message for HMAC
    const message = `${payload.event_type || ""}:${payload.requestId || ""}:${
      payload.data?.merchant?.aliasAccountReference || ""
    }:${payload.data?.transaction?.transactionId || ""}:${
      payload.data?.transaction?.type || ""
    }:${payload.data?.transaction?.time || ""}:${
      payload.data?.transaction?.responseCode || ""
    }:${timestamp}`;

    console.log("message for HMAC:", message);

    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY).update(message);
    const expectedSignature = hmac.digest("base64");
    console.log("expected HMAC:", expectedSignature);

    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");
    console.log("receivedBuffer length:", receivedBuffer.length, "expectedBuffer length:", expectedBuffer.length);

    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      console.log("Invalid signature detected!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.log("Signature verified ✅");

    const eventType = payload.event_type;
    const txType = payload.data?.transaction?.type || "";
    const merchantRef = payload.data?.transaction?.merchantTxRef || payload.data?.transaction?.merchant_tx_ref || null;
    const nombaTransactionId = payload.data?.transaction?.transactionId || null;
    const fee = Number(payload.data?.transaction?.fee || 0);
    const amount = Number(payload.data?.transaction?.amount || 0);
    const netAmount = amount - fee;
    console.log("txType:", txType, "amount:", amount, "fee:", fee, "netAmount:", netAmount);

    let userId = payload.data?.merchant?.aliasAccountReference || null;
    if (!userId && txType === "transfer") userId = payload.data?.transaction?.merchantTxRef;
    console.log("resolved userId:", userId);

    if (!userId) {
      console.log("No user ID found. Ignoring event.");
      return NextResponse.json({ message: "No user ID found. Ignored." }, { status: 200 });
    }

    // Find pending transaction
    const { data: pendingTx } = await supabase
      .from("transactions")
      .select("*")
      .or(`merchant_tx_ref.eq.${merchantRef},reference.eq.${merchantRef}`)
      .maybeSingle();

    console.log("pendingTx found:", pendingTx);

    if (!pendingTx) {
      console.log("Transaction not found");
      return NextResponse.json({ message: "Transaction not found" }, { status: 200 });
    }
    if (["success", "failed"].includes(pendingTx.status)) {
      console.log("Transaction already processed");
      return NextResponse.json({ message: "Transaction already processed" }, { status: 200 });
    }

    // ✅ Handle deposit success
    if ((eventType === "payment_success" && ["deposit", "card_deposit"].includes(txType)) ||
        (eventType === "payout_success" && txType === "transfer")) {

      console.log("Processing success transaction...");

      // Update transaction
      const { error: updateError } = await supabase.from("transactions").update({
        status: "success",
        reference: nombaTransactionId,
        fee,
        total_deduction: netAmount,
        external_response: payload,
      }).eq("id", pendingTx.id);

      if (updateError) console.error("Failed to update transaction:", updateError);

      // Increment wallet
      const { error: rpcError } = await supabase.rpc("increment_wallet_balance", { user_id: userId, amt: netAmount });
      if (rpcError) console.error("RPC wallet error:", rpcError);
      else console.log(`Wallet incremented by ${netAmount} for user ${userId}`);

      // Record fee transaction if fee > 0
      if (fee > 0) {
        const { error: feeError } = await supabase.from("transactions").insert([{
          user_id: userId,
          type: "fee",
          amount: fee,
          total_deduction: fee,
          status: "success",
          description: "Transaction fee",
          merchant_tx_ref: `FEE_${pendingTx.merchant_tx_ref || pendingTx.reference}`,
        }]);
        if (feeError) console.error("Failed to insert fee transaction:", feeError);
        else console.log("Fee transaction recorded");
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Handle failure
    if ((eventType === "payment_failed" && ["deposit", "card_deposit"].includes(txType)) ||
        (eventType === "payout_failed" && txType === "transfer")) {

      console.log("Processing failed transaction...");

      const { error: failError } = await supabase.from("transactions").update({
        status: "failed",
        external_response: payload,
      }).eq("id", pendingTx.id);

      if (failError) console.error("Failed to update failed transaction:", failError);

      return NextResponse.json({ refunded: true }, { status: 200 });
    }

    console.log("Event ignored");
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });

  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
