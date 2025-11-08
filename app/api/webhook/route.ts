// // app/api/webhook/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createHmac, timingSafeEqual } from "crypto";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// const baseUrl =
//   process.env.NODE_ENV === "development"
//     ? process.env.NEXT_PUBLIC_DEV_URL
//     : process.env.NEXT_PUBLIC_BASE_URL;

// const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

// function safeNum(v: any) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : 0;
// }

// export async function POST(req: NextRequest) {
//   try {
//     console.log("====== Nomba Webhook Triggered ======");

//     // 1) Read raw body and parse
//     const rawBody = await req.text();
//     console.log("🔸 Raw body length:", rawBody?.length);
//     let payload: any;
//     try {
//       payload = JSON.parse(rawBody);
//       console.log("payload", payload);
//     } catch (err) {
//       console.error("❌ Failed to parse JSON body", err);
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }
//     console.log(
//       "🟢 Parsed payload.event_type:",
//       payload?.event_type || payload?.eventType
//     );

//     // 2) Signature verification (HMAC SHA256 -> Base64)
//     const timestamp = req.headers.get("nomba-timestamp");
//     const signature =
//       req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

//     if (!timestamp || !signature) {
//       console.warn("❗ Missing Nomba signature headers. Headers:", {
//         "nomba-timestamp": timestamp,
//         "nomba-sig-value": signature,
//       });
//       return NextResponse.json(
//         { error: "Missing signature headers" },
//         { status: 401 }
//       );
//     }

//     // Build hash payload according to Nomba docs (use safe optional chaining)
//     const hashingPayload = `${payload.event_type}:${payload.requestId}:${
//       payload.data?.merchant?.userId || ""
//     }:${payload.data?.merchant?.walletId || ""}:${
//       payload.data?.transaction?.transactionId || ""
//     }:${payload.data?.transaction?.type || ""}:${
//       payload.data?.transaction?.time || ""
//     }:${payload.data?.transaction?.responseCode || ""}`;
//     const message = `${hashingPayload}:${timestamp}`;

//     const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
//     hmac.update(message);
//     const expectedSignature = hmac.digest("base64");

//     // Timing-safe compare
//     const receivedBuffer = Buffer.from(signature, "base64");
//     const expectedBuffer = Buffer.from(expectedSignature, "base64");

//     console.log("🔐 Signature verification: received:", signature);
//     console.log("🔐 Signature verification: expected:", expectedSignature);
//     console.log(
//       "🔐 Same length?:",
//       receivedBuffer.length === expectedBuffer.length
//     );

//     if (
//       receivedBuffer.length !== expectedBuffer.length ||
//       !timingSafeEqual(receivedBuffer, expectedBuffer)
//     ) {
//       console.error("❌ Invalid signature - aborting webhook");
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }
//     console.log("✅ Signature verified");

//     // 3) Normalize fields
//     const eventType: string = payload.event_type || payload.eventType;
//     const tx = payload.data?.transaction || payload.data?.txn || {};
//     const order = payload.data?.order || null;

//     // try several fields for IDs / refs
//     const nombaTransactionId =
//       tx.transactionId || tx.transaction_id || tx.id || tx.reference || null;
//     const merchantTxRef =
//       tx.merchantTxRef ||
//       tx.merchant_tx_ref ||
//       payload.data?.meta?.merchantTxRef ||
//       null;
//     const orderReference =
//       order?.orderReference || order?.order_reference || null;
//     const aliasAccountReference =
//       tx.aliasAccountReference ||
//       tx.alias_account_reference ||
//       tx.aliasAccount ||
//       null;
//     const transactionAmount = safeNum(
//       tx.transactionAmount ?? tx.amount ?? order?.amount ?? 0
//     );
//     const feeFromNomba = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
//     const txStatusRaw = (tx.status || payload.data?.status || "").toString();
//     const txStatus = txStatusRaw.toLowerCase();

//     console.log("🔎 eventType:", eventType);
//     console.log("🔎 txType:", tx.type || tx.transactionType || "unknown");
//     console.log("🔎 nombaTransactionId:", nombaTransactionId);
//     console.log("🔎 merchantTxRef:", merchantTxRef);
//     console.log("🔎 orderReference:", orderReference);
//     console.log("🔎 aliasAccountReference:", aliasAccountReference);
//     console.log(
//       "🔎 transactionAmount:",
//       transactionAmount,
//       "fee:",
//       feeFromNomba,
//       "txStatus:",
//       txStatus
//     );

//     // 4) Decide which flow this is:
//     // - Card payment -> payment_success with order.orderReference (card_deposit)
//     // - Virtual account deposit -> payment_success or vact_transfer with aliasAccountReference
//     // - Outgoing transfer (withdrawal) -> payout_success/payout_failed or transfer with merchantTxRef/transactionId
//     const isCardPayment = Boolean(orderReference);
//     const isVirtualAccountDeposit = Boolean(aliasAccountReference);
//     const isPayoutOrTransfer =
//       Boolean(merchantTxRef) ||
//       (tx.type && tx.type.toLowerCase().includes("transfer")) ||
//       eventType?.toLowerCase()?.includes("payout");

