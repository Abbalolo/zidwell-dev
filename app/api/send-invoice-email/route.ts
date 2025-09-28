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
    const { email, invoice } = await request.json();

    if (!email || !invoice) {
      return NextResponse.json(
        { message: "Email or data missing" },
        { status: 400 }
      );
    }

    const totalAmount =
      invoice.invoiceItems?.reduce((sum: number, item: any) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        return sum + quantity * price;
      }, 0) || 0;

    const formattedTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "NGN",
    }).format(totalAmount);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invoice</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
        }
        .no-print {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="bg-white w-full max-w-4xl rounded-xl shadow-2xl mx-auto my-8 overflow-hidden max-h-[95vh] flex flex-col">
        <div class="bg-gray-200 px-8 py-6 flex justify-between items-center">
       <img src="${base64Logo}" alt="Logo" class="h-8 w-8 mr-2" />
          <div>
            <h1 class="text-2xl font-bold text-white">INVOICE</h1>
            <p class="text-white text-sm mt-1">Professional Invoice Document</p>
          </div>
        </div>

        <div class="flex-1 overflow-auto p-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="space-y-6">
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Invoice #:</span>
                    <span class="font-semibold text-gray-600">#${
                      invoice.invoiceId || "12345"
                    }</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Issue Date:</span>
                    <span class="text-gray-800">${
                      invoice.issueDate || "N/A"
                    }</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Due Date:</span>
                    <span class="text-gray-800">${
                      invoice.dueDate || "N/A"
                    }</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Delivery:</span>
                    <span class="text-gray-800">${
                      invoice.deliveryIssue || "Standard"
                    }</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">From</h2>
                <p class="text-gray-800 leading-relaxed whitespace-pre-line">${
                  invoice.initiator_name || "Your Business\nLagos, NG"
                }</p>
              </div>
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Bill To</h2>
                <p class="text-gray-800 leading-relaxed whitespace-pre-line">${
                  invoice.billTo || "Client Name\nAbuja, NG"
                }</p>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <div class="bg-blue-100 border-l-4 border-gray-500 p-6 rounded-r-lg">
              <h3 class="font-semibold text-gray-800 mb-2">Message</h3>
              <p class="text-gray-700 leading-relaxed">${
                invoice.customerNote ||
                "Thanks for your business. Payment due in 14 days."
              }</p>
            </div>
          </div>

          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Invoice Items</h2>
            <div class="overflow-x-auto border rounded-lg">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="text-left p-4 font-semibold text-gray-800 border-b">Description</th>
                    <th class="text-center p-4 font-semibold text-gray-800 border-b w-24">Qty</th>
                    <th class="text-right p-4 font-semibold text-gray-800 border-b w-32">Rate</th>
                    <th class="text-right p-4 font-semibold text-gray-800 border-b w-32">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    invoice.invoiceItems
                      ?.map(
                        (item: any) => `
                      <tr class="border-b hover:bg-gray-50">
                        <td class="p-4 text-gray-800">${item.item}</td>
                        <td class="p-4 text-center text-gray-800">${
                          item.quantity
                        }</td>
                        <td class="p-4 text-right text-gray-800">${
                          item.price
                        }</td>
                        <td class="p-4 text-right font-semibold text-gray-800">${
                          item.quantity * item.price
                        }</td>
                      </tr>
                    `
                      )
                      .join("") || ""
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex justify-end mb-8">
            <div class="bg-gray-200 p-6 rounded-lg text-white min-w-80">
              <div class="space-y-3">
                <div class="flex justify-between text-lg gap-2">
                  <span>Subtotal:</span>
                   <span>${formattedTotal}</span>
                </div>
                <div class="border-t border-blue-200 pt-3">
                  <div class="flex justify-between gap-2 text-xl font-bold">
                    <span>Total:</span>
                    <span>${formattedTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div class="space-y-6">
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Account Name</h2>
                <p class="text-gray-800 leading-relaxed whitespace-pre-line">${
                  invoice.accountToPayName
                }</p>
              </div>
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Bank Account Name</h2>
                <p class="text-gray-800 leading-relaxed whitespace-pre-line">${
                  invoice.accountName
                }</p>
              </div>
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Bank Account Number</h2>
                <p class="text-gray-800 leading-relaxed whitespace-pre-line">${
                  invoice.accountNumber
                }</p>
              </div>
            </div>

        
          <div class="bg-gray-50 p-6 rounded-lg border">
            <h3 class="font-semibold text-gray-800 mb-3">Customer Notes</h3>
            <p class="text-gray-600 leading-relaxed">${
              invoice.customerNote ||
              "Please contact us for any issues with this invoice."
            }</p>
          </div>

          <div class="mt-8 pt-6 border-t text-center">
            <p class="text-gray-500 text-sm">
              Thank you for your business! Please remit payment by the due date.
            </p>
          </div>
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

    const recipients = [
      {
        email: email,
        subject: "Invoice Sent to Client",
        text: `Dear Partner,\n\nPlease find attached a copy of the invoice sent to the client for your records.\n\nBest regards,\nZidwell Team`,
      },
      {
        email: invoice.signee_email,
        subject: "Your Invoice from Zidwell",
        text: `Dear ${
          invoice.billTo || "Client"
        },\n\nPlease find attached your invoice for the recent transaction. Kindly review and let us know if you have any questions.\n\nThank you,\nZidwell`,
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
            filename: "invoice.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    }

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { message: "Failed to send email", error: error.message },
      { status: 500 }
    );
  }
}
