// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// const baseUrl =
//   process.env.NODE_ENV === "development"
//     ? process.env.NEXT_PUBLIC_DEV_URL
//     : process.env.NEXT_PUBLIC_BASE_URL;

// export async function POST(req: NextRequest) {
//   try {
//     const payload = await req.json();
//     console.log("🔔 Nomba webhook payload:", payload);

//     if (payload.event_type !== "payment_success") {
//       return NextResponse.json({ message: "Ignored event" }, { status: 200 });
//     }

//     const data = payload.data;

//     if (data.order?.orderReference) {
//       // ✅ INVOICE PAYMENT FLOW
//       const { orderReference } = data.order;
//       const {
//         transactionAmount,
//         type: paymentType,
//         transactionId,
//       } = data.transaction;

//       const { data: invoice, error: invError } = await supabase
//         .from("invoices")
//         .select("*")
//         .eq("order_reference", orderReference)
//         .single();

//       if (invError || !invoice) {
//         throw new Error("Invoice not found in database");
//       }

//       if (invoice.status !== "paid") {
//         // 1. Mark invoice as paid
//         const { error: updateError } = await supabase
//           .from("invoices")
//           .update({
//             status: "paid",
//             paid_at: new Date().toISOString(),
//             transaction_id: transactionId,
//             payment_method: paymentType,
//           })
//           .eq("order_reference", orderReference);

//         if (updateError) throw new Error("Failed to update invoice status");

//         // 2. Send confirmation + PDF
//         const resp = await fetch(`${baseUrl}/api/sign-invoice`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             invoiceId: invoice.invoice_id,
//             sendPaymentConfirmation: true,
//           }),
//         });

//         if (!resp.ok) {
//           const errText = await resp.text();
//           throw new Error(`sign-invoice API failed: ${resp.status} ${errText}`);
//         }

//         // 3. Fee calculation (3.5%)
//         const feeRate = 0.035;
//         let creditedAmount = invoice.total_amount;
//         let fee = 0;

//         if (invoice.fee_option === "absorbed") {
//           fee = Math.ceil(invoice.total_amount * feeRate);
//           creditedAmount = invoice.total_amount - fee;
//         } else if (invoice.fee_option === "customer") {
//           fee = Math.ceil(invoice.total_amount * feeRate);
//           // customer already paid fee → initiator still gets full total
//         }

//         // 4. Credit initiator’s wallet
//         if (!invoice.user_id) {
//           throw new Error("Invoice missing user_id, cannot credit wallet");
//         }

//         const { error: balanceError } = await supabase.rpc(
//           "increment_wallet_balance",
//           { user_id: invoice.user_id, amt: creditedAmount }
//         );
//         if (balanceError)
//           throw new Error("Failed to credit initiator's wallet");

//         // 5. Record transaction
//         const { error: txError } = await supabase.from("transactions").insert({
//           user_id: invoice.user_id,
//           type: "invoice_payment",
//           amount: creditedAmount,
//           status: "success",
//           description:
//             invoice.fee_option === "absorbed"
//               ? `Invoice payment ₦${invoice.total_amount} (₦${fee} fee deducted)`
//               : `Invoice payment ₦${invoice.total_amount} (customer paid fee)`,
//           reference: transactionId,
//           merchant_tx_ref: `INV_PAY_${Date.now()}`,
//         });
//         if (txError) throw new Error("Failed to insert invoice transaction");

//         console.log(
//           `✅ Invoice paid. Initiator ${invoice.user_id} credited ₦${creditedAmount}`
//         );
//       }
//     } else {
//       // ✅ WALLET DEPOSIT FLOW
//       console.log("data", data);

//       const { transactionAmount, transactionId, fee, aliasAccountReference } =
//         data.transaction;
//       const userId = aliasAccountReference;
//       console.log("User ID from merchant data:", userId);

//       // 2️⃣ Net amount = amount - Nomba fee - App fee
//       const nombaFee = fee || 0;
//       const netAmount = parseFloat((transactionAmount - nombaFee).toFixed(2));

//       console.log("Transaction amount (₦):", transactionAmount);
//       console.log("Nomba fee (₦):", nombaFee);
//       console.log("Net amount (₦):", netAmount);

