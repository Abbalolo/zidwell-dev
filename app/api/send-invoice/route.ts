// app/api/send-invoice/route.ts
import { v4 as uuidv4 } from "uuid";
import { transporter } from "@/lib/node-mailer";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const calculateTotal = (data: any) => {
  return data.invoice_items.reduce(
    (total: any, item: any) => total + item.quantity * item.price,
    0
  );
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, initiatorEmail, initiatorName, invoiceId } = body;

    if (!invoiceId || !data || !initiatorEmail || !initiatorName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;
    const signingLink = `${baseUrl}/sign-invoice/${invoiceId}`;

    // ✅ Generate Flutterwave Payment Link
    const paymentResponse = await fetch(
      "https://api.flutterwave.com/v3/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: `invoice-${invoiceId}-${Date.now()}`,
          amount: calculateTotal(data),
          currency: "NGN",
          redirect_url: `${baseUrl}/invoice-payment-callback/${invoiceId}`,
          customer: {
            email: data.email,
            name: data.name,
          },
          customizations: {
            title: "Invoice Payment",
            description: `Payment for Invoice #${invoiceId}`,
            logo: `${baseUrl}/logo.png`,
          },
        }),
      }
    );

    if (!paymentResponse.ok) {
      return NextResponse.json(
        { message: "Flutterwave request failed" },
        { status: 500 }
      );
    }
    const paymentData = await paymentResponse.json();

    if (!paymentData?.data?.link) {
      throw new Error("Failed to create payment link");
    }

    const paymentLink = paymentData.data.link;

    // ✅ Save invoice in DB (status = pending until webhook confirms payment)
    const { error } = await supabase.from("invoices").upsert(
      [
        {
          initiator_email: initiatorEmail,
          initiator_name: initiatorName,
          invoice_id: invoiceId,
          signing_link: signingLink,
          signee_name: data.name,
          signee_email: data.email,
          message: data.message,
          bill_to: data.bill_to,
          issue_date: data.issue_date,
          due_date: data.due_date,
          delivery_due: data.delivery_due,
          delivery_issue: data.delivery_issue,
          delivery_time: data.delivery_time,
          customer_note: data.customer_note,
          invoice_items: data.invoice_items,
          total_amount: calculateTotal(data),
          payment_link: paymentLink,
          created_at: new Date().toISOString(),
          signature_status: "pending",
        },
      ],
      { onConflict: "invoice_id" }
    );

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { message: "Failed to save invoice" },
        { status: 500 }
      );
    }

    // ✅ Send email to signee
    await transporter.sendMail({
      from: `Zidwell Invoice <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: "New Invoice Payment Request",
      html: `
       <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
  <p style="margin-bottom: 16px;">Hello <strong>${data.name}</strong>,</p>

  <p style="margin-bottom: 16px;">You have received an invoice from <strong>${initiatorName}</strong>.</p>

  <p style="margin-bottom: 16px;">Please click the button below to pay securely:</p>

  <a href="${signingLink}" target="_blank" 
     style="display:inline-block; background-color:#C29307; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold; margin-bottom: 16px;">
    Pay Invoice
  </a>

  <p style="margin: 16px 0; font-weight:bold;">Or copy and paste this link into your browser:</p>
  <p style="margin: 8px 0; word-break: break-all; color:#555;">${signingLink}</p>

  <p style="margin: 16px 0;">After payment, you’ll be redirected to sign the invoice.</p>
  <p style="margin: 16px 0;">If you didn’t expect this, you can safely ignore this email.</p>

  <p style="margin-top: 32px; font-size: 13px; color: #888;">– Zidwell Contracts</p>
</div>

      `,
    });

    return NextResponse.json(
      { message: "Invoice email sent" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending invoice:", error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
