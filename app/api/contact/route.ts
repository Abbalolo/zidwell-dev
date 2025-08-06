// app/api/contact/route.ts
import { transporter } from "@/lib/node-mailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
     const body = await req.json();
    const { name, email, message } = body

    // console.log(body)

    if (!name || !email || !message) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: "New Customer Inquiry via Zidwell Contact Form",
      html: `
  <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px; line-height: 1.6;">
    <h2 style="color: #0057b8;">📩 New Contact Message Received</h2>

    <p>You have received a new message through the <strong>Zidwell</strong> contact form.</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p style="margin-left: 10px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #0057b8;">
      ${message}
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

    <p style="font-size: 14px; color: #999;">This message was automatically sent from the Zidwell support form.</p>
  </div>
`,
    });

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