//       // 3️⃣ Verify user exists
//       const { data: existingUser, error: userError } = await supabase
//         .from("users")
//         .select("id, wallet_balance")
//         .eq("id", userId)
//         .maybeSingle();

//       if (userError) throw new Error("User lookup failed");
//       if (!existingUser) throw new Error(`User with ID ${userId} not found.`);

//       // 4️⃣ Update wallet balance directly (no RPC)
//       const newBalance = parseFloat(existingUser.wallet_balance) + netAmount;

//       const { error: updateError } = await supabase
//         .from("users")
//         .update({ wallet_balance: newBalance })
//         .eq("id", existingUser.id);

//       if (updateError) throw new Error("Failed to update wallet balance");

//       // 5️⃣ Record transaction
//       const { error: txError } = await supabase.from("transactions").insert({
//         user_id: existingUser.id,
//         type: "deposit",
//         amount: netAmount,
//         status: "success",
//         description: `Wallet deposit of ₦${transactionAmount}`,
//         reference: transactionId,
//         merchant_tx_ref: `DEP_${Date.now()}`,
//       });

//       if (txError) throw new Error("Failed to insert deposit transaction");

//       console.log(
//         `✅ Wallet deposit credited for user ${userId} with ₦${netAmount}`
//       );
//     }

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error("❌ Webhook stopped:", error.message);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import { createHmac, timingSafeEqual } from "crypto";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;
// const baseUrl =
//   process.env.NODE_ENV === "development"
//     ? process.env.NEXT_PUBLIC_DEV_URL
//     : process.env.NEXT_PUBLIC_BASE_URL;

// export async function POST(req: NextRequest) {
//   try {
//     // ✅ Must read raw body for signature verification
//     const rawBody = await req.text();
//     const payload = JSON.parse(rawBody);

//     // ✅ Extract Nomba signature headers
//     const timestamp = req.headers.get("nomba-timestamp");
//     const signature = req.headers.get("nomba-sig-value");

//     if (!timestamp || !signature) {
//       return NextResponse.json(
//         { error: "Missing Nomba signature headers" },
//         { status: 401 }
//       );
//     }

//     // ✅ Build signature message according to docs
//     const hashingPayload = `${payload.event_type}:${payload.requestId}:${payload.data.merchant.userId}:${payload.data.merchant.walletId}:${payload.data.transaction.transactionId}:${payload.data.transaction.type}:${payload.data.transaction.time}:${payload.data.transaction.responseCode}`;
//     const message = `${hashingPayload}:${timestamp}`;

//     // ✅ HASH using HMAC SHA256
//     const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
//     hmac.update(message);
//     const expectedSignature = hmac.digest("hex");

//     // ✅ Secure compare to prevent timing attack
//     const signatureBuffer = Buffer.from(signature);
//     const expectedBuffer = Buffer.from(expectedSignature);
//     if (
//       signatureBuffer.length !== expectedBuffer.length ||
//       !timingSafeEqual(signatureBuffer, expectedBuffer)
//     ) {
//       console.error("❌ Invalid webhook signature");
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }

//     console.log("✅ Webhook Verified Successfully");

//     // ✅ Reject all events that are not payment_success
//     if (payload.event_type !== "payment_success") {
//       return NextResponse.json({ message: "Ignored event" }, { status: 200 });
//     }

//     const data = payload.data;

//     // ✅ Check if it's INVOICE PAYMENT logic or WALLET DEPOSIT logic
//     if (data.order?.orderReference) {
//       // ==============================
//       // ✅ INVOICE PAYMENT FLOW
//       // ==============================
//       const { orderReference } = data.order;
//       const {
//         transactionAmount,
//         type: paymentType,
//         transactionId,
//       } = data.transaction;

//       const { data: invoice, error: invError } = await supabase
//         .from("invoices")
//         .select("*")
//         .eq("order_reference", orderReference)
//         .single();

//       if (invError || !invoice) {
//         throw new Error("Invoice not found in database");
//       }

//       if (invoice.status !== "paid") {
//         await supabase
//           .from("invoices")
//           .update({
//             status: "paid",
//             paid_at: new Date().toISOString(),
//             transaction_id: transactionId,
//             payment_method: paymentType,
//           })
//           .eq("order_reference", orderReference);

