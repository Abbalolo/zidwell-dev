import { NextResponse } from "next/server";
import PDFDocument from 'pdfkit';
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

async function generatePdfBuffer(contract: any, signeeName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk:any) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Add content with basic styling
    doc.fontSize(20).font('Helvetica-Bold')
       .text(contract.contract_title || 'Contract Agreement', 100, 100);
    
    doc.fontSize(12).font('Helvetica')
       .text(contract.contract_text || '', 100, 150, {
         width: 400,
         align: 'left'
       });
    
    // Add signature section
    const signatureY = doc.y + 30;
    doc.text(`Signee: ${signeeName}`, 100, signatureY);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 100, signatureY + 20);

    doc.end();
  });
}

export async function POST(request: Request) {
  try {
    const { token, signeeEmail, signeeName, verificationCode } = await request.json();

    if (!token || !signeeEmail || !verificationCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get contract from Supabase
    const { data: contract, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { message: "Contract not found" },
        { status: 404 }
      );
    }

    if (contract.signee_email !== signeeEmail) {
      return NextResponse.json(
        { message: "Email does not match" },
        { status: 403 }
      );
    }

    if (contract.verification_code !== verificationCode) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 401 }
      );
    }

    // Update contract status
    await supabase
      .from("contracts")
      .update({
        signee_name: signeeName,
        status: "signed",
        signed_at: new Date().toISOString(),
      })
      .eq("token", token);

    // Generate PDF
    const pdfBuffer = await generatePdfBuffer(contract, signeeName);


    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_USER}>`,
      to: `${contract.initiator_email}, ${contract.signee_email}`,
      subject: "Contract Signed Successfully",
      html: `<p>The contract has been signed.</p><p>See attached PDF.</p>`,
      attachments: [
        {
          filename: `${contract.contract_title || "contract"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json(
      { message: "Contract signed and emailed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}