//     // ---------- DEPOSIT: CARD (orderReference) OR VA ----------
//     if (
//       eventType === "payment_success" ||
//       eventType === "payment.succeeded" ||
//       isCardPayment ||
//       isVirtualAccountDeposit
//     ) {
//       // -------------------- SUBSCRIPTION HANDLING --------------------
//       // ✅ Only handle card payments with subscription references (SUB-)
//       try {
//         if (isCardPayment && orderReference?.includes("SUB-")) {
//           // Extract email, full name, plan, and amount from payload
//           const subEmail =
//             payload.data?.order?.customerEmail ||
//             payload.data?.customer?.customerEmail ||
//             null;

//           const subFullName =
//             payload.data?.order?.fullName ||
//             payload.data?.customer?.fullName ||
//             "Subscriber";

//           const subPlanId =
//             payload.data?.order?.metadata?.planId ||
//             payload.data?.meta?.planId ||
//             "basic";

//           const subAmount =
//             safeNum(payload.data?.transaction?.transactionAmount) ||
//             safeNum(payload.data?.order?.amount) ||
//             0;

//           const paymentReference = orderReference;

//           if (subEmail && subPlanId && paymentReference) {
//             // Idempotent: check existing subscriber
//             const { data: existingSub } = await supabase
//               .from("subscribers")
//               .select("*")
//               .or(
//                 `payment_reference.eq.${paymentReference},(email.eq.${subEmail},plan_id.eq.${subPlanId})`
//               )
//               .maybeSingle();

//             const now = new Date();
//             const expiresAt = new Date(
//               now.getTime() + 30 * 24 * 60 * 60 * 1000
//             ); // 30 days

//             if (existingSub) {
//               await supabase
//                 .from("subscribers")
//                 .update({
//                   payment_status: "success",
//                   subscription_expires_at: expiresAt.toISOString(),
//                 })
//                 .eq("id", existingSub.id);

//               console.log(
//                 `⚠️ Subscriber exists, updated expiry for ${subEmail}`
//               );
//             } else {
//               await supabase.from("subscribers").insert([
//                 {
//                   email: subEmail,
//                   full_name: subFullName,
//                   plan_id: subPlanId,
//                   amount: subAmount,
//                   payment_reference: paymentReference,
//                   payment_status: "success",
//                   subscription_expires_at: expiresAt.toISOString(),
//                   created_at: now.toISOString(),
//                 },
//               ]);

//               console.log(
//                 `✅ Subscriber created: ${subEmail}, expiresAt: ${expiresAt.toDateString()}`
//               );
//             }

//             // Send subscription confirmation email
//             try {
//               await fetch(`${baseUrl}/api/send-subscription-email`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                   to: subEmail,
//                   subject: "Subscription Payment Successful ✅",
//                   message: `
//           <p>Hello ${subFullName},</p>
//           <p>We received your payment of <strong>₦${subAmount}</strong> for your subscription.</p>
//           <p>Your subscription is now active and will expire on <strong>${expiresAt.toDateString()}</strong>.</p>
//           <p>Reference: <strong>${paymentReference}</strong></p>
//           <p>Thank you 🎉</p>
//         `,
//                 }),
//               });
//               console.log(
//                 `📨 Subscription confirmation email sent to ${subEmail}`
//               );
//             } catch (emailErr) {
//               console.error("❌ Failed sending subscription email:", emailErr);
//             }

//             // ✅ IMPORTANT: stop further processing for subscription
//             return NextResponse.json(
//               { success: true, message: "Subscription processed" },
//               { status: 200 }
//             );
//           } else {
//             console.warn(
//               "⚠️ Subscription metadata incomplete — skipping insert/update/email"
//             );
//           }
//         }
//       } catch (subErr) {
//         console.error("❌ Subscription handling error:", subErr);
//       }
//       // -------------------- END SUBSCRIPTION HANDLING --------------------

//       // DETERMINE userId & reference for transaction
//       let userId: string | null = null;
//       let referenceToUse: string | null =
//         orderReference || nombaTransactionId || tx.sessionId || null;
//       let txType = isCardPayment ? "card_deposit" : "deposit";
//       let channel = isCardPayment ? "card" : "bank";

//       console.log(
//         "➡️ Handling deposit/card flow. txType:",
//         txType,
//         "channel:",
//         channel
//       );

//       // For VA: aliasAccountReference === userId (you confirmed)
//       if (isVirtualAccountDeposit) {
//         userId = aliasAccountReference;
//         // for VA there may not be an orderReference; use transactionId as merchant_tx_ref
//         referenceToUse =
//           nombaTransactionId || tx.sessionId || `nomba-${Date.now()}`;
//       } else if (isCardPayment) {
//         // Card: find the pending transaction inserted at initialize step using orderReference
//         referenceToUse = orderReference;
//         // find transaction row to get userId
//         const { data: pendingByRef, error: refErr } = await supabase
//           .from("transactions")
//           .select("*")
//           .eq("reference", referenceToUse)
//           .maybeSingle();

