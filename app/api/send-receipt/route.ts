import { v4 as uuidv4 } from "uuid";

import { transporter } from "@/lib/node-mailer";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, initiatorEmail, initiatorName, receiptId } = body;

    if (!receiptId || !data || !initiatorEmail || !initiatorName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const token = uuidv4();
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;
    const signingLink = `${baseUrl}/sign-receipt/${token}`;
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Save to Supabase
    const { error } = await supabase.from("receipts").upsert(
      [
        {
          token,
          receipt_id: receiptId,
          initiator_email: initiatorEmail,
          initiator_name: initiatorName,
          signee_name: data.name,
          signee_email: data.email,
          signing_link: signingLink,
          verification_code: verificationCode,
          bill_to: data.bill_to,
          payment_for: data.payment_for,
          issue_date: data.issue_date,
          customer_note: data.customer_note,
          receipt_items: data.receipt_items,
          created_at: new Date().toISOString(),
          status: "pending",
        },
      ],
      {
        onConflict: "receipt_id",
      }
    );

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { message: "Failed to save receipt request" },
        { status: 500 }
      );
    }

    // Send email to signee
    await transporter.sendMail({
      from: `Zidwell Receipts <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: "Action Required: Please Sign Your Receipt",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hello ${data.name || ""},</p>
          <p>You’ve been sent a receipt that requires your signature from <strong>${initiatorName}</strong>.</p>
          <p style="font-weight: bold; color: #C29307;">
            Verification Code: <span style="font-size: 16px;">${verificationCode}</span>
          </p>
          <p>Click below to review and sign the receipt:</p>
          <a href="${signingLink}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block; background:#C29307; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
            Sign Receipt
          </a>
          <p style="margin-top: 20px;">Or copy and paste this link:</p>
          <p><a href="${signingLink}" style="color:#C29307;">${signingLink}</a></p>
          <p>If you were not expecting this, you can ignore the email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">– Zidwell Receipts Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Receipt signing request sent successfully.",
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
