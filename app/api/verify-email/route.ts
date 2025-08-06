import { NextRequest, NextResponse } from "next/server";
import { authAdmin } from "../../firebase/firebaseAdmin";
import { transporter } from "@/lib/node-mailer";





// Only POST is handled
export async function POST(req: NextRequest) {



  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const link = await authAdmin.generateEmailVerificationLink(email);

    await transporter.sendMail({
      from: `"Zidwell" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family:sans-serif; max-width:600px; margin:auto; padding:20px;">
          <h2>Welcome to Zidwell App!</h2>
          <p>Please click the button below to verify your email address.</p>
          <a href="${link}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>
          <p style="margin-top:20px;">Or copy and paste this link into your browser:</p>
          <p>${link}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Email sent" });
  } catch (err) {
    console.error("Email verification error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
