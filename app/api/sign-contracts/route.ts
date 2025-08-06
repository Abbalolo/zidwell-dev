import { NextResponse } from "next/server";
import { dbAdmin, admin } from "@/app/firebase/firebaseAdmin";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";

// Read base64 logo from /public/logo.png
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

// Read base64 watermark from /public/zidwell-watermark.png
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

// Generate styled HTML for PDF
function generateContractHTML(
  contract: any,
  base64Logo: string,
  base64Watermark: string,
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
            margin: 0;
            background-image: url('${base64Watermark}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }
         
          .logo {
            display: block;
            max-width: 70px;
            margin: 0 auto 30px;
          }
          h1 {
            font-size: 24px;
            text-align: center;
            margin-bottom: 20px;
            color: #1a237e;
          }
          .content {
            line-height: 1.6;
            white-space: pre-wrap;
          }
            .signatures {
            margin-top: 10px;  
            display: flex;
            gap: 20px;
            justify-content: start;
            align-items: center;
            font-size: 16px;
          }
          footer {
            font-size: 10pt;
            color: #999;
            text-align: center;
            margin-top: 50px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="logo" src="${base64Logo}" alt="Zidwell Logo" />
          <h1>${contract.contractTitle || "Contract Agreement"}</h1>
          <div class="content">${(contract.contractText || "").replace(
            /\n/g,
            "<br>"
          )}</div>
           <div class="signatures">
          <p class="">Signee Signature:  ${signeeName || "Contract Signature"}</p>
          <p class="">Signee Date: ${new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>

          </div>
          <footer>
            Zidwell Contracts &copy; ${new Date().getFullYear()} – Confidential
          </footer>
        </div>
      </body>
    </html>
  `;
}

// Generate PDF Buffer from HTML using Puppeteer
async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "", bottom: "", left: "", right: "" },
  });
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

    const docRef = dbAdmin.collection("contracts").doc(token);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { message: "Contract not found" },
        { status: 404 }
      );
    }

    const contract = doc.data();

    if (contract?.signeeEmail !== signeeEmail) {
      return NextResponse.json(
        { message: "Email does not match" },
        { status: 403 }
      );
    }

    if (contract?.verificationCode !== verificationCode) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 401 }
      );
    }

    await docRef.update({
      signeeName: signeeName,
      status: "signed",
      signedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const base64Logo = getLogoBase64();
    const base64Watermark = getWatermarkBase64();
    const html = generateContractHTML(contract, base64Logo, base64Watermark, signeeName);
    const pdfBuffer = await generatePdfBufferFromHtml(html);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_USER}>`,
      to: `${contract?.initiatorEmail}, ${contract?.signeeEmail}`,
      subject: "Contract Signed Successfully",
      html: `
        <p>The contract between <strong>${contract?.initiatorEmail}</strong> and <strong>${contract?.signeeEmail}</strong> has been signed.</p>
        <p>The signed contract is attached below as a PDF.</p>
      `,
      attachments: [
        {
          filename: `${contract?.contractTitle || "contract"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json(
      { message: "Contract signed and PDF emailed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending signed contract:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
