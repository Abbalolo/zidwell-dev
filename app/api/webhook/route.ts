// app/api/webhook/route.ts
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
    // Read raw body (required for signature verification)
    const rawBody = await req.text();
    console.log("====== Incoming Webhook ======");
    console.log("Headers ->", Object.fromEntries(req.headers.entries()));
    console.log("Raw Body ->", rawBody);
    console.log("==============================");

    const payload = JSON.parse(rawBody);

    // Nomba signature headers (support both header names)
    const timestamp = req.headers.get("nomba-timestamp");
    const signature = req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

    if (!timestamp || !signature) {
      return NextResponse.json({ error: "Missing Nomba signature headers" }, { status: 401 });
    }

    // Build message according to Nomba docs (match your earlier implementation)
    const hashingPayload = `${payload.event_type}:${payload.requestId}:${payload.data?.merchant?.userId || ''}:${payload.data?.merchant?.walletId || ''}:${payload.data?.transaction?.transactionId || ''}:${payload.data?.transaction?.type || ''}:${payload.data?.transaction?.time || ''}:${payload.data?.transaction?.responseCode || ''}`;
    const message = `${hashingPayload}:${timestamp}`;

    // HMAC SHA256 -> Base64
    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest("base64");

    // compare base64 buffers safely
    const signatureBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    console.log("Signature from Nomba ->", signature);
    console.log("Expected Signature ->", expectedSignature);
    console.log("Same Length? ->", signatureBuffer.length === expectedBuffer.length);

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.error("❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.log("✅ Webhook Verified");

    // We care about transfer/payout events for withdrawals:
    // possible event_type: 'payout_success', 'payout_failed', 'payment_success', etc.
    const eventType: string = payload.event_type;
    const txType: string = payload.data?.transaction?.type || "";

    // Extract merchant reference: Nomba sometimes returns merchantTxRef inside data.transaction or data.meta
    const merchantRef =
      payload.data?.transaction?.merchantTxRef ||
      payload.data?.meta?.merchantTxRef ||
      payload.data?.merchantTxRef ||
      payload.data?.transaction?.merchant_tx_ref ||
      null;

    const amount = Number(payload.data?.transaction?.transactionAmount ?? payload.data?.transaction?.amount ?? 0);
    const nombaTransactionId = payload.data?.transaction?.transactionId || payload.data?.transaction?.id || null;

    // If it's a deposit/payment, ignore here (you may still handle those)
    // We'll specifically route payout/transfer events
    if (!merchantRef && eventType !== "payment_success") {
      console.warn("No merchantRef found and not a payment_success -> ignoring");
      return NextResponse.json({ message: "Ignored (no merchantRef)" }, { status: 200 });
    }

    // Find the pending withdrawal by merchant_tx_ref
    const { data: pendingTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("merchant_tx_ref", merchantRef)
      .maybeSingle();

    if (!pendingTx) {
      console.error("No transaction found for merchantRef:", merchantRef);
      // Respond 200 to avoid immediate retries while you investigate.
      return NextResponse.json({ message: "No matching transaction" }, { status: 200 });
    }

    // Short circuit: if already processed, ignore
    if (pendingTx.status === "success") {
      console.log("Transaction already marked success:", pendingTx.id);
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    } else if (pendingTx.status === "failed") {
      console.log("Transaction already marked failed:", pendingTx.id);
      return NextResponse.json({ message: "Already processed (failed)", status: 200 });
    }

    // ---- HANDLING SUCCESS ----
    if (eventType === "payout_success" || (txType === "transfer" && payload.data?.transaction?.status?.toLowerCase?.() === "success")) {
      // Use stored fee and total_deduction from pendingTx (we saved this earlier)
      const fee = Number(pendingTx.fee || 0);
      const totalDeduction = Number(pendingTx.total_deduction || pendingTx.amount + fee || 0);

      // 1) Update the withdrawal transaction as success and attach Nomba reference
      const { error: updateTxErr } = await supabase
        .from("transactions")
        .update({
          status: "success",
          reference: nombaTransactionId || payload.data?.data?.reference || null,
          external_response: JSON.stringify(payload),
        })
        .eq("id", pendingTx.id);

      if (updateTxErr) {
        console.error("Failed to update transaction status ->", updateTxErr);
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
      }

      // 2) Deduct user's wallet balance
      // Try an atomic RPC first (recommended). If you have an RPC to debit safely, call it.
      // Fallback: attempt conditional update to ensure user has adequate balance.
      if (typeof supabase.rpc === "function") {
        // If you have a Postgres function 'decrement_wallet_balance' that returns success, use that.
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc("decrement_wallet_balance", {
            user_id: pendingTx.user_id,
            amt: totalDeduction,
          });
          if (rpcErr) {
            // If RPC failed, fallback to manual update below
            console.warn("RPC decrement failed, falling back:", rpcErr);
            throw rpcErr;
          }
        } catch (rpcEx) {
          // fallback to manual update
          const { data: userBefore } = await supabase
            .from("users")
            .select("wallet_balance")
            .eq("id", pendingTx.user_id)
            .single();

          if (!userBefore) {
            console.error("User not found while trying to debit:", pendingTx.user_id);
            return NextResponse.json({ error: "User not found" }, { status: 500 });
          }

          if (Number(userBefore.wallet_balance) < totalDeduction) {
            // This is unexpected (user had enough when initiating)
            console.error("Insufficient balance at webhook time. Aborting deduction.");
            // mark transaction failed and return
            await supabase
              .from("transactions")
              .update({ status: "failed", external_response: JSON.stringify(payload) })
              .eq("id", pendingTx.id);

            return NextResponse.json({ error: "Insufficient balance at webhook time" }, { status: 500 });
          }

          // perform update
          const { error: userUpdateErr } = await supabase
            .from("users")
            .update({
              wallet_balance: Number(userBefore.wallet_balance) - totalDeduction,
            })
            .eq("id", pendingTx.user_id);

          if (userUpdateErr) {
            console.error("Failed to update user balance:", userUpdateErr);
            return NextResponse.json({ error: "Failed to update user balance" }, { status: 500 });
          }
        }
      }

      // 3) Insert fee transaction record (record that fee was charged)
      const { error: feeTxErr } = await supabase.from("transactions").insert({
        user_id: pendingTx.user_id,
        type: "fee",
        amount: fee,
        status: "success",
        description: `Withdrawal fee for ₦${pendingTx.amount}`,
        merchant_tx_ref: `FEE_${pendingTx.merchant_tx_ref}`,
        narration: pendingTx.narration || "Withdrawal fee",
      });

      if (feeTxErr) {
        console.warn("Failed to record fee transaction:", feeTxErr);
        // Not fatal: we already deducted balance. Continue but log.
      }

      console.log(`✅ Withdrawal success: ${pendingTx.id} deducted ₦${totalDeduction}`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ---- HANDLING FAILURE / REJECTED ----
    if (eventType === "payout_failed" || (txType === "transfer" && payload.data?.transaction?.status?.toLowerCase?.() === "failed")) {
      // mark transaction failed, and refund user if previously debited
      const { error: updateTxErr } = await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: JSON.stringify(payload),
          reference: nombaTransactionId || null,
        })
        .eq("id", pendingTx.id);

      if (updateTxErr) {
        console.error("Failed to mark transaction failed:", updateTxErr);
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
      }

      // Check if the wallet was debited earlier (rare if you followed new withdraw API)
      // Heuristic: check for a fee transaction with merchant_tx_ref `FEE_<merchantRef>` OR withdrawal already successful
      const { data: existingFeeTx } = await supabase
        .from("transactions")
        .select("*")
        .eq("merchant_tx_ref", `FEE_${pendingTx.merchant_tx_ref}`)
        .maybeSingle();

      const wasDebited = !!existingFeeTx || pendingTx.status === "success";

      if (wasDebited) {
        // Refund: increment user's wallet by total_deduction and record refund transaction
        // Prefer RPC increment_wallet_balance if available
        if (typeof supabase.rpc === "function") {
          const { error: rpcErr } = await supabase.rpc("increment_wallet_balance", {
            user_id: pendingTx.user_id,
            amt: Number(pendingTx.total_deduction || pendingTx.amount),
          });
          if (rpcErr) {
            console.error("RPC refund increment failed:", rpcErr);
            return NextResponse.json({ error: "Failed to refund user" }, { status: 500 });
          }
        } else {
          const { data: userBefore } = await supabase
            .from("users")
            .select("wallet_balance")
            .eq("id", pendingTx.user_id)
            .single();

          if (!userBefore) {
            console.error("User not found for refund:", pendingTx.user_id);
            return NextResponse.json({ error: "User not found" }, { status: 500 });
          }

          const newBalance = Number(userBefore.wallet_balance) + Number(pendingTx.total_deduction || pendingTx.amount);

          const { error: updErr } = await supabase
            .from("users")
            .update({ wallet_balance: newBalance })
            .eq("id", pendingTx.user_id);

          if (updErr) {
            console.error("Failed to update user balance for refund:", updErr);
            return NextResponse.json({ error: "Failed to refund user" }, { status: 500 });
          }
        }

        // record refund transaction
        const { error: refundTxErr } = await supabase.from("transactions").insert({
          user_id: pendingTx.user_id,
          type: "refund",
          amount: Number(pendingTx.total_deduction || pendingTx.amount),
          status: "success",
          description: `Refund for failed withdrawal ${pendingTx.merchant_tx_ref}`,
          merchant_tx_ref: `REFUND_${pendingTx.merchant_tx_ref}`,
        });

        if (refundTxErr) {
          console.warn("Failed to insert refund transaction record:", refundTxErr);
        }
      }

      console.log(`⚠️ Withdrawal failed and refunded if needed: ${pendingTx.id}`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // If we get here, event wasn't handled specifically — return 200
    return NextResponse.json({ message: "Ignored event type" }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