//         if (refErr) {
//           console.error("❌ Supabase error finding orderReference:", refErr);
//           return NextResponse.json({ error: "DB error" }, { status: 500 });
//         }

//         if (pendingByRef) {
//           userId = pendingByRef.user_id;
//         } else {
//           // fallback: try to find user by customerEmail if present
//           const customerEmail =
//             order?.customerEmail ||
//             payload.data?.customer?.customerEmail ||
//             null;
//           if (customerEmail) {
//             const { data: userByEmail } = await supabase
//               .from("users")
//               .select("id")
//               .eq("email", customerEmail)
//               .maybeSingle();
//             userId = userByEmail?.id || null;
//           }
//         }
//       }

//       if (!userId) {
//         console.warn(
//           "⚠️ Could not determine userId for deposit. referenceToUse:",
//           referenceToUse
//         );
//         // Best effort: if aliasAccountReference exists but not stored in users table, create transaction referencing alias as userId (you said alias === userId)
//         if (aliasAccountReference) {
//           userId = aliasAccountReference;
//         } else {
//           // Nothing we can do reliably
//           return NextResponse.json(
//             { message: "No user to credit" },
//             { status: 200 }
//           );
//         }
//       }

//       console.log(
//         "👤 Deposit userId resolved:",
//         userId,
//         "referenceToUse:",
//         referenceToUse
//       );

//       // Compute amounts
//       const amount = transactionAmount;

//       const fee = feeFromNomba;
//       const netCredit = Number((amount - fee).toFixed(2));
//       const total_deduction = Number((amount - fee).toFixed(2)); // for deposit, store net as total_deduction for consistency

//       // Idempotency: check existing transaction by reference or merchant_tx_ref
//       const { data: existingTx, error: existingErr } = await supabase
//         .from("transactions")
//         .select("*")
//         .or(
//           `reference.eq.${referenceToUse},merchant_tx_ref.eq.${nombaTransactionId}`
//         )
//         .maybeSingle();

//       if (existingErr) {
//         console.error("❌ Error checking existing transaction:", existingErr);
//         return NextResponse.json({ error: "DB error" }, { status: 500 });
//       }

//       // ✅ Already successfully processed
//       if (existingTx && existingTx.status === "success") {
//         console.log(
//           "⚠️ Deposit already processed (idempotent). Skipping credit."
//         );
//         return NextResponse.json(
//           { message: "Already processed" },
//           { status: 200 }
//         );
//       }

//       // 🔁 Existing pending tx: mark success and credit
//       if (existingTx) {
//         console.log(
//           "🔁 Found existing transaction. Updating to success and crediting user."
//         );
//         const { error: updErr } = await supabase
//           .from("transactions")
//           .update({
//             status: "success",
//             amount,
//             fee,
//             total_deduction,
//             merchant_tx_ref: nombaTransactionId,
//             external_response: payload,
//             channel,
//           })
//           .eq("id", existingTx.id);

//         if (updErr) {
//           console.error("❌ Failed to update existing transaction:", updErr);
//           return NextResponse.json(
//             { error: "Failed to update transaction" },
//             { status: 500 }
//           );
//         }

//         // Credit wallet atomically using RPC
//         const { error: rpcErr } = await supabase.rpc(
//           "increment_wallet_balance",
//           {
//             user_id: existingTx.user_id,
//             amt: netCredit,
//           }
//         );

//         if (rpcErr) {
//           console.error("❌ RPC increment_wallet_balance failed:", rpcErr);
//           // fallback manual credit
//           const { data: before } = await supabase
//             .from("users")
//             .select("wallet_balance")
//             .eq("id", existingTx.user_id)
//             .single();

//           if (!before) {
//             console.error("❌ User not found for manual credit fallback");
//             return NextResponse.json(
//               { error: "User not found" },
//               { status: 500 }
//             );
//           }

//           const newBal = Number(before.wallet_balance) + netCredit;
//           const { error: updUserErr } = await supabase
//             .from("users")
//             .update({ wallet_balance: newBal })
//             .eq("id", existingTx.user_id);

//           if (updUserErr) {
//             console.error("❌ Manual wallet update failed:", updUserErr);
//             return NextResponse.json(
//               { error: "Failed to credit wallet" },
//               { status: 500 }
//             );
//           }
//         }

//         console.log(
//           `✅ Credited user ${existingTx.user_id} with ₦${netCredit} (existing tx updated)`
//         );
//         return NextResponse.json({ success: true }, { status: 200 });
//       }
//       // No existing tx: create and credit (auto-create best-effort)
//       console.log(
//         "➕ No existing tx — creating transaction and crediting user now (auto-create)."
//       );
//       const { error: insertErr } = await supabase.from("transactions").insert([
//         {
//           user_id: userId,
//           type: txType === "card_deposit" ? "card_deposit" : "deposit",
//           amount,
//           fee,
//           total_deduction,
//           status: "success",
//           reference: referenceToUse,
//           merchant_tx_ref: nombaTransactionId,
//           description:
//             txType === "card_deposit" ? "Card deposit" : "Bank deposit",
//           external_response: payload,
//           channel: txType === "card_deposit" ? "card" : "bank",
//         },
//       ]);