//         // Send confirmation + PDF
//         await fetch(`${baseUrl}/api/sign-invoice`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             invoiceId: invoice.invoice_id,
//             sendPaymentConfirmation: true,
//           }),
//         });

//         // Fee calculation
//         const feeRate = 0.035;
//         let creditedAmount = invoice.total_amount;
//         let fee = 0;

//         if (invoice.fee_option === "absorbed") {
//           fee = Math.ceil(invoice.total_amount * feeRate);
//           creditedAmount = invoice.total_amount - fee;
//         }

//         await supabase.rpc("increment_wallet_balance", {
//           user_id: invoice.user_id,
//           amt: creditedAmount,
//         });

//         await supabase.from("transactions").insert({
//           user_id: invoice.user_id,
//           type: "invoice_payment",
//           amount: creditedAmount,
//           status: "success",
//           description:
//             invoice.fee_option === "absorbed"
//               ? `Invoice payment ₦${invoice.total_amount} (₦${fee} fee deducted)`
//               : `Invoice payment ₦${invoice.total_amount} (customer paid fee)`,
//           reference: transactionId,
//           merchant_tx_ref: `INV_PAY_${Date.now()}`,
//         });

//         console.log(
//           `✅ Invoice paid & wallet credited ₦${creditedAmount} for user ${invoice.user_id}`
//         );
//       }
//     } else {
//       // ==============================
//       // ✅ WALLET DEPOSIT FLOW
//       // ==============================
//       const { transactionAmount, transactionId, fee, aliasAccountReference } =
//         data.transaction;
//       const userId = aliasAccountReference;

//       const nombaFee = fee || 0;
//       const netAmount = parseFloat((transactionAmount - nombaFee).toFixed(2));

//       const { data: existingUser } = await supabase
//         .from("users")
//         .select("id, wallet_balance")
//         .eq("id", userId)
//         .maybeSingle();

//       if (!existingUser) throw new Error(`User ID ${userId} not found`);

//       const { error: txError } = await supabase.from("transactions").insert({
//         user_id: userId,
//         type: "deposit",
//         amount: netAmount,
//         status: "success",
//         description: `Wallet deposit of ₦${transactionAmount}`,
//         reference: transactionId,
//         merchant_tx_ref: `DEP_${Date.now()}`,
//       });

//       if (txError) throw new Error("Failed to record transaction");

//       const newBalance =
//         parseFloat(existingUser.wallet_balance) + netAmount;

//       await supabase
//         .from("users")
//         .update({ wallet_balance: newBalance })
//         .eq("id", userId);

//       console.log(`✅ Wallet funded ₦${netAmount} for user ${userId}`);
//     }

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error("❌ Webhook Error:", error.message);
//     return NextResponse.json({ error: error.message }, { status: 500 });
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

