// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

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

      // ✅ --- Handle Subscriptions (Card Payments Only) ---
      if (isCardPayment) {
        try {
          // Fetch payment row (idempotency & metadata)
          const { data: paymentRow, error: paymentFetchErr } = await supabase
            .from("payments")
            .select("*")
            .eq("payment_reference", orderReference)
            .maybeSingle();

          // If we didn't find metadata by orderReference, try to find a payments row by other identifiers (best-effort)
          if (paymentFetchErr) {
            console.warn("⚠️ payments lookup error:", paymentFetchErr);
          }

          // Derive metadata values (prefer stored payments.metadata when present)
          const metaFromPayments = paymentRow?.metadata ?? {};
          const subEmail = payload.data?.order?.customerEmail;
          const subFullName =
            metaFromPayments?.fullName ??
            metaFromPayments?.full_name ??
            "Anonymous User";
          const subPlanId = payload.data?.order?.metadata?.planId;
          const metaAmount =
            metaFromPayments?.amount ?? metaFromPayments?.amt ?? null;
          const subAmount =
            metaAmount ??
            payload?.data?.transaction?.transactionAmount ??
            transactionAmount ??
            0;

          // Ensure payments row gets provider_event_id + raw_payload + status (update or insert if needed)
          // Use the Nomba transaction id as provider_event_id when available
          const providerEventId =
            nombaTransactionId ||
            payload?.data?.transaction?.transactionId ||
            null;
          if (paymentRow) {
            await supabase
              .from("payments")
              .update({
                provider_event_id: providerEventId,
                raw_payload: payload,
                status: "successful",
                amount: paymentRow.amount ?? subAmount,
              })
              .eq("id", paymentRow.id);
          } else {
            // create a payments row if none exists (best-effort)
            await supabase.from("payments").insert([
              {
                payment_reference: orderReference,
                provider: "nomba",
                provider_event_id: providerEventId,
                amount: subAmount,
                currency: payload?.data?.order?.currency ?? "NGN",
                status: "successful",
                metadata: {
                  email: subEmail,
                  fullName: subFullName,
                  planId: subPlanId,
                  amount: subAmount,
                },
                raw_payload: payload,
              },
            ]);
          }

          // If required metadata missing, log and skip subscription insert
          if (!subEmail || !subPlanId) {
            console.warn(
              "⚠️ Subscription metadata incomplete — email or planId missing; skipping subscriber insert.",
              {
                subEmail,
                subPlanId,
                orderReference,
              }
            );
          } else {
            // Idempotency check: subscriber already exists for same payment_reference OR same email+plan
            const { data: existingSub } = await supabase
              .from("subscribers")
              .select("*")
              .or(
                `payment_reference.eq.${orderReference},(email.eq.${subEmail},plan_id.eq.${subPlanId})`
              )
              .maybeSingle();

            if (existingSub) {
              console.log(
                "⚠️ Subscriber or payment already exists. Skipping subscription insert.",
                {
                  existingSubId: existingSub.id,
                  payment_reference: existingSub.payment_reference,
                  email: existingSub.email,
                  plan_id: existingSub.plan_id,
                }
              );

              // Make sure existing subscriber status is updated to success if this webhook indicates success
              if (existingSub.payment_status !== "success") {
                await supabase
                  .from("subscribers")
                  .update({
                    payment_status: "success",
                    payment_reference: orderReference,
                    subscription_expires_at:
                      existingSub.subscription_expires_at || null,
                  })
                  .eq("id", existingSub.id);
              }
            } else {
              // Compute expiry: plan-based. For `basic` -> 30 days. Default 30 days.
              let expiresAt = null;
              const now = new Date();
              if (subPlanId === "basic") {
                expiresAt = new Date(
                  now.getTime() + 30 * 24 * 60 * 60 * 1000
                ).toISOString();
              } else {
                // default 30 days if unknown; you can extend logic per plan
                expiresAt = new Date(
                  now.getTime() + 30 * 24 * 60 * 60 * 1000
                ).toISOString();
              }

              // Insert subscriber row — do NOT credit wallet
              const { error: insertSubErr } = await supabase
                .from("subscribers")
                .insert([
                  {
                    email: subEmail,
                    full_name: subFullName,
                    plan_id: subPlanId,
                    amount: subAmount,
                    payment_reference: orderReference,
                    payment_status: "success",
                    subscription_expires_at: expiresAt,
                    anon_token: paymentRow?.metadata?.anonToken ?? null,
                    created_at: new Date().toISOString(),
                  },
                ]);

              if (insertSubErr) {
                console.error("❌ Failed to insert subscriber:", insertSubErr);
              } else {
                console.log(
                  "✅ Subscriber created:",
                  subEmail,
                  subPlanId,
                  "expiresAt:",
                  expiresAt
                );
              }
            }
          }

          // Send confirmation email (best-effort)
          if (subEmail) {
            try {
              await fetch(`${baseUrl}/api/send-subscription-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: subEmail,
                  subject: "Subscription Payment Successful ✅",
                  message: `
              <p>Hello ${subFullName || "Subscriber"},</p>
              <p>We received your payment of <strong>₦${subAmount}</strong> for plan <strong>${subPlanId}</strong>.</p>
              <p>Reference: <strong>${orderReference}</strong></p>
              <p>Your subscription is now active.</p>
              <p>Thank you 🎉</p>
            `,
                }),
              });
              console.log(
                "📨 Subscription confirmation email attempted for:",
                subEmail
              );
            } catch (emailErr) {
              console.error("❌ Failed sending subscription email:", emailErr);
            }
          }
        } catch (subErr) {
          console.error("❌ Subscription handling error:", subErr);
        }
      }

      const fee = feeFromNomba;
      const netCredit = Number((amount - fee).toFixed(2));
      const total_deduction = Number((amount - fee).toFixed(2)); // for deposit, store net as total_deduction for consistency

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
        // We can decide to create a record, but safer is to log and ignore to avoid debiting wrong user.
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

      const { error: updateErr } = await supabase
        .from("transactions")
        .update({
          status: "success",
          reference: nombaTransactionId,
          external_response: payload,
        })
        .eq("id", pendingTx.id);

      if (updateErr) {
        console.error(
          "❌ Failed to update withdrawal status to success:",
          updateErr
        );
      } else {
        console.log(
          "✅ Withdrawal status updated to success for transaction:",
          pendingTx.id
        );
      }

      // Idempotency
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
          "✅ Payout success. Attempting to mark transaction and deduct wallet."
        );

        // Update transaction status & reference
        const { data, error: updErr } = await supabase
          .from("transactions")
          .update({
            status: "success",
            amount,
            fee,
            total_deduction: totalDeduction,
            reference: nombaTransactionId,
            external_response: payload,
          })
          .eq("id", pendingTx.id);

        // console.log("transactions data", data);

        if (updErr) {
          return NextResponse.json(
            { error: "Failed to update transaction" },
            { status: 500 }
          );
        }

        // Try RPC decrement_wallet_balance if you have it
        let decremented = false;
        try {
          const { error: rpcErr } = await supabase.rpc(
            "decrement_wallet_balance",
            {
              user_id: pendingTx.user_id,
              amt: totalDeduction,
            }
          );
          if (!rpcErr) {
            decremented = true;
            console.log("✅ Wallet decremented via RPC");
          } else {
            console.warn(
              "⚠️ decrement_wallet_balance rpc returned error, falling back:",
              rpcErr
            );
          }
        } catch (rpcEx) {
          console.warn(
            "⚠️ decrement_wallet_balance rpc threw, falling back:",
            rpcEx
          );
        }

        if (!decremented) {
          // Fallback: manual safe decrement: check balance then update
          const { data: userRow } = await supabase
            .from("users")
            .select("wallet_balance")
            .eq("id", pendingTx.user_id)
            .single();

          if (!userRow) {
            console.error("❌ User not found for debit fallback");
            // mark tx failed and return
            await supabase
              .from("transactions")
              .update({ status: "failed", external_response: payload })
              .eq("id", pendingTx.id);
            return NextResponse.json(
              { error: "User not found" },
              { status: 500 }
            );
          }

          const currentBal = Number(userRow.wallet_balance ?? 0);
          console.log(
            "🔎 User current balance:",
            currentBal,
            "needed:",
            totalDeduction
          );

          if (currentBal < totalDeduction) {
            console.error(
              "❌ Insufficient balance at payout confirmation time. Marking failed and NOT debiting."
            );
            // mark tx failed
            await supabase
              .from("transactions")
              .update({ status: "failed", external_response: payload })
              .eq("id", pendingTx.id);
            return NextResponse.json(
              { error: "Insufficient balance", status: 400 },
              { status: 200 }
            );
          }

          const { error: userUpdErr } = await supabase
            .from("users")
            .update({ wallet_balance: currentBal - totalDeduction })
            .eq("id", pendingTx.user_id);

          if (userUpdErr) {
            console.error(
              "❌ Failed to update user balance in fallback:",
              userUpdErr
            );
            // try to mark transaction failed
            await supabase
              .from("transactions")
              .update({ status: "failed", external_response: payload })
              .eq("id", pendingTx.id);
            return NextResponse.json(
              { error: "Failed to debit wallet" },
              { status: 500 }
            );
          }

          console.log("✅ Wallet decremented via manual fallback");
        }

        // Record fee tx (non-blocking)
        // const { error: feeTxErr } = await supabase.from("transactions").insert({
        //   user_id: pendingTx.user_id,
        //   type: "fee",
        //   amount: fee,
        //   status: "success",
        //   description: `Withdrawal fee for ₦${amount}`,
        //   merchant_tx_ref: `FEE_${
        //     pendingTx.merchant_tx_ref || pendingTx.reference
        //   }`,
        // });

        // if (feeTxErr) {
        //   console.warn("⚠️ Failed to record fee transaction:", feeTxErr);
        // }

        console.log(
          `✅ Withdrawal processed and debited ₦${totalDeduction} for user ${pendingTx.user_id}`
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Failure case: payout_failed
      if (eventType === "payout_failed" || txStatus === "failed") {
        console.log(
          "❌ Payout failed. Marking failed and refunding if necessary."
        );

        // mark transaction failed and save payload
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            external_response: payload,
            reference: nombaTransactionId || pendingTx.reference,
          })
          .eq("id", pendingTx.id);

        // If the user's wallet was already decremented earlier (older logic), refund.
        // We'll heuristically check for fee tx or check if user's balance looks like it was decremented.
        // Best approach: if you deducted earlier, you should have inserted a fee tx or changed status->success.
        // We'll attempt a safe refund via RPC (idempotent if rpc handles it).
        try {
          const { error: rpcErr } = await supabase.rpc(
            "increment_wallet_balance",
            {
              user_id: pendingTx.user_id,
              amt: Number(pendingTx.total_deduction ?? pendingTx.amount ?? 0),
            }
          );
          if (rpcErr) {
            console.warn("⚠️ RPC refund failed:", rpcErr);
            // fallback manual refund
            const { data: u } = await supabase
              .from("users")
              .select("wallet_balance")
              .eq("id", pendingTx.user_id)
              .single();

            if (u) {
              const newBal =
                Number(u.wallet_balance ?? 0) +
                Number(pendingTx.total_deduction ?? pendingTx.amount ?? 0);
              await supabase
                .from("users")
                .update({ wallet_balance: newBal })
                .eq("id", pendingTx.user_id);
            }
          } else {
            console.log("✅ Refund processed via RPC");
          }
        } catch (rEx) {
          console.warn(
            "⚠️ Refund RPC threw error, attempted manual refund",
            rEx
          );
        }

        console.log(
          "✅ Payout failed processed and refund attempted if needed"
        );
        return NextResponse.json({ refunded: true }, { status: 200 });
      }

      // Unhandled statuses for transfer
      console.log("ℹ️ Unhandled transfer event/status. Ignoring.");
      return NextResponse.json(
        { message: "Ignored transfer event" },
        { status: 200 }
      );
    } // end payout handling

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
