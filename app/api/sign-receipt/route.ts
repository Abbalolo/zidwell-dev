import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// Convert logo to base64
function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const imageBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (err) {
    console.error("Error loading logo:", err);
    return "";
  }
}

// Generate the Receipt HTML
function generateReceiptHTML(receipt: any, logo: string, signeeName: string) {
  const total =
    receipt.receipt_items?.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.price;
    }, 0) || 0;

  const formattedTotal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(total);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f9fafb; padding: 20px; }
    .signatures { margin-top: 20px; display: flex; gap: 10px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="bg-white max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden">
    <div class="bg-gray-200 px-8 py-6 flex justify-between items-center">
      <img src="${logo}" alt="Logo" class="h-10 w-10" />
      <div><h1 class="text-2xl font-bold">RECEIPT</h1></div>
    </div>
    <div class="p-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <p><strong>Receipt #:</strong> ${receipt.receipt_id || "N/A"}</p>
          <p><strong>Issue Date:</strong> ${receipt.issue_date || "N/A"}</p>
          <p><strong>Payment For:</strong> ${receipt.payment_for || "N/A"}</p>
        </div>
        <div>
          <p><strong>From:</strong><br/>${receipt.initiator_name}</p>
          <p><strong>Bill To:</strong><br/>${receipt.bill_to}</p>
        </div>
      </div>
      <table class="w-full table-auto border mb-6">
        <thead>
          <tr class="bg-gray-100"><th>Description</th><th class="text-center">Qty</th><th class="text-right">Rate</th><th class="text-right">Total</th></tr>
        </thead>
        <tbody>
          ${
            receipt.receipt_items
              ?.map(
                (i: any) => `
            <tr>
              <td>${i.item}</td>
              <td class="text-center">${i.quantity}</td>
              <td class="text-right">${Number(i.price).toLocaleString("en-NG", {
                style: "currency",
                currency: "NGN",
              })}</td>
              <td class="text-right">${(i.quantity * i.price).toLocaleString(
                "en-NG",
                { style: "currency", currency: "NGN" }
              )}</td>
            </tr>`
              )
              .join("") || ""
          }
        </tbody>
      </table>
      <p class="text-right text-xl font-bold">Total: ${formattedTotal}</p>
      <div class="bg-gray-50 rounded-lg p-4 mt-6">${
        receipt.customer_note || ""
      }</div>
      <div class="signatures">
        <div><strong>Initiator:</strong> ${receipt.initiator_name}</div>
        <div><strong>Date:</strong> ${
          receipt.signed_at || new Date().toLocaleDateString()
        }</div>
      </div>

        <div class="signatures">
          <p>Signee: ${signeeName}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
  </div>
</body>
</html>`;
}

// Generate PDF
async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return Buffer.from(pdf);
}

// API Handler
export async function POST(request: Request) {
  try {
    const { token, signeeEmail, verificationCode } = await request.json();
    if (!token || !signeeEmail || !verificationCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: receipt, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("token", token)
      .single();
    if (error || !receipt)
      return NextResponse.json(
        { message: "Receipt not found" },
        { status: 404 }
      );
    if (receipt.verification_code !== verificationCode) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 401 }
      );
    }

    await supabase
      .from("receipts")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
      })
      .eq("token", token);

    const logo = getLogoBase64();
    const html = generateReceiptHTML(
      receipt,
      logo,
      receipt.signee_name || "Signee Name"
    );
    const pdfBuffer = await generatePdfBufferFromHtml(html);

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: [receipt.initiator_email, receipt.signee_email].join(","),
      subject: "Receipt Signed Successfully",
      html: `<p>The receipt has been signed successfully. See attached PDF.</p>`,
      attachments: [
        { filename: `${receipt.receipt_id}.pdf`, content: pdfBuffer },
      ],
    });

    return NextResponse.json(
      { message: "Receipt signed and emailed" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