const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // DEBUG (remove in production)
    console.log("====== Incoming Webhook ======");
    console.log("Headers ->", Object.fromEntries(req.headers.entries()));
    console.log("Raw Body ->", rawBody);
    console.log("==============================");

    const payload = JSON.parse(rawBody);

    // Signature headers - support both header names Nomba uses
    const timestamp = req.headers.get("nomba-timestamp");
    const signature = req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

    if (!timestamp || !signature) {
      return NextResponse.json({ error: "Missing Nomba signature headers" }, { status: 401 });
    }

    // Build message per Nomba docs
    const hashingPayload = `${payload.event_type}:${payload.requestId}:${payload.data?.merchant?.userId || ''}:${payload.data?.merchant?.walletId || ''}:${payload.data?.transaction?.transactionId || ''}:${payload.data?.transaction?.type || ''}:${payload.data?.transaction?.time || ''}:${payload.data?.transaction?.responseCode || ''}`;
    const message = `${hashingPayload}:${timestamp}`;

    // expected HMAC Base64
    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest("base64");

    // compare as base64 buffers
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

    // Only process successful payments
    if (payload.event_type !== "payment_success") {
      return NextResponse.json({ message: "Ignored event" }, { status: 200 });
    }

    // Normalize some fields
    const orderRef = payload?.data?.order?.orderReference || null;
    const transactionId = payload?.data?.transaction?.transactionId || null;
    const accountId = payload?.data?.order?.accountId || payload?.data?.merchant?.walletId || null;
    const paymentType = payload?.data?.transaction?.type || payload?.data?.order?.paymentMethod || "unknown";
    const customerEmail = payload?.data?.order?.customerEmail || payload?.data?.customer?.customerEmail || null;
    const fee = Number(payload?.data?.transaction?.fee || 0);
    const transactionAmount = Number(payload?.data?.transaction?.transactionAmount || payload?.data?.order?.amount || 0);

    const netAmount = transactionAmount - fee;

    console.log(fee, "fee")
    console.log(netAmount, "netAmount")
    console.log(transactionAmount, "transactionAmount")

    // 1) Prefer: find the pending transaction by orderReference (best link to your saved pending tx)
    if (orderRef) {
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("*")
        .eq("reference", orderRef)
        .maybeSingle();

      if (existingTx) {
        // Use atomic RPC to credit + mark success if it is still pending
        const { data: rpcResp, error: rpcErr } = await supabase.rpc("credit_deposit_if_pending", {
          ref: orderRef,
          amt: netAmount,
        });

        if (rpcErr) {
          console.error("RPC error:", rpcErr);
          return NextResponse.json({ error: "RPC error" }, { status: 500 });
        }

        // rpcResp will be 'OK', 'ALREADY_PROCESSED', or 'NOT_FOUND'
        if (rpcResp === "OK") {
          console.log(`✅ Credited user via pending tx ${orderRef} with ₦${netAmount}`);
          return NextResponse.json({ success: true }, { status: 200 });
        } else if (rpcResp === "ALREADY_PROCESSED") {
          console.log("⚠️ Transaction already processed:", orderRef);
          return NextResponse.json({ message: "Already processed" }, { status: 200 });
        } else {
          console.log("⚠️ RPC returned:", rpcResp);
        }
      }
      // if existingTx not found — fallthrough to fallback resolution below
    }

    // 2) Fallback: Find user by accountId (your users.wallet_id) or by customerEmail
    let userId: string | null = null;
    if (accountId) {
      const { data: userByWallet } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_id", accountId)
        .maybeSingle();
      if (userByWallet) userId = userByWallet.id;
    }

    if (!userId && customerEmail) {
      const { data: userByEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();
      if (userByEmail) userId = userByEmail.id;
    }

    if (!userId) {
      console.error("❌ No user found (accountId/email). Payload:", {
        accountId,
        customerEmail,
        orderRef,
        transactionId,
      });
      // respond 200 so Nomba won't retry rapidly while you investigate — but you could return 404 if you want
      return NextResponse.json({ error: "No user found for this transaction" }, { status: 200 });
    }

    // 3) If user found but no pending transaction exists, attempt to insert the transaction (unique constraint prevents duplicates)
    const referenceToUse = orderRef || transactionId || `nomba-${Date.now()}`;

    // Try to insert; if insert fails with 23505 (unique violation), treat as duplicate and ignore
    const { error: insertErr } = await supabase.from("transactions").insert([
      {
        user_id: userId,
        type: "deposit",
        amount: netAmount,
        status: "success",
        reference: referenceToUse,
        description: `Wallet funded via ${paymentType} ₦${transactionAmount}`,
        merchant_tx_ref: transactionId || null,
      },
    ]);

    if (insertErr) {
      // unique violation: already processed — ignore
      if (insertErr.code === "23505") {
        console.log("⚠️ Duplicate transaction insert prevented (already processed)", referenceToUse);
        return NextResponse.json({ message: "Duplicate ignored" }, { status: 200 });
      }
      console.error("❌ Failed to insert transaction fallback:", insertErr);
      return NextResponse.json({ error: "Failed to insert transaction" }, { status: 500 });
    }

    // 4) Credit wallet via RPC (we used atomic method earlier when pending tx existed; here we simply call increment_wallet_balance)
    const { error: rpcError } = await supabase.rpc("increment_wallet_balance", {
      user_id: userId,
      amt: netAmount,
    });

    if (rpcError) {
      console.error("❌ RPC increment_wallet_balance error:", rpcError);
      return NextResponse.json({ error: "Failed to credit wallet" }, { status: 500 });
    }

    console.log(`✅ Wallet credited ₦${netAmount} for user ${userId} (fallback flow)`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