//       if (insertErr) {
//         // if duplicate (unique constraint) — treat as processed
//         if (insertErr.code === "23505") {
//           console.warn(
//             "⚠️ Duplicate insert prevented. Treating as already processed."
//           );
//           return NextResponse.json(
//             { message: "Duplicate ignored" },
//             { status: 200 }
//           );
//         }
//         console.error("❌ Failed to insert new transaction:", insertErr);
//         return NextResponse.json(
//           { error: "Failed to record transaction" },
//           { status: 500 }
//         );
//       }

//       // credit via RPC
//       const { error: rpcErr2 } = await supabase.rpc(
//         "increment_wallet_balance",
//         {
//           user_id: userId,
//           amt: netCredit,
//         }
//       );
//       if (rpcErr2) {
//         console.error("❌ RPC increment failed (after insert):", rpcErr2);
//         // fallback manual
//         const { data: before } = await supabase
//           .from("users")
//           .select("wallet_balance")
//           .eq("id", userId)
//           .single();
//         if (!before) {
//           console.error("❌ User not found for manual credit fallback");
//           return NextResponse.json(
//             { error: "User not found" },
//             { status: 500 }
//           );
//         }
//         const newBal = Number(before.wallet_balance) + netCredit;
//         const { error: uiErr } = await supabase
//           .from("users")
//           .update({ wallet_balance: newBal })
//           .eq("id", userId);
//         if (uiErr) {
//           console.error("❌ Manual wallet update failed:", uiErr);
//           return NextResponse.json(
//             { error: "Failed to credit wallet" },
//             { status: 500 }
//           );
//         }
//       }

//       console.log(
//         `✅ Auto-created transaction and credited user ${userId} with ₦${netCredit}`
//       );
//       return NextResponse.json({ success: true }, { status: 200 });
//     } // end deposit handling

//     // ---------- WITHDRAWAL / TRANSFER (OUTGOING) ----------
// if (isPayoutOrTransfer) {
//   console.log("➡️ Handling payout/transfer flow");

//   const refCandidates = [merchantTxRef, nombaTransactionId].filter(Boolean);
//   console.log("🔎 Searching transaction by candidates:", refCandidates);

//   const orExprParts = refCandidates
//     .map((r) => `merchant_tx_ref.eq.${r}`)
//     .concat(refCandidates.map((r) => `reference.eq.${r}`));
//   const orExpr = orExprParts.join(",");

//   const { data: pendingTx, error: pendingErr } = await supabase
//     .from("transactions")
//     .select("*")
//     .or(orExpr)
//     .maybeSingle();

//   if (pendingErr) {
//     console.error("❌ DB error while finding pending transaction:", pendingErr);
//     return NextResponse.json({ error: "DB error" }, { status: 500 });
//   }

//   if (!pendingTx) {
//     console.warn("⚠️ No matching pending withdrawal found for refs:", refCandidates);
//     return NextResponse.json(
//       { message: "No matching withdrawal transaction" },
//       { status: 200 }
//     );
//   }

//   console.log("📦 Found pending withdrawal:", pendingTx.id, "status:", pendingTx.status);

//   // Idempotency
//   if (["success", "failed"].includes(pendingTx.status)) {
//     console.log(`⚠️ Withdrawal already ${pendingTx.status}. Skipping.`);
//     return NextResponse.json({ message: "Already processed" }, { status: 200 });
//   }

//   const fee = safeNum(pendingTx.fee ?? feeFromNomba);
//   const amount = safeNum(pendingTx.amount ?? transactionAmount);
//   const totalDeduction = Number((amount + fee).toFixed(2));

//   // ✅ Success case
//   if (eventType === "payout_success" || txStatus === "success") {
//     console.log("✅ Payout success. Deducting wallet via RPC...");

//     // Call the new deduct_wallet_balance RPC
//     const reference = nombaTransactionId || crypto.randomUUID();
//     const { data: rpcData, error: rpcError } = await supabase.rpc(
//       "deduct_wallet_balance",
//       {
//         user_id: pendingTx.user_id,
//         amt: totalDeduction,
//         transaction_type: "debit",
//         reference,
//         description: `Withdrawal of ₦${amount} (including ₦${fee} fee)`,
//       }
//     );

//     if (rpcError) {
//       console.error("❌ RPC deduct_wallet_balance failed:", rpcError.message);
//       // Mark transaction failed
//       await supabase
//         .from("transactions")
//         .update({ status: "failed", external_response: payload })
//         .eq("id", pendingTx.id);
//       return NextResponse.json(
//         { error: "Wallet deduction failed via RPC" },
//         { status: 500 }
//       );
//     }

//     const rpcResult = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : rpcData;

//     if (!rpcResult || rpcResult.status !== "OK") {
//       console.error("⚠️ RPC returned non-OK:", rpcResult);
//       await supabase
//         .from("transactions")
//         .update({ status: "failed", external_response: payload })
//         .eq("id", pendingTx.id);
//       return NextResponse.json(
//         { error: rpcResult?.status || "Deduction failed" },
//         { status: 400 }
//       );
//     }

