import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
// import { clearDataPlansCache } from "../get-data-bundles/route";
// import {
//   clearAllWalletBalanceCache,
//   clearWalletBalanceCache,
// } from "../wallet-balance/route";
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
    .select("transaction_pin, wallet_balance, email, first_name")
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

// Email notification function using Nodemailer
async function sendEmailNotification(
  userId: string,
  status: "success" | "failed",
  amount: number,
  phoneNumber: string,
  network: string,
  transactionId?: string | null,
  errorDetail?: string
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
        ? `Data Purchase Successful - ₦${amount} ${network}`
        : `Data Purchase Failed - ₦${amount} ${network}`;

    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    const successBody = `
${greeting}

Your data purchase was successful!

📱 Transaction Details:
• Amount: ₦${amount}
• Network: ${network}
• Phone Number: ${phoneNumber}
• Transaction ID: ${transactionId || "N/A"}
• Date: ${new Date().toLocaleString()}

Thank you for using Zidwell!

Best regards,
Zidwell Team
    `;

    const failedBody = `
${greeting}

Your data purchase failed.

📱 Transaction Details:
• Amount: ₦${amount}
• Network: ${network}
• Phone Number: ${phoneNumber}
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
      from: process.env.EMAIL_FROM || '"Zidwell" <notifications@zidwell.com>',
      to: user.email,
      subject,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>${greeting}</p>
          
          <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">
            ${
              status === "success"
                ? "✅ Data Purchase Successful"
                : "❌ Data Purchase Failed"
            }
          </h3>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin-top: 0;">Transaction Details:</h4>
            <p><strong>Amount:</strong> ₦${amount}</p>
            <p><strong>Network:</strong> ${network}</p>
            <p><strong>Phone Number:</strong> ${phoneNumber}</p>
            <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
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
      `Email notification sent to ${user.email} for ${status} data purchase`
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
    if (!token) {
      return NextResponse.json(
        { error: "Unable to authenticate with Nomba" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      userId,
      pin,
      amount,
      phoneNumber,
      network,
      merchantTxRef,
      senderName,
    } = body;

    if (
      !userId ||
      !pin ||
      !amount ||
      !phoneNumber ||
      !network ||
      !merchantTxRef ||
      !senderName
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // REPLACED: Fetch user with cached version
    const user = await getCachedUser(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid)
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 }
      );

    // 2️⃣ Deduct wallet and create transaction via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: parsedAmount,
        transaction_type: "data",
        reference: merchantTxRef,
        description: `Data purchase on ${network} for ${phoneNumber}`,
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

    // 3️⃣ Call Nomba API
    try {
      const response = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/data`,
        {
          amount: parsedAmount,
          phoneNumber,
          network,
          merchantTxRef,
          senderName: senderName || "Zidwell User",
        },
        {
          headers: {
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 4️⃣ Mark transaction as success
      await supabase
        .from("transactions")
        .update({
          status: "success",
          description: `Data purchase successful for ${phoneNumber}`,
        })
        .eq("id", transactionId);

      // Send success email notification - all parameters are guaranteed to be strings here
      await sendEmailNotification(
        userId, // string
        "success",
        parsedAmount, // number
        phoneNumber, // string
        network, // string
        transactionId // string | null
      );

      // clearDataPlansCache(userId);
      // clearWalletBalanceCache(userId);
      // clearTransactionsCache(userId);

      return NextResponse.json({
        success: true,
        message: "Data purchase successful",
        transactionId,
        nombaResponse: response.data,
      });
    } catch (nombaError: any) {
      console.error(
        "Data Purchase API error:",
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
            description: `Data purchase failed for ${phoneNumber}`,
          })
          .eq("id", transactionId);

        // Send failure email notification with refund info - all parameters are guaranteed to be strings here
        await sendEmailNotification(
          userId, // string
          "failed",
          parsedAmount, // number
          phoneNumber, // string
          network, // string
          transactionId, // string | null
          `Transaction failed - Refunded. ${errorDetail}`
        );
      } catch (refundError) {
        console.error("Refund failed:", refundError);

        await supabase
          .from("transactions")
          .update({
            status: "refund_pending",
            description: `Data purchase failed - refund pending for ${phoneNumber}`,
          })
          .eq("id", transactionId);

        // Send failure email notification with pending refund info - all parameters are guaranteed to be strings here
        await sendEmailNotification(
          userId, // string
          "failed",
          parsedAmount, // number
          phoneNumber, // string
          network, // string
          transactionId, // string | null
          `Transaction failed - Refund pending. ${errorDetail}`
        );
      }

      return NextResponse.json(
        {
          error: "Data purchase failed",
          detail: errorDetail,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Unexpected Data purchase error:", err.message);

    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    // Note: We cannot send email notifications in the outer catch block
    // because we don't have guaranteed access to userId, phoneNumber, network
    // since the error could have occurred before they were validated

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
