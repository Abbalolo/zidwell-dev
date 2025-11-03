import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
// import { clearUserWalletCache } from "../get-wallet-account-details/route";
// import { clearElectricityProvidersCache } from "../electricity-providers/route";
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

// Email notification function for electricity purchases
async function sendElectricityEmailNotification(
  userId: string,
  status: "success" | "failed",
  amount: number,
  disco: string,
  meterNumber: string,
  meterType: string,
  transactionId?: string | null,
  errorDetail?: string,
  tokenData?: any
) {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn(
        "Email notifications are disabled. Please set EMAIL_USER and EMAIL_PASSWORD environment variables."
      );
      return;
    }

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
        ? `Electricity Purchase Successful - ₦${amount} ${disco}`
        : `Electricity Purchase Failed - ₦${amount} ${disco}`;

    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    const successBody = `
${greeting}

Your electricity purchase was successful!

⚡ Transaction Details:
• Amount: ₦${amount}
• Disco: ${disco}
• Meter Number: ${meterNumber}
• Meter Type: ${meterType}
• Transaction ID: ${transactionId || "N/A"}
• Date: ${new Date().toLocaleString()}
${tokenData ? `• Token: ${tokenData.token || "N/A"}` : ""}
${tokenData && tokenData.units ? `• Units: ${tokenData.units}` : ""}

Thank you for using Zidwell!

Best regards,
Zidwell Team
    `;

    const failedBody = `
${greeting}

Your electricity purchase failed.

⚡ Transaction Details:
• Amount: ₦${amount}
• Disco: ${disco}
• Meter Number: ${meterNumber}
• Meter Type: ${meterType}
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
                ? "✅ Electricity Purchase Successful"
                : "❌ Electricity Purchase Failed"
            }
          </h3>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin-top: 0;">Transaction Details:</h4>
            <p><strong>Amount:</strong> ₦${amount}</p>
            <p><strong>Disco:</strong> ${disco}</p>
            <p><strong>Meter Number:</strong> ${meterNumber}</p>
            <p><strong>Meter Type:</strong> ${meterType}</p>
            <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            ${
              status === "success" && tokenData
                ? `
              <p><strong>Token:</strong> <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${
                tokenData.token || "N/A"
              }</code></p>
              ${
                tokenData.units
                  ? `<p><strong>Units:</strong> ${tokenData.units}</p>`
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
      `Email notification sent to ${user.email} for ${status} electricity purchase`
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
      userId,
      pin,
      disco,
      meterNumber,
      meterType,
      amount,
      payerName,
      merchantTxRef,
    } = body;

    if (
      !userId ||
      !pin ||
      !disco ||
      !meterNumber ||
      !meterType ||
      !amount ||
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
        transaction_type: "electricity",
        reference: merchantTxRef,
        description: `Electricity purchase for ${meterNumber} (${meterType})`,
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
      const apiResponse = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/electricity`,
        {
          disco,
          customerId: meterNumber,
          meterType,
          amount: parsedAmount,
          payerName,
          merchantTxRef,
        },
        {
          headers: {
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 4️⃣ Update transaction status → success
      await supabase
        .from("transactions")
        .update({
          status: "success",
          description: `Electricity token generated for ${meterNumber}`,
        })
        .eq("id", transactionId);

      // Send success email notification with token information
      await sendElectricityEmailNotification(
        userId,
        "success",
        parsedAmount,
        disco,
        meterNumber,
        meterType,
        transactionId,
        undefined, // No error detail for success
        apiResponse.data // Include token data
      );

      // clearElectricityProvidersCache();
      // clearWalletBalanceCache(userId);
      // clearTransactionsCache(userId);

      return NextResponse.json({
        success: true,
        token: apiResponse.data,
      });
    } catch (apiError: any) {
      console.error(
        "⚠️ Electricity API error:",
        apiError.response?.data || apiError.message
      );

      const errorDetail = apiError.response?.data?.message || apiError.message;

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
            description: `Electricity purchase failed for ${meterNumber}`,
          })
          .eq("id", transactionId);

        // Send failure email notification with refund info
        await sendElectricityEmailNotification(
          userId,
          "failed",
          parsedAmount,
          disco,
          meterNumber,
          meterType,
          transactionId,
          `Transaction failed - Refunded. ${errorDetail}`
        );
      } catch (refundError) {
        console.error("Refund failed:", refundError);

        await supabase
          .from("transactions")
          .update({
            status: "refund_pending",
            description: `Electricity purchase failed - refund pending for ${meterNumber}`,
          })
          .eq("id", transactionId);

        // Send failure email notification with pending refund info
        await sendElectricityEmailNotification(
          userId,
          "failed",
          parsedAmount,
          disco,
          meterNumber,
          meterType,
          transactionId,
          `Transaction failed - Refund pending. ${errorDetail}`
        );
      }

      return NextResponse.json(
        {
          error: "Failed to purchase electricity token",
          detail: errorDetail,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("⚠️ Electricity purchase error:", err.message);

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