//     // Update transaction with payout reference and success status
//     await supabase
//       .from("transactions")
//       .update({
//         status: "success",
//         reference,
//         external_response: payload,
//         total_deduction: totalDeduction,
//         fee,
//       })
//       .eq("id", pendingTx.id);

//     console.log(
//       `✅ Withdrawal processed successfully. ₦${totalDeduction} deducted for user ${pendingTx.user_id}`
//     );

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Withdrawal processed successfully",
//         newWalletBalance: rpcResult.balance || rpcResult.new_balance,
//       },
//       { status: 200 }
//     );
//   }

//   // ❌ Failure case: payout_failed
//   if (eventType === "payout_failed" || txStatus === "failed") {
//     console.log("❌ Payout failed. Marking transaction failed and refunding if necessary.");

//     await supabase
//       .from("transactions")
//       .update({
//         status: "failed",
//         external_response: payload,
//         reference: nombaTransactionId || pendingTx.reference,
//       })
//       .eq("id", pendingTx.id);

//     // Attempt safe refund via increment_wallet_balance RPC
//     try {
//       const { error: rpcErr } = await supabase.rpc("increment_wallet_balance", {
//         user_id: pendingTx.user_id,
//         amt: Number(pendingTx.total_deduction ?? pendingTx.amount ?? 0),
//       });

//       if (rpcErr) {
//         console.warn("⚠️ Refund RPC failed:", rpcErr);
//         const { data: u } = await supabase
//           .from("users")
//           .select("wallet_balance")
//           .eq("id", pendingTx.user_id)
//           .single();

//         if (u) {
//           const newBal =
//             Number(u.wallet_balance ?? 0) +
//             Number(pendingTx.total_deduction ?? pendingTx.amount ?? 0);
//           await supabase
//             .from("users")
//             .update({ wallet_balance: newBal })
//             .eq("id", pendingTx.user_id);
//         }
//       } else {
//         console.log("✅ Refund processed via RPC");
//       }
//     } catch (rEx) {
//       console.warn("⚠️ Refund RPC threw error, attempted manual refund", rEx);
//     }

//     console.log("✅ Payout failed processed and refund attempted if needed");
//     return NextResponse.json({ refunded: true }, { status: 200 });
//   }

//   console.log("ℹ️ Unhandled transfer event/status. Ignoring.");
//   return NextResponse.json({ message: "Ignored transfer event" }, { status: 200 });
// }

