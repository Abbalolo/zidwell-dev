import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
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
  transactionId?: string,
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
        ? `Airtime Purchase Successful - ₦${amount} ${network}`
        : `Airtime Purchase Failed - ₦${amount} ${network}`;

    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    const successBody = `
${greeting}

Your airtime purchase was successful!

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

Your airtime purchase failed.

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
                ? "✅ Airtime Purchase Successful"
                : "❌ Airtime Purchase Failed"
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
      `Email notification sent to ${user.email} for ${status} transaction`
    );
  } catch (emailError) {
    console.error("Failed to send email notification:", emailError);
    // Don't throw error to avoid affecting the main transaction flow
  }
}

export async function POST(req: NextRequest) {
  let transactionId: string | null = null;
  let userId: string | undefined;
  let amount: number | undefined;
  let phoneNumber: string | undefined;
  let network: string | undefined;

  try {
    const body = await req.json();
    userId = body.userId;
    amount = body.amount;
    phoneNumber = body.phoneNumber;
    network = body.network;
    const { merchantTxRef, senderName, pin } = body;

    if (
      !userId ||
      !pin ||
      !amount ||
      amount < 100 ||
      !phoneNumber ||
      !network
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid input: userId, pin, phoneNumber, network are required and amount must be >= 100",
        },
        { status: 400 }
      );
    }

    // Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // REPLACED: Fetch user with cached version
    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify transaction PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid Transaction PIN" },
        { status: 401 }
      );
    }

    // Deduct wallet using RPC and create transaction
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: amount,
        transaction_type: "airtime",
        reference: merchantTxRef,
        description: `Airtime on ${network} for ${phoneNumber}`,
      }
    );

    if (rpcError) {
      console.log(rpcError, "rpcError");
      return NextResponse.json(
        { message: "Wallet deduction failed", detail: rpcError.message },
        { status: 500 }
      );
    }

    if (rpcResult[0].status !== "OK") {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // Transaction ID from RPC
    transactionId = rpcResult[0].tx_id;

    // Call Nomba API
    const response = await axios.post(
      `${process.env.NOMBA_URL}/v1/bill/topup`,
      {
        amount,
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

    // Mark transaction as success
    await supabase
      .from("transactions")
      .update({ status: "success" })
      .eq("id", transactionId);

    // Send success email notification - convert null to undefined
    await sendEmailNotification(
      userId,
      "success",
      amount,
      phoneNumber,
      network,
      transactionId || undefined // Fix: Convert null to undefined
    );
    // clearWalletBalanceCache(userId);
    // clearTransactionsCache(userId);
    return NextResponse.json({
      message: "Airtime purchase successful",
      transaction: response.data,
    });
  } catch (error: any) {
    console.error(
      "Airtime Purchase Error:",
      error.response?.data || error.message
    );

    const errorDetail = error.response?.data?.message || error.message;
    let refundStatus = "failed";
    let emailStatus: "failed" = "failed";

    // Refund if userId and amount exist
    if (userId && amount) {
      try {
        await supabase.rpc("refund_wallet_balance", {
          user_id: userId,
          amt: amount,
        });
        if (transactionId) {
          await supabase
            .from("transactions")
            .update({ status: "failed_refunded" })
            .eq("id", transactionId);
          refundStatus = "failed_refunded";
        }
      } catch (refundError) {
        console.error("Refund failed:", refundError);
        if (transactionId) {
          await supabase
            .from("transactions")
            .update({ status: "refund_pending" })
            .eq("id", transactionId);
          refundStatus = "refund_pending";
        }
      }
    }

    // Send failure email notification - convert null to undefined
    if (userId && amount && phoneNumber && network) {
      await sendEmailNotification(
        userId,
        emailStatus,
        amount,
        phoneNumber,
        network,
        transactionId || undefined, // Fix: Convert null to undefined
        `Transaction failed - Status: ${refundStatus}. ${errorDetail}`
      );
    }

    return NextResponse.json(
      {
        message: "Transaction failed, user refunded if deducted",
        detail: errorDetail,
        refundStatus,
      },
      { status: 500 }
    );
  }
}
