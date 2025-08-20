import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
// import supabase from "@/app/supabase/supabase";
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);
function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const imageBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error loading logo:", error);
    return "";
  }
}

function getWatermarkBase64() {
  try {
    const watermarkPath = path.join(
      process.cwd(),
      "public",
      "zidwell-watermark.png"
    );
    const imageBuffer = fs.readFileSync(watermarkPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error loading watermark:", error);
    return "";
  }
}

function generateContractHTML(
  contract: any,
  logo: string,
  watermark: string,
  signeeName: string
) {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12pt;
            color: #333;
            padding: 20px;
            background-image: url('${watermark}');
            background-size: cover;
          }
          .logo { max-width: 70px; margin-bottom: 30px; }
          .signatures { margin-top: 10px; display: flex; gap: 20px; }
          footer { font-size: 10pt; color: #999; margin-top: 50px; }
        </style>
      </head>
      <body>
        <img class="logo" src="${logo}" alt="Logo" />
        <h1>${contract.contractTitle || "Contract Agreement"}</h1>
        <div>${(contract.contractText || "").replace(/\n/g, "<br>")}</div>
        <div class="signatures">
          <p>Signee: ${signeeName}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <footer>Zidwell Contracts &copy; ${new Date().getFullYear()}</footer>
      </body>
    </html>
  `;
}

async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return Buffer.from(pdf);
}

export async function POST(request: Request) {
  try {
    const { token, signeeEmail, signeeName, verificationCode } =
      await request.json();

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
console.log()
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

    const logo = getLogoBase64();
    const watermark = getWatermarkBase64();
    const html = generateContractHTML(contract, logo, watermark, signeeName);
    const pdfBuffer = await generatePdfBufferFromHtml(html);

    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_USER}>`,
      to: `${contract.initiator_email}, ${contract.signee_email}`,
      subject: "Contract Signed Successfully",
      html: `<p>The contract has been signed.</p><p>See attached PDF.</p>`,
      attachments: [
        {
          filename: `${contract.contractTitle || "contract"}.pdf`,
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
