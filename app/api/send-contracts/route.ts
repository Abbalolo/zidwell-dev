import { v4 as uuidv4 } from "uuid";

import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { signeeEmail, contractText, contractTitle, initiatorEmail, status } =
      body;

    if (
      !signeeEmail ||
      !contractText ||
      !contractTitle ||
      !initiatorEmail ||
      !status
    ) {
      return new Response(JSON.stringify({ message: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = uuidv4();
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;
    const signingLink = `${baseUrl}/sign-contract/${token}`;
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // ⬇️ Store in Supabase
    const { error } = await supabase.from("contracts").insert({
      token,
      signee_email: signeeEmail,
      initiator_email: initiatorEmail,
      contract_text: contractText,
      contract_title: contractTitle,
      signing_link: signingLink,
      status,
      verification_code: verificationCode,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(
        JSON.stringify({ message: "Failed to save contract" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_USER}>`,
      to: signeeEmail,
      subject: "You’ve been invited to sign a contract",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; font-size: 15px;">
          <p>Hello,</p>
          <p>You have received a new contract that requires your signature.</p>
          <p style="color: #C29307; font-weight: bold;">
            Your verification code: <span style="font-size: 16px;">${verificationCode}</span>
          </p>
          <p>Please click the secure link below to review and sign the document:</p>
          <a href="${signingLink}" target="_blank" rel="noopener noreferrer"
            style="display: inline-block; background-color: #C29307; color: white; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; cursor:pointer">
            Review & Sign Contract
          </a>
          <p style="margin-top: 20px;"><strong>Or copy and paste this link into your browser:</strong></p>
          <a href="${signingLink}" style="color: #C29307;">${signingLink}</a>
          <p>If you did not request this, you can safely ignore this email.</p>
          <p style="margin-top: 30px; font-size: 13px; color: #999;">
            – Zidwell Contracts
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ message: "Email sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending signature request:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
