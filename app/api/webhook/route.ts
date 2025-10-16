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
    console.log("🟡 Payload received:", payload);

    const timestamp = req.headers.get("nomba-timestamp");
    const signature = req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

    if (!timestamp || !signature) {
      console.warn("⚠️ Missing signature headers");
      return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
    }

    // Signature verification
    const message = `${payload.event_type}:${payload.requestId}:${payload.data?.merchant?.aliasAccountReference || ""}:${payload.data?.transaction?.transactionId || ""}:${payload.data?.transaction?.type || ""}:${payload.data?.transaction?.time || ""}:${payload.data?.transaction?.responseCode || ""}:${timestamp}`;
    const expectedSignature = createHmac("sha256", NOMBA_SIGNATURE_KEY).update(message).digest("base64");

    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      console.warn("⚠️ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventType = payload.event_type;
    const txType = payload.data?.transaction?.type || "";
    const merchantRef = payload.data?.transaction?.merchantTxRef || payload.data?.transaction?.merchant_tx_ref || null;
    const nombaTransactionId = payload.data?.transaction?.transactionId || null;
    const amount = Number(payload.data?.transaction?.amount || 0);
    const fee = Number(payload.data?.transaction?.fee || 0);
    const netAmount = amount - fee;

    let userId = payload.data?.merchant?.aliasAccountReference || null;
    if (!userId && txType === "transfer") userId = payload.data?.transaction?.merchantTxRef;
    if (!userId) {
      console.warn("⚠️ No userId found. Ignoring event.");
      return NextResponse.json({ message: "No user ID found. Ignored." }, { status: 200 });
    }

    // Find pending transaction
    const { data: pendingTx } = await supabase
      .from("transactions")
      .select("*")
      .or(`merchant_tx_ref.eq.${merchantRef},reference.eq.${merchantRef}`)
      .maybeSingle();

    console.log("🟢 Pending transaction:", pendingTx);

    if (!pendingTx) {
      console.warn("⚠️ Pending transaction not found");
      return NextResponse.json({ message: "Transaction not found" }, { status: 200 });
    }

    if (["success", "failed"].includes(pendingTx.status)) {
      console.log("ℹ️ Transaction already processed");
      return NextResponse.json({ message: "Transaction already processed" }, { status: 200 });
    }

    // ✅ Handle deposit / card deposit success
    if ((eventType === "payment_success" && ["deposit","card_deposit"].includes(txType)) ||
        (eventType === "payout_success" && txType === "transfer")) {

      console.log(`💰 Crediting wallet. Amount: ${amount}, Fee: ${fee}, Net: ${netAmount}`);

      // Update main transaction
      await supabase.from("transactions").update({
        status: "success",
        reference: nombaTransactionId,
        fee,
        total_deduction: netAmount,
        external_response: payload,
      }).eq("id", pendingTx.id);

      // Increment wallet
      const { error: rpcError } = await supabase.rpc("increment_wallet_balance", { user_id: userId, amt: netAmount });
      if (rpcError) console.error("❌ RPC wallet error:", rpcError);

      // Insert fee transaction if fee > 0
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
        console.log(`ℹ️ Fee transaction recorded: ${fee}`);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Handle failed deposit / transfer
    if ((eventType === "payment_failed" && ["deposit","card_deposit"].includes(txType)) ||
        (eventType === "payout_failed" && txType === "transfer")) {

      await supabase.from("transactions").update({
        status: "failed",
        external_response: payload,
      }).eq("id", pendingTx.id);

      console.log("⚠️ Transaction failed. Marked as failed.");
      return NextResponse.json({ refunded: true }, { status: 200 });
    }

    console.log("ℹ️ Event ignored");
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });

  } catch (err: any) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
