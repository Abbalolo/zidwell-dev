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

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Determine base URL based on environment for email sending
const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

// Nomba signature key for webhook verification
const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

// Utility function to safely convert any value to number
function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  try {
    console.log("====== Nomba Webhook Triggered ======");

    // ===== STEP 1: READ AND PARSE RAW BODY =====
    console.log("📥 Reading raw body...");
    const rawBody = await req.text();
    console.log("🔸 Raw body length:", rawBody?.length);
    
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
      console.log("✅ JSON parsed successfully");
      console.log("📋 payload.event_type:", payload?.event_type || payload?.eventType);
    } catch (err) {
      console.error("❌ Failed to parse JSON body", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // ===== STEP 2: SIGNATURE VERIFICATION =====
    console.log("🔐 Starting signature verification...");
    const timestamp = req.headers.get("nomba-timestamp");
    const signature =
      req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

    // Check if required headers are present
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

    // Build hash payload according to Nomba docs format
    const hashingPayload = `${payload.event_type}:${payload.requestId}:${
      payload.data?.merchant?.userId || ""
    }:${payload.data?.merchant?.walletId || ""}:${
      payload.data?.transaction?.transactionId || ""
    }:${payload.data?.transaction?.type || ""}:${
      payload.data?.transaction?.time || ""
    }:${payload.data?.transaction?.responseCode || ""}`;
    
    const message = `${hashingPayload}:${timestamp}`;

    // Generate expected signature
    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest("base64");

    // Compare signatures using timing-safe comparison
    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    console.log("🔐 Signature verification details:");
    console.log("   - Received:", signature);
    console.log("   - Expected:", expectedSignature);
    console.log("   - Same length?:", receivedBuffer.length === expectedBuffer.length);

    // Verify signature matches
    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      console.error("❌ Invalid signature - aborting webhook");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.log("✅ Signature verified successfully");

    // ===== STEP 3: NORMALIZE PAYLOAD FIELDS =====
    console.log("🔄 Normalizing payload fields...");
    const eventType: string = payload.event_type || payload.eventType;
    const tx = payload.data?.transaction || payload.data?.txn || {};
    const order = payload.data?.order || null;

    // Extract transaction identifiers from various possible fields
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

    // Extract financial amounts
    const transactionAmount = safeNum(
      tx.transactionAmount ?? tx.amount ?? order?.amount ?? 0
    );
    const feeFromNomba = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
    const txStatusRaw = (tx.status || payload.data?.status || "").toString();
    const txStatus = txStatusRaw.toLowerCase();

    console.log("🔍 Extracted transaction details:");
    console.log("   - eventType:", eventType);
    console.log("   - txType:", tx.type || tx.transactionType || "unknown");
    console.log("   - nombaTransactionId:", nombaTransactionId);
    console.log("   - merchantTxRef:", merchantTxRef);
    console.log("   - orderReference:", orderReference);
    console.log("   - aliasAccountReference:", aliasAccountReference);
    console.log("   - transactionAmount:", transactionAmount);
    console.log("   - fee:", feeFromNomba);
    console.log("   - txStatus:", txStatus);

    // ===== STEP 4: DETERMINE TRANSACTION FLOW =====
    console.log("🎯 Determining transaction flow type...");
    const isCardPayment = Boolean(orderReference);
    const isVirtualAccountDeposit = Boolean(aliasAccountReference);
    const isPayoutOrTransfer =
      Boolean(merchantTxRef) ||
      (tx.type && tx.type.toLowerCase().includes("transfer")) ||
      eventType?.toLowerCase()?.includes("payout");

    console.log("   - isCardPayment:", isCardPayment);
    console.log("   - isVirtualAccountDeposit:", isVirtualAccountDeposit);
    console.log("   - isPayoutOrTransfer:", isPayoutOrTransfer);

    // ===== STEP 5: HANDLE DEPOSITS (CARD & VIRTUAL ACCOUNT) =====
    if (
      eventType === "payment_success" ||
      eventType === "payment.succeeded" ||
      isCardPayment ||
      isVirtualAccountDeposit
    ) {
      console.log("💰 Processing deposit transaction...");

      // ===== SUBSCRIPTION PAYMENT HANDLING =====
      try {
        if (isCardPayment && orderReference?.includes("SUB-")) {
          console.log("📦 Processing subscription payment...");
          
          // Extract subscription details from payload
          const subEmail =
            payload.data?.order?.customerEmail ||
            payload.data?.customer?.customerEmail ||
            null;

          const subFullName =
            payload.data?.order?.fullName ||
            payload.data?.customer?.fullName ||
            "Subscriber";

          const subPlanId =
            payload.data?.order?.metadata?.planId ||
            payload.data?.meta?.planId ||
            "basic";

          const subAmount =
            safeNum(payload.data?.transaction?.transactionAmount) ||
            safeNum(payload.data?.order?.amount) ||
            0;

          const paymentReference = orderReference;

          // Validate required subscription fields
          if (subEmail && subPlanId && paymentReference) {
            console.log("✅ Valid subscription data found");

            // Check for existing subscriber using separate queries for better reliability
            const { data: existingSubByRef } = await supabase
              .from("subscribers")
              .select("*")
              .eq("payment_reference", paymentReference)
              .maybeSingle();

            const { data: existingSubByEmail } = await supabase
              .from("subscribers")
              .select("*")
              .eq("email", subEmail)
              .eq("plan_id", subPlanId)
              .maybeSingle();

            const existingSub = existingSubByRef || existingSubByEmail;

            // Calculate subscription expiry (30 days from now)
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            if (existingSub) {
              console.log("🔄 Updating existing subscriber...");
              // Update existing subscriber's expiry
              await supabase
                .from("subscribers")
                .update({
                  payment_status: "success",
                  subscription_expires_at: expiresAt.toISOString(),
                })
                .eq("id", existingSub.id);

              console.log(`✅ Updated subscriber expiry for ${subEmail}`);
            } else {
              console.log("🆕 Creating new subscriber...");
              // Create new subscriber record
              await supabase.from("subscribers").insert([
                {
                  email: subEmail,
                  full_name: subFullName,
                  plan_id: subPlanId,
                  amount: subAmount,
                  payment_reference: paymentReference,
                  payment_status: "success",
                  subscription_expires_at: expiresAt.toISOString(),
                  created_at: now.toISOString(),
                },
              ]);

              console.log(`✅ New subscriber created: ${subEmail}`);
            }

            // Send subscription confirmation email
            try {
              console.log("📧 Sending subscription confirmation email...");
              await fetch(`${baseUrl}/api/send-subscription-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: subEmail,
                  subject: "Subscription Payment Successful ✅",
                  message: `
                    <p>Hello ${subFullName},</p>
                    <p>We received your payment of <strong>₦${subAmount}</strong> for your subscription.</p>
                    <p>Your subscription is now active and will expire on <strong>${expiresAt.toDateString()}</strong>.</p>
                    <p>Reference: <strong>${paymentReference}</strong></p>
                    <p>Thank you 🎉</p>
                  `,
                }),
              });
              console.log(`✅ Subscription email sent to ${subEmail}`);
            } catch (emailErr) {
              console.error("❌ Failed sending subscription email:", emailErr);
            }

            // Stop processing - subscription handled separately from regular deposits
            console.log("✅ Subscription processing completed");
            return NextResponse.json(
              { success: true, message: "Subscription processed" },
              { status: 200 }
            );
          } else {
            console.warn("⚠️ Subscription metadata incomplete - skipping subscription handling");
          }
        }
      } catch (subErr) {
        console.error("❌ Subscription handling error:", subErr);
      }
      // ===== END SUBSCRIPTION HANDLING =====

      // ===== REGULAR DEPOSIT PROCESSING =====
      console.log("💳 Processing regular deposit...");
      
      // Determine user ID and reference for the transaction
      let userId: string | null = null;
      let referenceToUse: string | null =
        orderReference || nombaTransactionId || tx.sessionId || null;
      let txType = isCardPayment ? "card_deposit" : "deposit";
      let channel = isCardPayment ? "card" : "bank";

      console.log("   - Transaction type:", txType);
      console.log("   - Channel:", channel);
      console.log("   - Reference to use:", referenceToUse);

      // Handle Virtual Account deposits
      if (isVirtualAccountDeposit) {
        console.log("🏦 Processing Virtual Account deposit...");
        userId = aliasAccountReference; // aliasAccountReference should be the user ID
        referenceToUse = nombaTransactionId || tx.sessionId || `nomba-${Date.now()}`;
        console.log("   - VA User ID:", userId);
      } 
      // Handle Card payments
      else if (isCardPayment) {
        console.log("💳 Processing Card payment deposit...");
        referenceToUse = orderReference;
        
        // Find the pending transaction to get user ID
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
          console.log("   - Found user ID from pending transaction:", userId);
        } else {
          // Fallback: try to find user by customer email
          console.log("   - No pending transaction found, trying email lookup...");
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
            console.log("   - User ID from email lookup:", userId);
          }
        }
      }

      // Final user ID validation
      if (!userId) {
        console.warn("⚠️ Could not determine userId for deposit");
        if (aliasAccountReference) {
          userId = aliasAccountReference;
          console.log("   - Using aliasAccountReference as userId:", userId);
        } else {
          console.error("❌ No user to credit - aborting");
          return NextResponse.json(
            { message: "No user to credit" },
            { status: 200 }
          );
        }
      }

      // Calculate financial amounts
      const amount = transactionAmount;
      const fee = feeFromNomba;
      const netCredit = Number((amount - fee).toFixed(2));
      const total_deduction = Number((amount - fee).toFixed(2));

      console.log("💰 Financial calculations:");
      console.log("   - Amount:", amount);
      console.log("   - Fee:", fee);
      console.log("   - Net credit:", netCredit);
      console.log("   - Total deduction:", total_deduction);

      // ===== IDEMPOTENCY CHECK =====
      console.log("🔍 Checking for existing transaction...");
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

      // If transaction already processed successfully
      if (existingTx && existingTx.status === "success") {
        console.log("✅ Deposit already processed (idempotent) - skipping");
        return NextResponse.json(
          { message: "Already processed" },
          { status: 200 }
        );
      }

      // ===== EXISTING TRANSACTION UPDATE =====
      if (existingTx) {
        console.log("🔄 Found existing transaction - updating to success");
        
        // Update transaction status to success
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

        // Credit user's wallet using RPC function
        console.log("💳 Crediting user wallet via RPC...");
        const { error: rpcErr } = await supabase.rpc(
          "increment_wallet_balance",
          {
            user_id: existingTx.user_id,
            amt: netCredit,
          }
        );

        if (rpcErr) {
          console.error("❌ RPC increment_wallet_balance failed:", rpcErr);
          console.log("🔄 Falling back to manual wallet update...");
          
          // Fallback: manual wallet balance update
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

        console.log(`✅ Credited user ${existingTx.user_id} with ₦${netCredit}`);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // ===== NEW TRANSACTION CREATION =====
      console.log("🆕 No existing transaction found - creating new transaction");
      
      // Insert new transaction record
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
        // Handle duplicate insert (idempotency)
        if (insertErr.code === "23505") {
          console.warn("⚠️ Duplicate insert prevented - treating as processed");
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

      // Credit user's wallet for new transaction
      console.log("💳 Crediting wallet for new transaction...");
      const { error: rpcErr2 } = await supabase.rpc(
        "increment_wallet_balance",
        {
          user_id: userId,
          amt: netCredit,
        }
      );
      
      if (rpcErr2) {
        console.error("❌ RPC increment failed (after insert):", rpcErr2);
        console.log("🔄 Falling back to manual wallet credit...");
        
        // Fallback manual credit
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

      console.log(`✅ Auto-created transaction and credited user ${userId} with ₦${netCredit}`);
      return NextResponse.json({ success: true }, { status: 200 });
    } // ===== END DEPOSIT HANDLING =====

    // ===== STEP 6: HANDLE WITHDRAWAL / TRANSFER (OUTGOING) =====
    if (isPayoutOrTransfer) {
      console.log("💸 Processing payout/transfer flow...");

      // Build reference candidates for finding the transaction
      const refCandidates = [merchantTxRef, nombaTransactionId].filter(Boolean);
      console.log("🔍 Searching transaction by candidates:", refCandidates);

      // Build OR expression for database query
      const orExprParts = refCandidates
        .map((r) => `merchant_tx_ref.eq.${r}`)
        .concat(refCandidates.map((r) => `reference.eq.${r}`));
      const orExpr = orExprParts.join(",");

      // Find pending withdrawal transaction
      const { data: pendingTx, error: pendingErr } = await supabase
        .from("transactions")
        .select("*")
        .or(orExpr)
        .maybeSingle();

      if (pendingErr) {
        console.error("❌ DB error while finding pending transaction:", pendingErr);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      if (!pendingTx) {
        console.warn("⚠️ No matching pending withdrawal found for refs:", refCandidates);
        return NextResponse.json(
          { message: "No matching withdrawal transaction" },
          { status: 200 }
        );
      }

      console.log("📦 Found pending withdrawal:", pendingTx.id, "status:", pendingTx.status);

      // ===== IDEMPOTENCY CHECK FOR WITHDRAWAL =====
      if (["success", "failed"].includes(pendingTx.status)) {
        console.log(`⚠️ Withdrawal already ${pendingTx.status} - skipping`);
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      // Calculate withdrawal amounts
      const fee = safeNum(pendingTx.fee ?? feeFromNomba);
      const amount = safeNum(pendingTx.amount ?? transactionAmount);
      const totalDeduction = Number((amount + fee).toFixed(2));

      console.log("💰 Withdrawal calculations:");
      console.log("   - Amount:", amount);
      console.log("   - Fee:", fee);
      console.log("   - Total deduction:", totalDeduction);

      // ===== SUCCESSFUL WITHDRAWAL =====
      if (eventType === "payout_success" || txStatus === "success") {
        console.log("✅ Payout success - processing wallet deduction...");

        // Generate reference for the deduction transaction
        const reference = nombaTransactionId || crypto.randomUUID();
        
        // Deduct from wallet using RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "deduct_wallet_balance",
          {
            user_id: pendingTx.user_id,
            amt: totalDeduction,
            transaction_type: "debit", 
            reference,
            description: `Withdrawal of ₦${amount} (including ₦${fee} fee)`,
          }
        );

        if (rpcError) {
          console.error("❌ RPC deduct_wallet_balance failed:", rpcError.message);
          
          // Mark transaction as failed if deduction fails
          await supabase
            .from("transactions")
            .update({ status: "failed", external_response: payload })
            .eq("id", pendingTx.id);
            
          return NextResponse.json(
            { error: "Wallet deduction failed via RPC" },
            { status: 500 }
          );
        }

        // Process RPC response
        const rpcResult = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : rpcData;

        if (!rpcResult || rpcResult.status !== "OK") {
          console.error("⚠️ RPC returned non-OK:", rpcResult);
          
          // Mark transaction as failed
          await supabase
            .from("transactions")
            .update({ status: "failed", external_response: payload })
            .eq("id", pendingTx.id);
            
          return NextResponse.json(
            { error: rpcResult?.status || "Deduction failed" },
            { status: 400 }
          );
        }

        // Update transaction with success status
        await supabase
          .from("transactions")
          .update({
            status: "success",
            reference,
            external_response: payload,
            total_deduction: totalDeduction,
            fee,
          })
          .eq("id", pendingTx.id);

        console.log(`✅ Withdrawal processed successfully. ₦${totalDeduction} deducted for user ${pendingTx.user_id}`);

        return NextResponse.json(
          {
            success: true,
            message: "Withdrawal processed successfully",
            newWalletBalance: rpcResult.balance || rpcResult.new_balance,
          },
          { status: 200 }
        );
      }

      // ===== FAILED WITHDRAWAL =====
      if (eventType === "payout_failed" || txStatus === "failed") {
        console.log("❌ Payout failed - marking transaction failed and refunding...");

        // Update transaction as failed
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            external_response: payload,
            reference: nombaTransactionId || pendingTx.reference,
          })
          .eq("id", pendingTx.id);

        // Attempt to refund user's wallet
        try {
          console.log("🔄 Attempting to refund user wallet...");
          const { error: rpcErr } = await supabase.rpc("increment_wallet_balance", {
            user_id: pendingTx.user_id,
            amt: Number(pendingTx.total_deduction ?? pendingTx.amount ?? 0),
          });

          if (rpcErr) {
            console.warn("⚠️ Refund RPC failed - trying manual refund:", rpcErr);
            
            // Manual refund fallback
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
              console.log("✅ Manual refund completed");
            }
          } else {
            console.log("✅ Refund processed via RPC");
          }
        } catch (rEx) {
          console.warn("⚠️ Refund process threw error:", rEx);
        }

        console.log("✅ Payout failed processed and refund attempted");
        return NextResponse.json({ refunded: true }, { status: 200 });
      }

      console.log("ℹ️ Unhandled transfer event/status - ignoring");
      return NextResponse.json({ message: "Ignored transfer event" }, { status: 200 });
    }

    // ===== STEP 7: UNHANDLED EVENT TYPE =====
    console.log("ℹ️ Event type not matched - ignoring");
    return NextResponse.json({ message: "Ignored event" }, { status: 200 });
    
  } catch (err: any) {
    // ===== STEP 8: ERROR HANDLING =====
    console.error("🔥 Webhook processing error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}