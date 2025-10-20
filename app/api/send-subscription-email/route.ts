import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Send confirmation email
async function sendConfirmationEmail(email: string, fullName: string, amount: number) {

  await transporter.sendMail({
    from: `"Subscription Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Payment Successful ✅",
    html: `
      <h2>Hello ${fullName},</h2>
      <p>Your payment of <strong>₦${amount}</strong> was successful ✅</p>
      <p>Your subscription is now active.</p>
      <p>Thank you for your business!</p>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const eventType = payload?.eventType;
    const paymentStatus = payload?.data?.status;
    const orderReference = payload?.data?.orderReference;

    // Ignore irrelevant webhook events
    if (eventType !== "charge.success" || paymentStatus !== "successful") {
      return NextResponse.json({ message: "Ignored non-success event" });
    }

    // Extract metadata from frontend setup
    const subEmail = payload?.data?.meta?.email;
    const subFullName = payload?.data?.meta?.fullName || "Subscriber";
    const subPlanId = payload?.data?.meta?.planId;
    const subAmount =
      payload?.data?.meta?.amount ?? payload?.data?.amount ?? 0;

    // Save to Supabase
    if (subEmail && subPlanId) {
      await supabase.from("subscribers").insert([
        {
          email: subEmail,
          full_name: subFullName,
          plan_id: subPlanId,
          amount: subAmount,
          reference: orderReference,
          status: "active",
          paid_at: new Date().toISOString(),
        },
      ]);
    }

    // Send confirmation email
    await sendConfirmationEmail(subEmail, subFullName, subAmount);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
