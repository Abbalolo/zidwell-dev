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

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

// Convert logo to base64
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

// Safe helper to parse invoice items
function parseInvoiceItems(invoice: any): any[] {
  try {
    if (Array.isArray(invoice.invoice_items)) return invoice.invoice_items;
    if (typeof invoice.invoice_items === "string")
      return JSON.parse(invoice.invoice_items);
  } catch (err) {
    console.error("Failed to parse invoice_items:", invoice.invoice_items, err);
  }
  return [];
}

// Generate the Invoice HTML
function generateInvoiceHTML(invoice: any, logo: string): string {
  const items = parseInvoiceItems(invoice);

  const total = items.reduce(
    (sum: number, item: any) => sum + (item.quantity || 0) * (item.price || 0),
    0
  );

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
  <title>Invoice</title>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f9fafb;
      padding: 20px;
      margin: 0;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 5px 25px rgba(0,0,0,0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    .logo-con {
     display: flex;
     justify-content: start;
     align-items: center;

    }
.logo-img{
  width: 50px;
  height: 50px;

  object-fit: contain;
}
    .header {
      background: linear-gradient(90deg, #C29307, #937108);
      color: #fff;
      padding: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title h1 {
      font-size: 2.2rem;
      margin: 0; 
      margin-right: 10px;
    }

    .header-title p {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .invoice-id {
      font-size: 1.8rem;
      font-weight: bold;
      text-align: right;
    }

    .status-badge {
      margin-top: 8px;
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      background: #facc15;
      color: #000;
      font-weight: bold;
    }

    .section {
      padding: 30px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
    }

    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      background: #fdfdfd;
    }

    .card h2 {
      font-size: 1.2rem;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1f2937;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }

    .message {
      border-left: 4px solid #C29307;
      padding: 15px 20px;
      margin-bottom: 30px;
      background: #f0f4ff;
    }

    .message h3 {
      margin-top: 0;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 1rem;
    }

    .invoice-items {
      margin-bottom: 30px;
    }

    .invoice-items h2 {
      margin-bottom: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #e5e7eb;
    }

    th, td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }

    th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #111827;
    }

    td {
      color: #374151;
    }

    tr:hover td {
      background: #f9fafb;
    }

    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }

    .totals-box {
      min-width: 300px;
      border: 1px solid #e5e7eb;
      padding: 20px;
      background: #f0f4ff;
      border-radius: 8px;
    }

    .totals-box div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 1rem;
    }

    .totals-box .total {
      font-size: 1.3rem;
      font-weight: bold;
      margin-top: 10px;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
      color: #C29307;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e5e7eb;
      padding-top: 30px;
      margin-bottom: 30px;
    }

    .signature {
      text-align: center;
    }

    .signature-line {
      height: 0;
      border-bottom: 1px solid #9ca3af;
      width: 200px;
      margin: 0 auto 10px;
    }

    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 15px;
      text-align: center;
      color: #6b7280;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-title">
        <div class="logo-con">
        <h1>INVOICE</h1>
              <img src="${logo}" alt="Logo" class="logo-img" />
        </div>
        <p>Professional Invoice Document</p>
      </div>
      <div>
        <div class="invoice-id">#${invoice.invoice_id || "12345"}</div>
        <div class="status-badge">${invoice.status || "unpaid"}</div>
      </div>
    </div>

    <!-- Invoice Body -->
    <div class="section">
      <div class="grid">
        <!-- Invoice Details -->
        <div class="card">
          <h2>📅 Invoice Details</h2>
          <div class="info-row"><span>Issue Date:</span><span>${invoice.issue_date || "N/A"}</span></div>
          <div class="info-row"><span>Due Date:</span><span>${invoice.due_date || "N/A"}</span></div>
          <div class="info-row"><span>Payment Type:</span><span>${invoice.payment_type || "N/A"}</span></div>
          <div class="info-row"><span>Fee Option:</span><span>${invoice.fee_option || "N/A"}</span></div>
          <div class="info-row"><span>Unit Price:</span><span>${invoice.unit_price || "N/A"}</span></div>
        </div>

        <!-- Billing Information -->
        <div>
          <div class="card">
            <h2>👤 From</h2>
            <p>${invoice.initiator_name || "Your Business\nLagos, NG"}</p>
          </div>

          <div class="card" style="margin-top: 20px;">
            <h2>📍 Bill To</h2>
            <p>${invoice.bill_to || "Client Name\nAbuja, NG"}</p>
          </div>
        </div>
      </div>

      <!-- Customer Message -->
      <div class="message">
        <h3>Message</h3>
        <p>${invoice.customer_note || "Thanks for your business. Payment due in 14 days."}</p>
      </div>

      <!-- Invoice Items -->
      <div class="invoice-items">
        <h2>Invoice Items</h2>
        <table>



          
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Rate</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
 <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.item}</td>
                  <td>${item.quantity}</td>
                  <td>₦${Number(item.price).toLocaleString("en-NG")}</td>
                  <td>₦${Number(item.quantity * item.price).toLocaleString("en-NG")}</td>
                </tr>
              `).join("")}
            </tbody>

        </table>
      </div>

      <!-- Totals -->
      <div class="totals">
        <div class="totals-box">
          <div><span>Subtotal:</span><span>${formattedTotal}</span></div>
          <div class="total"><span>Total:</span><span>${formattedTotal}</span></div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div class="signature">
          <div class="signature-line"></div>
          <p><strong>${invoice.initiator_name}</strong></p>
          <p>Initiator</p>
          <p>${new Date(invoice.created_at).toLocaleDateString()}</p>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <p><strong>${invoice.signee_name}</strong></p>
          <p>Signee</p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        Thank you for your business! Please remit payment by the due date.
      </div>
    </div>
  </div>
</body>
</html>
`;




}

async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" }); 
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return Buffer.from(pdf);
}
export async function POST(request: Request) {
  try {
    const { invoiceId, sendPaymentConfirmation } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ message: "Missing invoiceId" }, { status: 400 });
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("invoice_id", invoiceId)
      .single();

    console.log("from signing", invoice);

    if (error || !invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    const logo = getLogoBase64();
    const html = generateInvoiceHTML(invoice, logo);
    const pdfBuffer = await generatePdfBufferFromHtml(html);

    let subject = "Invoice Generated Successfully";
    let bodyHtml = `<p>The invoice has been generated successfully. See attached PDF.</p>`;

    if (sendPaymentConfirmation) {
      subject = `Payment Confirmation - Invoice #${invoice.invoice_id}`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: green;">Payment Confirmed</h2>
          <p>Hello ${invoice.signee_name},</p>
          <p>Your payment of <b>₦${Number(invoice.total_amount).toLocaleString("en-NG")}<</b> for invoice <b>#${invoice.invoice_id}</b> has been received.</p>
          <p>You can now sign your invoice using the link below:</p>
        </div>
      `;
    }

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: `${invoice.signee_email}, ${invoice.initiator_email}`,
      subject,
      html: bodyHtml,
      attachments: [
        {
          filename: `${invoice.invoice_id || "invoice"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json(
      { message: "Invoice email sent", sendPaymentConfirmation: !!sendPaymentConfirmation },
      { status: 200 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
