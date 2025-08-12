import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import supabase from "@/app/supabase/supabase";
import { transporter } from "@/lib/node-mailer";

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

// Generate the Invoice HTML
function generateInvoiceHTML(invoice: any, logo: string, signeeName:string): string {
  const total = invoice.invoice_items?.reduce((sum: number, item: any) => {
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
      <title>Invoice</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
          padding: 20px;
        }

        .signatures {
          margin-top: 20px;
          display: flex;
          gap:10px;
          font-weight: bold;

}
      </style>
    </head>
    <body>
      <div class="bg-white w-full max-w-4xl rounded-xl shadow-2xl mx-auto my-8 overflow-hidden">
        <div class="bg-gray-200 px-8 py-6 flex justify-between items-center">
          <img src="${logo}" alt="Logo" class="h-10 w-10 mr-2" />
          <div>
            <h1 class="text-2xl font-bold">INVOICE</h1>
            <p class="text-sm mt-1">Professional Invoice Document</p>
          </div>
        </div>

        <div class="p-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="space-y-6">
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Invoice #:</span>
                    <span class="font-semibold text-blue-600">#${invoice.invoiceId || "12345"}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Issue Date:</span>
                    <span class="text-gray-800">${invoice.issue_date || "N/A"}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Due Date:</span>
                    <span class="text-gray-800">${invoice.due_date || "N/A"}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Delivery:</span>
                    <span class="text-gray-800">${invoice.delivery_issue || "Standard"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">From</h2>
                <p class="text-gray-800 whitespace-pre-line">${invoice.initiator_name || "Your Business\nLagos, NG"}</p>
              </div>
              <div class="bg-gray-50 p-6 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Bill To</h2>
                <p class="text-gray-800 whitespace-pre-line">${invoice.bill_to || "Client Name\nAbuja, NG"}</p>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <div class="bg-gray-100 border-l-4 border-gray-300 p-6 rounded-r-lg">
              <h3 class="font-semibold text-gray-800 mb-2">Message</h3>
              <p class="text-gray-700">${invoice.customer_note || "Thanks for your business. Payment due in 14 days."}</p>
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
                  ${invoice.invoice_items
                    ?.map(
                      (item: any) => `
                    <tr class="border-b hover:bg-gray-50">
                      <td class="p-4 text-gray-800">${item.item}</td>
                      <td class="p-4 text-center text-gray-800">${item.quantity}</td>
                      <td class="p-4 text-right text-gray-800">${item.price}</td>
                      <td class="p-4 text-right font-semibold text-gray-800">${item.quantity * item.price}</td>
                    </tr>
                  `
                    )
                    .join("") || ""}
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex justify-end mb-8">
            <div class="bg-gray-200 p-6 rounded-lg min-w-80">
              <div class="space-y-3">
                <div class="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>${formattedTotal}</span>
                </div>
                <div class="border-t border-blue-200 pt-3">
                  <div class="flex justify-between text-xl font-bold">
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
              <p class="text-gray-800 whitespace-pre-line">${invoice.account_to_pay_name}</p>
            </div>
            <div class="bg-gray-50 p-6 rounded-lg border">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Bank Account Name</h2>
              <p class="text-gray-800 whitespace-pre-line">${invoice.account_name}</p>
            </div>
            <div class="bg-gray-50 p-6 rounded-lg border">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Bank Account Number</h2>
              <p class="text-gray-800 whitespace-pre-line">${invoice.account_number}</p>
            </div>
          </div>

          <div class="bg-gray-50 p-6 rounded-lg border mt-6">
            <h3 class="font-semibold text-gray-800 mb-3">Customer Notes</h3>
            <p class="text-gray-600">${invoice.customer_note || "Please contact us for any issues with this invoice."}</p>
          </div>

          <div class="signatures">
        <p>Signee: ${invoice.initiator_name}</p>
          <p>Date: ${invoice.created_at}</p>
       </div>

          <div class="signatures">
          <p>Signee: ${signeeName}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>

          <div class="mt-8 pt-6 border-t text-center">
            <p class="text-gray-500 text-sm">Thank you for your business! Please remit payment by the due date.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
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

// Main API Handler
export async function POST(request: Request) {
  try {
    const { token, signeeEmail, verificationCode } = await request.json();

    if (!token || !signeeEmail || !verificationCode) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    // if (invoice.signee_name !== signeeEmail) {
    //   return NextResponse.json({ message: "Email does not match" }, { status: 403 });
    // }

    if (invoice.verification_code !== verificationCode) {
     
      return NextResponse.json({ message: "Invalid verification code" }, { status: 401 });
    }

    await supabase
      .from("invoices")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
      })
      .eq("token", token);

    const logo = getLogoBase64();
    const html = generateInvoiceHTML(invoice, logo, invoice.signee_name || "Signee Name");
    const pdfBuffer = await generatePdfBufferFromHtml(html);

   
    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: `${invoice.initiator_email}, ${invoice.signee_email}`,
      subject: "Invoice Signed Successfully",
      html: `<p>The invoice has been signed successfully. See attached PDF.</p>`,
      attachments: [
        {
          filename: `${invoice.invoiceId || "invoice"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ message: "Invoice signed and emailed" }, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