//     // If we reach here, event type not handled specifically
//     console.log("ℹ️ Event type not matched. Ignoring.");
//     return NextResponse.json({ message: "Ignored event" }, { status: 200 });
//   } catch (err: any) {
//     console.error("🔥 Webhook processing error:", err);
//     return NextResponse.json(
//       { error: err.message || "Server error" },
//       { status: 500 }
//     );
//   }
// }

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
    const nombaFee = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
    const txStatusRaw = (tx.status || payload.data?.status || "").toString();
    const txStatus = txStatusRaw.toLowerCase();
    const transactionType = (tx.type || "").toLowerCase();

    console.log("🔎 eventType:", eventType);
    console.log("🔎 txType:", transactionType);
    console.log("🔎 nombaTransactionId:", nombaTransactionId);
    console.log("🔎 merchantTxRef:", merchantTxRef);
    console.log("🔎 orderReference:", orderReference);
    console.log("🔎 aliasAccountReference:", aliasAccountReference);
    console.log(
      "🔎 transactionAmount:",
      transactionAmount,
      "nombaFee:",
      nombaFee,
      "txStatus:",
      txStatus
    );

    // 🚫 CRITICAL: IGNORE ALL SERVICE PURCHASES COMPLETELY - FIXED VERSION
    const serviceTypes = [
      "data",
      "airtime",
      "cable-tv",
      "electricity",
      "utility",
      "bill",
      "topup",
    ];
    const serviceRefPatterns = [
      "Data-",
      "Airtime-",
      "Cable-",
      "Electricity-",
      "Bill-",
      "Utility-",
      "Topup-",
      "AIRTIME-",
      "DATA-",
      "CABLE-",
      "ELECTRICITY-",
    ];

    const isServicePurchase =
      serviceTypes.some((service) => transactionType.includes(service)) ||
      serviceRefPatterns.some((pattern) => merchantTxRef?.includes(pattern));

    if (isServicePurchase) {
      console.log(
        "📱 Ignoring service purchase (data/airtime/cable/electricity/topup) - already handled by main API"
      );
      return NextResponse.json(
        { message: "Service purchase ignored - already processed by main API" },
        { status: 200 }
      );
    }

    // Also ignore ALL payout_success events for service purchases regardless of detection
    if (
      eventType.includes("payout_success") &&
      (transactionType.includes("topup") ||
        merchantTxRef?.includes("AIRTIME-") ||
        merchantTxRef?.includes("DATA-") ||
        merchantTxRef?.includes("Airtime-") ||
        merchantTxRef?.includes("Data-") ||
        transactionType.includes("airtime") ||
        transactionType.includes("data"))
    ) {
      console.log("📱 Ignoring service purchase payout event");
      return NextResponse.json(
        { message: "Service purchase payout event ignored" },
        { status: 200 }
      );
    }

    // 4) FIXED: Better logic to determine transaction flow
    console.log("🎯 Determining transaction flow type...");

    const isCardPayment = Boolean(orderReference);
    const isVirtualAccountDeposit = Boolean(aliasAccountReference);

    // FIX: Better detection for deposits vs withdrawals
    const isDepositEvent =
      eventType === "payment_success" ||
      eventType === "payment.succeeded" ||
      tx.type?.toLowerCase().includes("vact") ||
      tx.type?.toLowerCase().includes("deposit") ||
      isCardPayment ||
      isVirtualAccountDeposit;

    const isPayoutOrTransfer =
      (eventType?.toLowerCase()?.includes("payout") && !isServicePurchase) ||
      (Boolean(merchantTxRef) && !isServicePurchase) ||
      (tx.type &&
        tx.type.toLowerCase().includes("transfer") &&
        !tx.type.toLowerCase().includes("vact"));

    console.log("   - isCardPayment:", isCardPayment);
    console.log("   - isVirtualAccountDeposit:", isVirtualAccountDeposit);
    console.log("   - isDepositEvent:", isDepositEvent);
    console.log("   - isPayoutOrTransfer:", isPayoutOrTransfer);
    console.log("   - isServicePurchase:", isServicePurchase);

    // ---------- DEPOSIT: CARD (orderReference) OR VA ----------
    if (isDepositEvent) {
      console.log("💰 Processing DEPOSIT transaction...");

      // -------------------- SUBSCRIPTION HANDLING --------------------
      const isSubscription =
        orderReference?.includes("SUB-") ||
        payload?.data?.order?.metadata?.type === "subscription";

      if (isSubscription) {
        console.log("💰 Processing subscription payment...");

        const subscriptionId =
          payload?.data?.order?.metadata?.subscriptionId ||
          orderReference?.split("-")[1];

        if (eventType === "payment_success" || txStatus === "success") {
          // Update subscription status to active
          const { error: updateError } = await supabase
            .from("user_subscriptions")
            .update({
              status: "active",
            })
            .eq("id", subscriptionId);

          if (!updateError) {
            console.log(`✅ Subscription activated: ${subscriptionId}`);

            // Update user's subscription tier
            const planName = payload?.data?.order?.metadata?.planName;
            const userId = payload?.data?.order?.metadata?.userId;

            if (planName && userId) {
              await supabase
                .from("users")
                .update({
                  subscription_tier: planName
                    .toLowerCase()
                    .replace(/\s+/g, "_"),
                  subscription_expires_at: new Date(
                    new Date().getTime() + 30 * 24 * 60 * 60 * 1000
                  ).toISOString(),
                })
                .eq("id", userId);

              console.log(`✅ User ${userId} updated to ${planName} tier`);
            }

            // Send confirmation email
            const userEmail = payload?.data?.order?.customerEmail;
            if (userEmail) {
              try {
                await fetch(`${baseUrl}/api/send-email`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: userEmail,
                    subject: `🎉 Welcome to Zidwell ${planName}!`,
                    message: `
                <h2>Welcome to Zidwell ${planName}!</h2>
                <p>Your subscription has been successfully activated and you now have access to all premium features.</p>
                <p><strong>Plan:</strong> ${planName}</p>
                <p><strong>Status:</strong> Active</p>
                <p>Thank you for choosing Zidwell. We're excited to help you grow your business!</p>
                <br>
                <p>Best regards,<br>The Zidwell Team</p>
              `,
                  }),
                });
                console.log(
                  `📧 Subscription confirmation email sent to ${userEmail}`
                );
              } catch (emailError) {
                console.error("Failed to send subscription email:", emailError);
              }
            }
          } else {
            console.error("Failed to update subscription:", updateError);
          }
        } else if (eventType === "payment_failed" || txStatus === "failed") {
          // Update subscription status to failed
          await supabase
            .from("user_subscriptions")
            .update({
              status: "failed",
            })
            .eq("id", subscriptionId);

          console.log(`❌ Subscription payment failed: ${subscriptionId}`);
        }

        // Return early since subscription is handled
        return NextResponse.json({ success: true }, { status: 200 });
      }
      // -------------------- END SUBSCRIPTION HANDLING --------------------

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
        txType = "virtual_account_deposit";
        channel = "virtual_account";
        console.log("🏦 Virtual Account deposit detected");
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
          console.log("   - Using aliasAccountReference as userId:", userId);
        } else {
          // Nothing we can do reliably
          console.error("❌ No user to credit - aborting");
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

      // ✅ DEPOSIT FEE CALCULATIONS
      const amount = transactionAmount;

      // NO APP FEES FOR ANY PAYMENT METHOD
      let ourAppFee = 0;
      let totalFees = Number(nombaFee.toFixed(2));
      let netCredit = Number((amount - totalFees).toFixed(2));
      const total_deduction = amount;

      console.log("💰 Deposit calculations (NO CHARGES):");
      console.log("   - Amount:", amount);
      console.log("   - Nomba's fee:", nombaFee);
      console.log("   - Our app fee:", ourAppFee);
      console.log("   - Total fees:", totalFees);
      console.log("   - Net credit to user:", netCredit);

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
        // Store fee breakdown in external_response
        const updatedExternalResponse = {
          ...payload,
          fee_breakdown: {
            nomba_fee: nombaFee,
            total_fee: totalFees,
            profit_margin: Number((ourAppFee - nombaFee).toFixed(2)),
          },
        };

        const { error: updErr } = await supabase
          .from("transactions")
          .update({
            status: "success",
            amount,
            fee: totalFees,
            total_deduction,
            merchant_tx_ref: nombaTransactionId,
            external_response: updatedExternalResponse,
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
      // Store fee breakdown in external_response
      const updatedExternalResponse = {
        ...payload,
        fee_breakdown: {
          nomba_fee: nombaFee,
          app_fee: ourAppFee,
          total_fee: totalFees,
          profit_margin: Number((ourAppFee - nombaFee).toFixed(2)),
        },
      };

      const { error: insertErr } = await supabase.from("transactions").insert([
        {
          user_id: userId,
          type: txType,
          amount,
          fee: totalFees,
          total_deduction,
          status: "success",
          reference: referenceToUse,
          merchant_tx_ref: nombaTransactionId,
          description:
            txType === "card_deposit"
              ? "Card deposit"
              : txType === "virtual_account_deposit"
              ? "Virtual Account deposit"
              : "Bank deposit",
          external_response: updatedExternalResponse,
          channel: channel,
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

      const refCandidates = [merchantTxRef, nombaTransactionId].filter(Boolean);
      console.log("🔎 Searching transaction by candidates:", refCandidates);

      const orExprParts = refCandidates
        .map((r) => `merchant_tx_ref.eq.${r}`)
        .concat(refCandidates.map((r) => `reference.eq.${r}`));
      const orExpr = orExprParts.join(",");

      const { data: pendingTxList, error: pendingErr } = await supabase
        .from("transactions")
        .select("*")
        .or(orExpr)
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (pendingErr) {
        console.error(
          "❌ DB error while finding pending transaction:",
          pendingErr
        );
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      const pendingTx = pendingTxList?.[0];

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
        "📦 Found pending transaction:",
        pendingTx.id,
        "status:",
        pendingTx.status,
        "type:",
        pendingTx.type
      );

      // 🔥 NEW: Check if this is a P2P transfer or regular withdrawal
      const isP2PTransfer = pendingTx.type === "p2p_transfer";
      const isRegularWithdrawal = pendingTx.type === "withdrawal";

      console.log("🎯 Transaction type detection:");
      console.log("   - Is P2P Transfer:", isP2PTransfer);
      console.log("   - Is Regular Withdrawal:", isRegularWithdrawal);

      // Idempotency - check if already processed
      if (["success", "failed"].includes(pendingTx.status)) {
        console.log(`⚠️ Transaction already ${pendingTx.status}. Skipping.`);
        return NextResponse.json(
          { message: "Already processed" },
          { status: 200 }
        );
      }

      // 🔥 NEW: Different fee logic for P2P vs Regular Withdrawals
      const txAmount = Number(pendingTx.amount ?? transactionAmount ?? 0);

      let appFee = 0;
      let totalFees = 0;
      let totalDeduction = txAmount;

      if (isRegularWithdrawal) {
        // Regular withdrawal fee logic: 1% (₦20 min, ₦1000 cap)
        appFee = txAmount * 0.01;
        appFee = Math.max(appFee, 20);
        appFee = Math.min(appFee, 1000);
        appFee = Number(appFee.toFixed(2));
        totalFees = Number((nombaFee + appFee).toFixed(2));
        totalDeduction = txAmount + totalFees;

        console.log("💰 Regular Withdrawal calculations:");
        console.log("   - Withdrawal amount:", txAmount);
        console.log("   - Nomba fee:", nombaFee);
        console.log("   - Our app fee:", appFee);
        console.log("   - Total fees:", totalFees);
        console.log("   - Total deduction:", totalDeduction);
      } else if (isP2PTransfer) {
        // 🔥 P2P transfers have NO FEES
        appFee = 0;
        totalFees = 0; // No fees for P2P
        totalDeduction = txAmount; // Only deduct the transfer amount

        console.log("💰 P2P Transfer calculations (NO FEES):");
        console.log("   - Transfer amount:", txAmount);
        console.log("   - Nomba fee:", nombaFee); // This might be 0 for internal transfers
        console.log("   - Our app fee:", appFee);
        console.log("   - Total fees:", totalFees);
        console.log("   - Total deduction:", totalDeduction);
      }

      // ✅ SUCCESS CASE
      if (eventType === "payout_success" || txStatus === "success") {
        console.log(
          `✅ ${
            isP2PTransfer ? "P2P Transfer" : "Withdrawal"
          } success - marking transaction as success`
        );

        const reference = nombaTransactionId || crypto.randomUUID();

        // Build updated external response with fee info
        const updatedExternalResponse = {
          ...payload,
          fee_breakdown: {
            transaction_type: isP2PTransfer ? "p2p_transfer" : "withdrawal",
            amount: txAmount,
            nomba_fee: nombaFee,
            app_fee: appFee,
            total_fee: totalFees,
            total_deduction: totalDeduction,
          },
        };

        // 🟩 No second deduction here — we already deducted at initiation
        const { error: updateErr } = await supabase
          .from("transactions")
          .update({
            status: "success",
            reference,
            external_response: updatedExternalResponse,
            total_deduction: totalDeduction,
            fee: totalFees,
          })
          .eq("id", pendingTx.id);

        if (updateErr) {
          console.error("❌ Failed to update transaction:", updateErr);
          return NextResponse.json({ error: "Update failed" }, { status: 500 });
        }

        // 🔥 NEW: For P2P transfers, also credit the receiver
        if (isP2PTransfer && pendingTx.receiver) {
          try {
            console.log("💰 Processing P2P receiver credit...");

            // Find receiver by wallet_id from the transaction record
            const { data: receiver, error: receiverError } = await supabase
              .from("users")
              .select("id, first_name, last_name")
              .eq("wallet_id", pendingTx.receiver.wallet_id)
              .single();

            if (receiverError || !receiver) {
              console.error("❌ P2P receiver not found:", pendingTx.receiver);
            } else {
              // Credit receiver's wallet
              const { error: creditError } = await supabase.rpc(
                "increment_wallet_balance",
                {
                  user_id: receiver.id,
                  amt: txAmount,
                }
              );

              if (creditError) {
                console.error(
                  "❌ Failed to credit receiver wallet:",
                  creditError
                );
              } else {
                // Create receiver transaction record
                await supabase.from("transactions").insert({
                  user_id: receiver.id,
                  type: "p2p_received",
                  amount: txAmount,
                  status: "success",
                  description: `Received ₦${txAmount} from ${
                    pendingTx.sender?.name || "User"
                  }`,
                  narration: pendingTx.narration || "P2P Received",
                  reference: reference,
                  external_response: updatedExternalResponse,
                  sender: pendingTx.sender,
                });

                console.log(
                  `✅ P2P receiver ${receiver.id} credited with ₦${txAmount}`
                );
              }
            }
          } catch (receiverErr) {
            console.error(
              "❌ Error processing P2P receiver credit:",
              receiverErr
            );
            // Don't fail the whole webhook - log and continue
          }
        }

        console.log(
          `✅ ${
            isP2PTransfer ? "P2P Transfer" : "Withdrawal"
          } marked success. User ${
            pendingTx.user_id
          } was already charged ₦${totalDeduction} during initiation.`
        );

        return NextResponse.json(
          {
            success: true,
            message: `${
              isP2PTransfer ? "P2P Transfer" : "Withdrawal"
            } processed successfully`,
            transaction_type: isP2PTransfer ? "p2p_transfer" : "withdrawal",
          },
          { status: 200 }
        );
      }

      // ❌ FAILURE CASE — REFUND USER
      if (eventType === "payout_failed" || txStatus === "failed") {
        console.log(
          `❌ ${
            isP2PTransfer ? "P2P Transfer" : "Withdrawal"
          } failed - refunding user and marking transaction failed`
        );

        const updatedExternalResponse = {
          ...payload,
          fee_breakdown: {
            transaction_type: isP2PTransfer ? "p2p_transfer" : "withdrawal",
            nomba_fee: nombaFee,
            app_fee: appFee,
            total_fee: totalFees,
            failed: true,
          },
        };

        // Update transaction to failed
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            status: "failed",
            external_response: updatedExternalResponse,
            reference: nombaTransactionId || pendingTx.reference,
          })
          .eq("id", pendingTx.id);

        if (updateError) {
          console.error("❌ Failed to update transaction status:", updateError);
          return NextResponse.json(
            { error: "Failed to update transaction" },
            { status: 500 }
          );
        }

        // Refund wallet via RPC since we deducted earlier
        console.log("🔄 Refunding user wallet...");
        const refundReference = `refund_${
          nombaTransactionId || crypto.randomUUID()
        }`;
        const { error: refundErr } = await supabase.rpc(
          "deduct_wallet_balance",
          {
            user_id: pendingTx.user_id,
            amt: -totalDeduction, // negative = credit back
            transaction_type: "credit",
            reference: refundReference,
            description: `Refund for failed ${
              isP2PTransfer ? "P2P transfer" : "withdrawal"
            } of ₦${txAmount}`,
          }
        );

        if (refundErr) {
          console.error("❌ Refund RPC failed:", refundErr.message);
          return NextResponse.json(
            { error: "Failed to refund wallet via RPC" },
            { status: 500 }
          );
        }

        console.log(
          `✅ Refund completed successfully for user ${pendingTx.user_id}`
        );
        return NextResponse.json(
          {
            refunded: true,
            transaction_type: isP2PTransfer ? "p2p_transfer" : "withdrawal",
          },
          { status: 200 }
        );
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
