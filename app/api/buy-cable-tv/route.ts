import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import bcrypt from "bcryptjs";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
// import { clearCableProductsCache } from "../cable-tv-bouquet/route";
// import { clearWalletBalanceCache } from "../wallet-balance/route";
// import { clearTransactionsCache } from "../bill-transactions/route";


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ADD USER CACHE HERE
const userCache = new Map();

async function getCachedUser(userId: string) {
  const cacheKey = `user_${userId}`;
  const cached = userCache.get(cacheKey);

  // Check if cache exists and is less than 2 minutes old
  if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
    console.log("✅ Using cached user data");
    return cached.data;
  }

  // Fetch fresh data
  const { data: user, error } = await supabase
    .from("users")
    .select("wallet_balance, transaction_pin, email, first_name")
    .eq("id", userId)
    .single();

  if (user && !error) {
    userCache.set(cacheKey, {
      data: user,
      timestamp: Date.now(),
    });
  }

  return user;
}

// Email notification function for cable TV purchases
async function sendCableTVEmailNotification(
  userId: string,
  status: "success" | "failed",
  amount: number,
  customerId: string,
  cableTvPaymentType: string,
  transactionId?: string | null,
  errorDetail?: string,
  subscriptionData?: any
) {
  try {
    // Fetch user email
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.error("Failed to fetch user for email notification:", error);
      return;
    }

    const subject =
      status === "success"
        ? `Cable TV Purchase Successful - ₦${amount}`
        : `Cable TV Purchase Failed - ₦${amount}`;

    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    const successBody = `
${greeting}

Your cable TV purchase was successful!

📺 Transaction Details:
• Amount: ₦${amount}
• Provider: ${cableTvPaymentType}
• Customer ID: ${customerId}
• Transaction ID: ${transactionId || "N/A"}
• Date: ${new Date().toLocaleString()}
${
  subscriptionData ? `• Subscription: ${subscriptionData.package || "N/A"}` : ""
}
${
  subscriptionData && subscriptionData.invoicePeriod
    ? `• Invoice Period: ${subscriptionData.invoicePeriod}`
    : ""
}

Thank you for using Zidwell!

Best regards,
Zidwell Team
    `;

    const failedBody = `
${greeting}

Your cable TV purchase failed.

📺 Transaction Details:
• Amount: ₦${amount}
• Provider: ${cableTvPaymentType}
• Customer ID: ${customerId}
• Transaction ID: ${transactionId || "N/A"}
• Date: ${new Date().toLocaleString()}
• Status: ${errorDetail || "Transaction failed"}

${
  errorDetail?.includes("refunded")
    ? "✅ Your wallet has been refunded successfully."
    : "Please contact support if you have any questions."
}

Best regards,
Zidwell Team
    `;

    const emailBody = status === "success" ? successBody : failedBody;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Zidwell" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>${greeting}</p>
          
          <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">
            ${
              status === "success"
                ? "✅ Cable TV Purchase Successful"
                : "❌ Cable TV Purchase Failed"
            }
          </h3>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin-top: 0;">Transaction Details:</h4>
            <p><strong>Amount:</strong> ₦${amount}</p>
            <p><strong>Provider:</strong> ${cableTvPaymentType}</p>
            <p><strong>Customer ID:</strong> ${customerId}</p>
            <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            ${
              status === "success" && subscriptionData
                ? `
              <p><strong>Subscription:</strong> ${
                subscriptionData.package || "N/A"
              }</p>
              ${
                subscriptionData.invoicePeriod
                  ? `<p><strong>Invoice Period:</strong> ${subscriptionData.invoicePeriod}</p>`
                  : ""
              }
            `
                : ""
            }
            ${
              status === "failed"
                ? `<p><strong>Status:</strong> ${
                    errorDetail || "Transaction failed"
                  }</p>`
                : ""
            }
          </div>
          
          ${
            status === "failed" && errorDetail?.includes("refunded")
              ? '<p style="color: #22c55e; font-weight: bold;">✅ Your wallet has been refunded successfully.</p>'
              : ""
          }
          
          <p>Thank you for using Zidwell!</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #64748b; font-size: 14px;">
            Best regards,<br>
            <strong>Zidwell Team</strong>
          </p>
        </div>
      `,
    });

    console.log(
      `Email notification sent to ${user.email} for ${status} cable TV purchase`
    );
  } catch (emailError) {
    console.error("Failed to send email notification:", emailError);
    // Don't throw error to avoid affecting the main transaction flow
  }
}

export async function POST(req: NextRequest) {
  let transactionId: string | null = null;

  try {
    const token = await getNombaToken();
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      pin,
      userId,
      customerId,
      amount,
      cableTvPaymentType,
      payerName,
      merchantTxRef,
    } = body;

    if (
      !userId ||
      !pin ||
      !customerId ||
      !amount ||
      !cableTvPaymentType ||
      !payerName ||
      !merchantTxRef
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);

    // REPLACED: Fetch user with cached version
    const user = await getCachedUser(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.transaction_pin)
      return NextResponse.json(
        { error: "Transaction PIN not set" },
        { status: 400 }
      );

    // 2️⃣ Verify transaction PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid)
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 }
      );

    // 3️⃣ Deduct wallet and create transaction via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: parsedAmount,
        transaction_type: "cable", // set type to cable
        reference: merchantTxRef,
        description: `Cable TV purchase for ${customerId}`,
      }
    );

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return NextResponse.json(
        { error: "Wallet deduction failed", detail: rpcError.message },
        { status: 500 }
      );
    }

    if (rpcResult[0].status !== "OK") {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    transactionId = rpcResult[0].tx_id;

    // 4️⃣ Call Nomba API
    try {
      const response = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/cabletv`,
        {
          customerId,
          amount: parsedAmount,
          cableTvPaymentType,
          payerName,
          merchantTxRef,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            "Content-Type": "application/json",
          },
          maxBodyLength: Infinity,
        }
      );

      // 5️⃣ Mark transaction success
      await supabase
        .from("transactions")
        .update({
          status: "success",
          description: `Cable TV payment successful for ${customerId}`,
        })
        .eq("id", transactionId);

      // Send success email notification
      await sendCableTVEmailNotification(
        userId,
        "success",
        parsedAmount,
        customerId,
        cableTvPaymentType,
        transactionId,
        undefined, // No error detail for success
        response.data // Include subscription data
      );
      // clearCableProductsCache(cableTvPaymentType);
      //  clearWalletBalanceCache(userId);
      // clearTransactionsCache(userId);

      return NextResponse.json({
        success: true,
        data: response.data,
        transactionId,
      });
    } catch (nombaError: any) {
      console.error(
        "Cable TV API error:",
        nombaError.response?.data || nombaError.message
      );

      const errorDetail =
        nombaError.response?.data?.message || nombaError.message;

      // Refund wallet via RPC
      try {
        await supabase.rpc("refund_wallet_balance", {
          user_id: userId,
          amt: parsedAmount,
        });

        await supabase
          .from("transactions")
          .update({
            status: "failed_refunded",
            description: `Cable TV purchase failed for ${customerId}`,
          })
          .eq("id", transactionId);

        // Send failure email notification with refund info
        await sendCableTVEmailNotification(
          userId,
          "failed",
          parsedAmount,
          customerId,
          cableTvPaymentType,
          transactionId,
          `Transaction failed - Refunded. ${errorDetail}`
        );
      } catch (refundError) {
        console.error("Refund failed:", refundError);

        await supabase
          .from("transactions")
          .update({
            status: "refund_pending",
            description: `Cable TV purchase failed - refund pending for ${customerId}`,
          })
          .eq("id", transactionId);

        // Send failure email notification with pending refund info
        await sendCableTVEmailNotification(
          userId,
          "failed",
          parsedAmount,
          customerId,
          cableTvPaymentType,
          transactionId,
          `Transaction failed - Refund pending. ${errorDetail}`
        );
      }

      return NextResponse.json(
        {
          error: "Cable TV purchase failed",
          detail: errorDetail,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Unexpected cable purchase error:", err.message);

    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
