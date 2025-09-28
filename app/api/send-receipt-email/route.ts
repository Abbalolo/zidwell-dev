// /api/send-receipt-email.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { transporter } from "@/lib/node-mailer";

const logoPath = path.join(process.cwd(), "public", "logo.png");
const logoBuffer = fs.readFileSync(logoPath);
const base64Logo = `data:image/png;base64,${logoBuffer.toString("base64")}`;

export async function POST(request: Request) {
  try {
    const { email, receipt } = await request.json();
    // console.log(receipt)
    if (!email || !receipt) {
      return NextResponse.json(
        { message: "Email or receipt data missing" },
        { status: 400 }
      );
    }

    const totalAmount =
      receipt.receipt_items?.reduce((sum: number, item: any) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        return sum + quantity * price;
      }, 0) || 0;

    const formattedTotal = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(totalAmount);

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="bg-white max-w-4xl mx-auto p-8 rounded-xl shadow-lg">
    <div class="flex items-center justify-between border-b pb-4 mb-6">
      <img src="${base64Logo}" alt="Logo" class="h-10 w-10" />
      <div>
        <h1 class="text-2xl font-bold">RECEIPT</h1>
        <p class="text-sm text-gray-500">Transaction Record</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div>
        <h2 class="font-semibold text-gray-700 mb-2">From:</h2>
        <p class="text-gray-800 whitespace-pre-line">${
          receipt.initiator_name
        }</p>
      </div>
      <div>
        <h2 class="font-semibold text-gray-700 mb-2">Bill To:</h2>
        <p class="text-gray-800 whitespace-pre-line">${receipt.bill_to}</p>
      </div>
    </div>

    <div class="mb-6">
      <h2 class="font-semibold text-gray-700 mb-2">Receipt Details:</h2>
      <p><strong>Receipt #:</strong> ${receipt.receipt_id || "N/A"}</p>
      <p><strong>Issue Date:</strong> ${receipt.issue_date || "N/A"}</p>
      <p><strong>Payment For:</strong> ${receipt.payment_for || "N/A"}</p>
    </div>

    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">Items</h2>
      <table class="w-full table-auto border rounded-lg">
        <thead class="bg-gray-100">
          <tr>
            <th class="text-left p-2">Description</th>
            <th class="text-center p-2">Qty</th>
            <th class="text-right p-2">Rate</th>
            <th class="text-right p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${
            receipt.receipt_items
              ?.map(
                (item: any) => `
              <tr>
                <td class="p-2">${item.item}</td>
                <td class="text-center p-2">${item.quantity}</td>
                <td class="text-right p-2">${Number(item.price).toLocaleString(
                  "en-NG",
                  { style: "currency", currency: "NGN" }
                )}</td>
                <td class="text-right p-2">${(
                  item.quantity * item.price
                ).toLocaleString("en-NG", {
                  style: "currency",
                  currency: "NGN",
                })}</td>
              </tr>
            `
              )
              .join("") || ""
          }
        </tbody>
      </table>
    </div>

    <div class="text-right mb-6">
      <p class="text-xl font-bold">Total: ${formattedTotal}</p>
    </div>

    <div class="mb-6">
      <h3 class="font-semibold mb-2">Notes:</h3>
      <p class="text-gray-700">${
        receipt.customer_note || "Thank you for your payment!"
      }</p>
    </div>

    <div class="text-center text-sm text-gray-500 border-t pt-4">
      <p>This receipt is a record of your transaction. Please keep it for your records.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-api", "--disable-setuid-api"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBytes = await page.pdf({ format: "A4", printBackground: true });
    const pdfBuffer = Buffer.from(pdfBytes);
    await browser.close();

    // Send emails to both sender and receiver
    const recipients = [
      {
        email: email,
        subject: "Receipt Sent to Client",
        text: `Dear Partner,\n\nPlease find attached a copy of the receipt sent to the client for your records.\n\nBest regards,\nZidwell Team`,
      },
      {
        email: receipt.signee_email,
        subject: "Your Receipt from Zidwell",
        text: `Dear ${
          receipt.bill_to || "Client"
        },\n\nPlease find attached your receipt for the recent transaction.\n\nThank you,\nZidwell`,
      },
    ];

    for (const recipient of recipients) {
      await transporter.sendMail({
        from: `"Zidwell" <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject: recipient.subject,
        text: recipient.text,
        attachments: [
          {
            filename: "receipt.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    }

    return NextResponse.json({ message: "Emails sent successfully." });
  } catch (error: any) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { message: "Failed to send receipt email", error: error.message },
      { status: 500 }
    );
  }
}
