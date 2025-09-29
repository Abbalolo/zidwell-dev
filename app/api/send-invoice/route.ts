import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { transporter } from "@/lib/node-mailer";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      initiator_email,
      initiator_name,
      invoice_id,
      signee_name,
      signee_email,
      message,
      bill_to,
      issue_date,
      due_date,
      customer_note,
      invoice_items,
      total_amount,
      payment_type,
      fee_option,
      unit,
      status,
    } = body;

    // Validate required fields
    if (!signee_email || !invoice_items || invoice_items.length === 0) {
      return NextResponse.json(
        { message: "Missing required fields or invoice items" },
        { status: 400 }
      );
    }

    const invoiceId = invoice_id;
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    const publicToken = uuidv4();
    const signingLink = `${baseUrl}/sign-invoice/${publicToken}`;

    // Get Nomba token
    const token = await getNombaToken();
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Calculate total with optional fee
    const feeRate = 0.035;
    let totalAmount = Number(total_amount);
    if (fee_option === "customer") {
      totalAmount = Math.ceil(totalAmount * (1 + feeRate));
    }

    // Create a single Nomba order for totalAmount
    const orderReference = uuidv4();
    const callbackUrl = `${baseUrl}/invoice-payment-callback?invoiceId=${invoiceId}&orderReference=${orderReference}`;

    const nombaPayload = {
      order: {
        orderReference,
        callbackUrl,
        customerEmail: signee_email,
        amount: totalAmount,
        currency: "NGN",
        accountId: process.env.NOMBA_ACCOUNT_ID,
      },
    };

    const nombaResponse = await fetch(
      `${process.env.NOMBA_URL}/v1/checkout/order`,
      {
        method: "POST",
        headers: {
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nombaPayload),
      }
    );

    const nombaData = await nombaResponse.json();
    if (!nombaResponse.ok || !nombaData?.data?.checkoutLink) {
      return NextResponse.json(
        { message: "Failed to create Nomba checkout", error: nombaData },
        { status: 400 }
      );
    }

    const paymentLink = nombaData.data.checkoutLink;

    // Insert invoice into Supabase
    const { error: supabaseError } = await supabase.from("invoices").insert([
      {
        user_id: userId,
        invoice_id: invoiceId,
        order_reference: orderReference,
        initiator_email,
        initiator_name,
        signing_link: signingLink,
        signee_name,
        signee_email,
        message,
        bill_to,
        issue_date: new Date(issue_date).toISOString(),
        due_date: new Date(due_date).toISOString(),
        customer_note,
        invoice_items: JSON.stringify(invoice_items),
        total_amount: totalAmount,
        paid_amount: 0,
        payment_type,
        fee_option,
        unit,
        status,
        payment_link: paymentLink,
        public_token: publicToken,
        created_at: new Date().toISOString(),
      },
    ]);

    console.log("supabaseError", supabaseError);

    if (supabaseError) {
      console.error("Supabase insert error:", supabaseError);
      return NextResponse.json(
        { message: "Failed to save invoice in Supabase", error: supabaseError },
        { status: 400 }
      );
    }

    // Insert initial row in multiple_invoice_payments (for tracking partial payments)
    const { error: paymentError } = await supabase
      .from("multiple_invoice_payments")
      .insert([
        {
          invoice_id: invoiceId,
          order_reference: orderReference,
          payment_link: paymentLink,
          amount: totalAmount,
          paid_amount: 0,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

    if (paymentError) {
      console.error("Multiple payments insert error:", paymentError);
      return NextResponse.json(
        { message: "Failed to save payment tracking", error: paymentError },
        { status: 400 }
      );
    }

    // Send email
    try {
      await transporter.sendMail({
        from: `Zidwell Invoice <${process.env.EMAIL_USER}>`,
        to: signee_email,
        subject: "New Invoice Payment Request",
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
            <p>Hello <strong>${signee_name}</strong>,</p>
            <p>You have received an invoice from <strong>${initiator_name}</strong>.</p>
            <p>Pay securely using the link below:</p>
            <p><a href="${paymentLink}" target="_blank" style="display:inline-block; background-color:#C29307; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
              Pay Invoice
            </a></p>
            <p>After payment, you’ll be redirected to sign the invoice.</p>
            <p>If you didn’t expect this, you can safely ignore this email.</p>
            <p style="margin-top: 32px; font-size: 13px; color: #888;">– Zidwell Contracts</p>
          </div>
        `,
      });
    } catch (emailError: any) {
      console.error("Email send error:", emailError);
      return NextResponse.json(
        {
          message: "Invoice saved but failed to send email",
          error: emailError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Invoice created and email sent", paymentLink },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err.message },
      { status: 500 }
    );
  }
}
