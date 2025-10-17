// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  try {
    console.log("====== Nomba Webhook Triggered ======");

    // 1) Read raw body and parse
    const rawBody = await req.text();
    console.log("🔸 Raw body length:", rawBody?.length);
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
      console.log("payload", payload);
    } catch (err) {
      console.error("❌ Failed to parse JSON body", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    console.log(
      "🟢 Parsed payload.event_type:",
      payload?.event_type || payload?.eventType
    );

    // 2) Signature verification (HMAC SHA256 -> Base64)
    const timestamp = req.headers.get("nomba-timestamp");
    const signature =
      req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

    if (!timestamp || !signature) {
      console.warn("❗ Missing Nomba signature headers. Headers:", {
        "nomba-timestamp": timestamp,
        "nomba-sig-value": signature,
      });
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    // Build hash payload according to Nomba docs (use safe optional chaining)
    const hashingPayload = `${payload.event_type}:${payload.requestId}:${
      payload.data?.merchant?.userId || ""
    }:${payload.data?.merchant?.walletId || ""}:${
      payload.data?.transaction?.transactionId || ""
    }:${payload.data?.transaction?.type || ""}:${
      payload.data?.transaction?.time || ""
    }:${payload.data?.transaction?.responseCode || ""}`;
    const message = `${hashingPayload}:${timestamp}`;

    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest("base64");

    // Timing-safe compare
    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    console.log("🔐 Signature verification: received:", signature);
    console.log("🔐 Signature verification: expected:", expectedSignature);
    console.log(
      "🔐 Same length?:",
      receivedBuffer.length === expectedBuffer.length
    );

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      console.error("❌ Invalid signature - aborting webhook");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.log("✅ Signature verified");

    // 3) Normalize fields
    const eventType: string = payload.event_type || payload.eventType;
    const tx = payload.data?.transaction || payload.data?.txn || {};
    const order = payload.data?.order || null;
    const meta = payload.data?.meta || payload.data?.merchant || {};

    // try several fields for IDs / refs
    const nombaTransactionId =
      tx.transactionId || tx.transaction_id || tx.id || tx.reference || null;
    const merchantTxRef =
      tx.merchantTxRef ||
      tx.merchant_tx_ref ||
      payload.data?.meta?.merchantTxRef ||
      null;
    const orderReference =
      order?.orderReference || order?.order_reference || null;
    const aliasAccountReference =
      tx.aliasAccountReference ||
      tx.alias_account_reference ||
      tx.aliasAccount ||
      null;
    const transactionAmount = safeNum(
      tx.transactionAmount ?? tx.amount ?? order?.amount ?? 0
    );
    const feeFromNomba = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
    const txStatusRaw = (tx.status || payload.data?.status || "").toString();
    const txStatus = txStatusRaw.toLowerCase();

    console.log("🔎 eventType:", eventType);
    console.log("🔎 txType:", tx.type || tx.transactionType || "unknown");
    console.log("🔎 nombaTransactionId:", nombaTransactionId);
    console.log("🔎 merchantTxRef:", merchantTxRef);
    console.log("🔎 orderReference:", orderReference);
    console.log("🔎 aliasAccountReference:", aliasAccountReference);
    console.log(
      "🔎 transactionAmount:",
      transactionAmount,
      "fee:",
      feeFromNomba,
      "txStatus:",
      txStatus
    );

    // 4) Decide which flow this is:
    // - Card payment -> payment_success with order.orderReference (card_deposit)
    // - Virtual account deposit -> payment_success or vact_transfer with aliasAccountReference
    // - Outgoing transfer (withdrawal) -> payout_success/payout_failed or transfer with merchantTxRef/transactionId
    const isCardPayment = Boolean(orderReference);
    const isVirtualAccountDeposit = Boolean(aliasAccountReference);
    const isPayoutOrTransfer =
      Boolean(merchantTxRef) ||
      (tx.type && tx.type.toLowerCase().includes("transfer")) ||
      eventType?.toLowerCase()?.includes("payout");

    // ---------- DEPOSIT: CARD (orderReference) OR VA ----------
    if (
      eventType === "payment_success" ||
      eventType === "payment.succeeded" ||
      isCardPayment ||
      isVirtualAccountDeposit
    ) {
      // DETERMINE userId & reference for transaction
      let userId: string | null = null;
      let referenceToUse: string | null =
        orderReference || nombaTransactionId || tx.sessionId || null;
      let txType = isCardPayment ? "card_deposit" : "deposit";
      let channel = isCardPayment ? "card" : "bank";

      console.log(
        "➡️ Handling deposit/card flow. txType:",
        txType,
        "channel:",
        channel
      );

      // For VA: aliasAccountReference === userId (you confirmed)
      if (isVirtualAccountDeposit) {
        userId = aliasAccountReference;
        // for VA there may not be an orderReference; use transactionId as merchant_tx_ref
        referenceToUse =
          nombaTransactionId || tx.sessionId || `nomba-${Date.now()}`;
      } else if (isCardPayment) {
        // Card: find the pending transaction inserted at initialize step using orderReference
        referenceToUse = orderReference;
        // find transaction row to get userId
        const { data: pendingByRef, error: refErr } = await supabase
          .from("transactions")
          .select("*")
          .eq("reference", referenceToUse)
          .maybeSingle();

        if (refErr) {
          console.error("❌ Supabase error finding orderReference:", refErr);
          return NextResponse.json({ error: "DB error" }, { status: 500 });
        }

        if (pendingByRef) {
          userId = pendingByRef.user_id;
        } else {
          // fallback: try to find user by customerEmail if present
          const customerEmail =
            order?.customerEmail ||
            payload.data?.customer?.customerEmail ||
            null;
          if (customerEmail) {
            const { data: userByEmail } = await supabase
              .from("users")
              .select("id")
              .eq("email", customerEmail)
              .maybeSingle();
            userId = userByEmail?.id || null;
          }
        }
      }

      if (!userId) {
        console.warn(
          "⚠️ Could not determine userId for deposit. referenceToUse:",
          referenceToUse
        );
        // Best effort: if aliasAccountReference exists but not stored in users table, create transaction referencing alias as userId (you said alias === userId)
        if (aliasAccountReference) {
          userId = aliasAccountReference;
        } else {
          // Nothing we can do reliably
          return NextResponse.json(
            { message: "No user to credit" },
            { status: 200 }
          );
        }
      }

      console.log(
        "👤 Deposit userId resolved:",
        userId,
        "referenceToUse:",
        referenceToUse
      );

      // Compute amounts
      const amount = transactionAmount;
      const fee = feeFromNomba;
      const netCredit = Number((amount - fee).toFixed(2));
      const total_deduction = Number((amount - fee).toFixed(2)); // for deposit, store net as total_deduction for consistency

      // Idempotency: check existing transaction by reference or merchant_tx_ref
      // Idempotency: check existing transaction by reference or merchant_tx_ref
      const { data: existingTx, error: existingErr } = await supabase
        .from("transactions")
        .select("*")
        .or(
          `reference.eq.${referenceToUse},merchant_tx_ref.eq.${nombaTransactionId}`
        )
        .maybeSingle();

      if (existingErr) {
        console.error("❌ Error checking existing transaction:", existingErr);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      // ✅ Already successfully processed
      if (existingTx && existingTx.status === "success") {
        console.log(
          "⚠️ Deposit already processed (idempotent). Skipping credit."
        );
        return NextResponse.json(
          { message: "Already processed" },
          { status: 200 }
        );
      }

      // 🔁 Existing pending tx: mark success and credit
      if (existingTx) {
        console.log(
          "🔁 Found existing transaction. Updating to success and crediting user."
        );
        const { error: updErr } = await supabase
          .from("transactions")
          .update({
            status: "success",
            amount,
            fee,
            total_deduction,
            merchant_tx_ref: nombaTransactionId,
            external_response: payload,
            channel,
          })
          .eq("id", existingTx.id);

        if (updErr) {
          console.error("❌ Failed to update existing transaction:", updErr);
          return NextResponse.json(
            { error: "Failed to update transaction" },
            { status: 500 }
          );
        }

        // Credit wallet atomically using RPC
        const { error: rpcErr } = await supabase.rpc(
          "increment_wallet_balance",
          {
            user_id: existingTx.user_id,
            amt: netCredit,
          }
        );

        if (rpcErr) {
          console.error("❌ RPC increment_wallet_balance failed:", rpcErr);
          // fallback manual credit
          const { data: before } = await supabase
            .from("users")
            .select("wallet_balance")
            .eq("id", existingTx.user_id)
            .single();

          if (!before) {
            console.error("❌ User not found for manual credit fallback");
            return NextResponse.json(
              { error: "User not found" },
              { status: 500 }
            );
          }

          const newBal = Number(before.wallet_balance) + netCredit;
          const { error: updUserErr } = await supabase
            .from("users")
            .update({ wallet_balance: newBal })
            .eq("id", existingTx.user_id);

          if (updUserErr) {
            console.error("❌ Manual wallet update failed:", updUserErr);
            return NextResponse.json(
              { error: "Failed to credit wallet" },
              { status: 500 }
            );
          }
        }

        console.log(
          `✅ Credited user ${existingTx.user_id} with ₦${netCredit} (existing tx updated)`
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }
      // No existing tx: create and credit (auto-create best-effort)
      console.log(
        "➕ No existing tx — creating transaction and crediting user now (auto-create)."
      );
      const { error: insertErr } = await supabase.from("transactions").insert([
        {
          user_id: userId,
          type: txType === "card_deposit" ? "card_deposit" : "deposit",
          amount,
          fee,
          total_deduction,
          status: "success",
          reference: referenceToUse,
          merchant_tx_ref: nombaTransactionId,
          description:
            txType === "card_deposit" ? "Card deposit" : "Bank deposit",
          external_response: payload,
          channel: txType === "card_deposit" ? "card" : "bank",
        },
      ]);

      if (insertErr) {
        // if duplicate (unique constraint) — treat as processed
        if (insertErr.code === "23505") {
          console.warn(
            "⚠️ Duplicate insert prevented. Treating as already processed."
          );
          return NextResponse.json(
            { message: "Duplicate ignored" },
            { status: 200 }
          );
        }
        console.error("❌ Failed to insert new transaction:", insertErr);
        return NextResponse.json(
          { error: "Failed to record transaction" },
          { status: 500 }
        );
      }

      // credit via RPC
      const { error: rpcErr2 } = await supabase.rpc(
        "increment_wallet_balance",
        {
          user_id: userId,
          amt: netCredit,
        }
      );
      if (rpcErr2) {
        console.error("❌ RPC increment failed (after insert):", rpcErr2);
        // fallback manual
        const { data: before } = await supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", userId)
          .single();
        if (!before) {
          console.error("❌ User not found for manual credit fallback");
          return NextResponse.json(
            { error: "User not found" },
            { status: 500 }
          );
        }
        const newBal = Number(before.wallet_balance) + netCredit;
        const { error: uiErr } = await supabase
          .from("users")
          .update({ wallet_balance: newBal })
          .eq("id", userId);
        if (uiErr) {
          console.error("❌ Manual wallet update failed:", uiErr);
          return NextResponse.json(
            { error: "Failed to credit wallet" },
            { status: 500 }
          );
        }
      }

      console.log(
        `✅ Auto-created transaction and credited user ${userId} with ₦${netCredit}`
      );
      return NextResponse.json({ success: true }, { status: 200 });
    } // end deposit handling
    
    // ---------- WITHDRAWAL / TRANSFER (OUTGOING) ----------
    if (isPayoutOrTransfer) {
      console.log("➡️ Handling payout/transfer flow");

      // Try to find matching tx by merchant_tx_ref or reference or transactionId
      const refCandidates = [merchantTxRef, nombaTransactionId].filter(Boolean);
      console.log("🔎 Searching transaction by candidates:", refCandidates);

      const orExprParts = refCandidates
        .map((r) => `merchant_tx_ref.eq.${r}`)
        .concat(refCandidates.map((r) => `reference.eq.${r}`));
      const orExpr = orExprParts.join(",");

      const { data: pendingTx, error: pendingErr } = await supabase
        .from("transactions")
        .select("*")
        .or(orExpr)
        .maybeSingle();

      if (pendingErr) {
        console.error(
          "❌ DB error while finding pending transaction:",
          pendingErr
        );
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      if (!pendingTx) {
        console.warn(
          "⚠️ No matching pending withdrawal found for refs:",
          refCandidates
        );
        return NextResponse.json(
          { message: "No matching withdrawal transaction" },
          { status: 200 }
        );
      }

      console.log(
        "📦 Found pending withdrawal:",
        pendingTx.id,
        "status:",
        pendingTx.status
      );

      // Idempotency: skip if already processed
      if (pendingTx.status === "success") {
        console.log("⚠️ Withdrawal already marked success. Skipping.");
        return NextResponse.json(
          { message: "Already processed" },
          { status: 200 }
        );
      }
      if (pendingTx.status === "failed") {
        console.log("⚠️ Withdrawal already marked failed. Skipping.");
        return NextResponse.json(
          { message: "Already failed" },
          { status: 200 }
        );
      }

      // Compute amounts: user pays amount + fee
      const fee = safeNum(pendingTx.fee ?? feeFromNomba);
      const amount = safeNum(pendingTx.amount ?? transactionAmount);
      const totalDeduction = Number((amount + fee).toFixed(2));

      // Success case
      if (eventType === "payout_success" || txStatus === "success") {
        console.log(
          "✅ Payout success. Attempting to mark transaction and debit wallet."
        );

        // Use RPC to update wallet and mark transaction atomically
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc(
            "decrement_wallet_balance",
            {
              user_id: pendingTx.user_id,
              ref: nombaTransactionId,
              amt: totalDeduction,
              description: `(webhook payout)`,
            }
          );

          if (rpcErr) {
            console.error("❌ RPC decrement_wallet_balance failed:", rpcErr);
            return NextResponse.json(
              { error: "Failed to debit wallet" },
              { status: 500 }
            );
          }

          console.log(
            `✅ Withdrawal processed and debited ₦${totalDeduction} for user ${pendingTx.user_id}`
          );
          return NextResponse.json({ success: true }, { status: 200 });
        } catch (ex) {
          console.error("🔥 RPC threw an error:", ex);
          return NextResponse.json(
            { error: "Failed to debit wallet" },
            { status: 500 }
          );
        }
      }

      // Failure case: payout_failed
      if (eventType === "payout_failed" || txStatus === "failed") {
        console.log(
          "❌ Payout failed. Marking failed and attempting refund if needed."
        );

        await supabase
          .from("transactions")
          .update({
            status: "failed",
            reference: nombaTransactionId || pendingTx.reference,
            external_response: payload,
          })
          .eq("id", pendingTx.id);

        console.log("✅ Payout failed recorded.");
        return NextResponse.json({ refunded: true }, { status: 200 });
      }

      console.log("ℹ️ Unhandled transfer event/status. Ignoring.");
      return NextResponse.json(
        { message: "Ignored transfer event" },
        { status: 200 }
      );
    }

    // If we reach here, event type not handled specifically
    console.log("ℹ️ Event type not matched. Ignoring.");
    return NextResponse.json({ message: "Ignored event" }, { status: 200 });
  } catch (err: any) {
    console.error("🔥 Webhook processing error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
