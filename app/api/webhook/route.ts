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
    console.log("✅ Nomba Webhook triggered");

    const rawBody = await req.text();
    console.log("🟡 Raw Body:", rawBody);

    const payload = JSON.parse(rawBody);
    console.log("🟡 Parsed Payload:", JSON.stringify(payload, null, 2));

    // ✅ Signature Verification
    const timestamp = req.headers.get("nomba-timestamp");
    const signature =
      req.headers.get("nomba-sig-value") ||
      req.headers.get("nomba-signature");

    console.log("🟡 Headers:", { timestamp, signature });

    if (!timestamp || !signature) {
      console.warn("❌ Missing signature headers");
      return NextResponse.json(
        { error: "Missing Nomba signature headers" },
        { status: 401 }
      );
    }

    const hashingPayload = `${payload.event_type}:${payload.requestId}:${payload.data?.merchant?.userId || ""}:${payload.data?.merchant?.walletId || ""}:${payload.data?.transaction?.transactionId || ""}:${payload.data?.transaction?.type || ""}:${payload.data?.transaction?.time || ""}:${payload.data?.transaction?.responseCode || ""}`;
    const message = `${hashingPayload}:${timestamp}`;

    console.log("🟡 HMAC Message Before Signing:", message);

    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest("base64");

    console.log("🟡 Expected Signature:", expectedSignature);
    console.log("🟡 Received Signature:", signature);

    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      console.error("❌ Signature mismatch!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Signature verified");

    // ✅ Extract data
    const eventType = payload.event_type;
    const txType = payload.data?.transaction?.type || "";
    const merchantRef =
      payload.data?.transaction?.merchantTxRef ||
      payload.data?.transaction?.merchant_tx_ref ||
      payload.data?.meta?.merchantTxRef ||
      null;

    const nombaTransactionId =
      payload.data?.transaction?.transactionId ||
      payload.data?.transaction?.id ||
      null;

    console.log("🟡 Event Type:", eventType);
    console.log("🟡 Transaction Type:", txType);
    console.log("🟡 Merchant Reference:", merchantRef);
    console.log("🟡 Nomba Transaction ID:", nombaTransactionId);

    if (!merchantRef) {
      console.warn("⚠️ No merchant reference found. Ignoring webhook.");
      return NextResponse.json(
        { message: "Ignored: No merchant reference" },
        { status: 200 }
      );
    }

    // ✅ Find pending transaction
    console.log(`🔍 Searching transaction: ${merchantRef}`);
    const { data: pendingTx, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .or(`merchant_tx_ref.eq.${merchantRef},reference.eq.${merchantRef}`)
      .single();

    if (findError) console.error("❌ Supabase Error:", findError);
    console.log("🟡 Found Pending Transaction:", pendingTx);

    if (!pendingTx) {
      console.warn("⚠️ Transaction not found in database");
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 200 }
      );
    }

    if (["success", "failed"].includes(pendingTx.status)) {
      console.log("⚠️ Transaction already processed. Skipping.");
      return NextResponse.json(
        { message: "Transaction already processed" },
        { status: 200 }
      );
    }

    // ✅ Handle Withdrawal Success
    if (
      eventType === "payout_success" ||
      (txType === "transfer" &&
        payload.data?.transaction?.status?.toLowerCase() === "success")
    ) {
      console.log("✅ Processing SUCCESS webhook");

      const fee = Number(pendingTx.fee || 0);
      const totalDeduction = Number(
        pendingTx.total_deduction || pendingTx.amount + fee
      );
      console.log("🟡 Fee:", fee, "Total Deduction:", totalDeduction);

      await supabase
        .from("transactions")
        .update({
          status: "success",
          reference: nombaTransactionId,
          external_response: JSON.stringify(payload),
        })
        .eq("id", pendingTx.id);

      await supabase.rpc("decrement_wallet_balance", {
        user_id: pendingTx.user_id,
        amt: totalDeduction,
      });

      console.log("✅ Wallet debited & transaction updated");

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ✅ Handle Failure
    if (
      eventType === "payout_failed" ||
      (txType === "transfer" &&
        payload.data?.transaction?.status?.toLowerCase() === "failed")
    ) {
      console.log("❌ Processing FAILED webhook");

      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: JSON.stringify(payload),
        })
        .eq("id", pendingTx.id);

      await supabase.rpc("increment_wallet_balance", {
        user_id: pendingTx.user_id,
        amt: pendingTx.amount,
      });

      console.log("✅ Wallet refunded and transaction marked FAILED");

      return NextResponse.json({ refunded: true }, { status: 200 });
    }

    console.log("ℹ️ Event ignored.");
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  } catch (err: any) {
    console.error("🔥 Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
