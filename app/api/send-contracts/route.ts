import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { dbAdmin, admin } from "@/app/firebase/firebaseAdmin";

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
    const signingLink = `${process.env.NEXT_PUBLIC_DEV_URL}/sign/${token}`;

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    await dbAdmin.collection("contracts").doc(token).set({
      signeeEmail,
      initiatorEmail,
      contractText,
      contractTitle,
      token,
      status,
      verificationCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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
  `
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
