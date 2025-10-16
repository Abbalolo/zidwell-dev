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

    // ✅ Signature Verification
    const timestamp = req.headers.get("nomba-timestamp");
    const signature =
      req.headers.get("nomba-sig-value") ||
      req.headers.get("nomba-signature");

    if (!timestamp || !signature) {
      return NextResponse.json(
        { error: "Missing Nomba signature headers" },
        { status: 401 }
      );
    }

    const hashingPayload = `${payload.event_type}:${payload.requestId}:${payload.data?.merchant?.userId || ""}:${payload.data?.merchant?.walletId || ""}:${payload.data?.transaction?.transactionId || ""}:${payload.data?.transaction?.type || ""}:${payload.data?.transaction?.time || ""}:${payload.data?.transaction?.responseCode || ""}`;
    const message = `${hashingPayload}:${timestamp}`;

    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest("base64");

    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

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

    if (!merchantRef) {
      return NextResponse.json(
        { message: "Ignored: No merchant reference" },
        { status: 200 }
      );
    }

    // ✅ Find pending transaction
    const { data: pendingTx } = await supabase
      .from("transactions")
      .select("*")
      .or(`merchant_tx_ref.eq.${merchantRef},reference.eq.${merchantRef}`)
      .single();

    if (!pendingTx) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 200 }
      );
    }

    if (["success", "failed"].includes(pendingTx.status)) {
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
      const fee = Number(pendingTx.fee || 0);
      const totalDeduction = Number(
        pendingTx.total_deduction || pendingTx.amount + fee
      );

      // ✅ Mark transaction success
      await supabase
        .from("transactions")
        .update({
          status: "success",
          reference: nombaTransactionId,
          external_response: JSON.stringify(payload),
        })
        .eq("id", pendingTx.id);

      // ✅ Deduct from wallet
      await supabase.rpc("decrement_wallet_balance", {
        user_id: pendingTx.user_id,
        amt: totalDeduction,
      });

      // ✅ Record fee
      await supabase.from("transactions").insert({
        user_id: pendingTx.user_id,
        type: "fee",
        amount: fee,
        status: "success",
        description: `Withdrawal fee`,
        merchant_tx_ref: `FEE_${pendingTx.merchant_tx_ref}`,
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ✅ Handle Withdrawal Failure
    if (
      eventType === "payout_failed" ||
      (txType === "transfer" &&
        payload.data?.transaction?.status?.toLowerCase() === "failed")
    ) {
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: JSON.stringify(payload),
        })
        .eq("id", pendingTx.id);

      // ✅ Refund if needed
      await supabase.rpc("increment_wallet_balance", {
        user_id: pendingTx.user_id,
        amt: pendingTx.total_deduction || pendingTx.amount,
      });

      return NextResponse.json({ refunded: true }, { status: 200 });
    }

    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
