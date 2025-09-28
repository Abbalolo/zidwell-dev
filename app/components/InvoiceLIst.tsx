import { Download, Edit, Eye, Loader2} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import InvoicePreview from "./previews/InvoicePreview";
import { useRouter } from "next/navigation";
import { useUserContextData } from "../context/userData";
import Swal from "sweetalert2";

import withReactContent from "sweetalert2-react-content";
import Loader from "./Loader";

const getBase64Logo = async () => {
  const response = await fetch("/logo.png");
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const MySwal = withReactContent(Swal);

type Props = {
  invoices: any[];
  loading: boolean;
};

const InvoiceList: React.FC<Props> = ({ invoices, loading }) => {
  const statusColors: Record<string, string> = {
    unpaid: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
    paid: "bg-blue-100 text-blue-800",
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(
    null
  );

  const [processing2, setProcessing2] = useState(false);
  const { userData } = useUserContextData();

  const router = useRouter();

  const [base64Logo, setBase64Logo] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      const logo = await getBase64Logo();
      setBase64Logo(logo);
    };

    loadLogo();
  }, []);

  // Place this function outside the component or loop
  const downloadPdf = async (invoice: any) => {
    const invoiceItems = Array.isArray(invoice.invoice_items)
      ? invoice.invoice_items
      : JSON.parse(invoice.invoice_items || "[]");

    const totalAmount = invoiceItems.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );

    const formattedTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "NGN",
    }).format(totalAmount);

    const formattedCreatedAt = invoice.created_at
      ? new Date(invoice.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";
    const formattedSignedAt = invoice.created_at
      ? new Date(invoice.signed_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    const signedSection =
      invoice.signee_name && invoice.signed_at
        ? `
      <div class="signatures">
        <p>Signee: ${invoice.signee_name}</p>
        <p>Date: ${formattedSignedAt}</p>
      </div>
    `
        : "";

    const fullHtml = `
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
              <img src="${base64Logo}" alt="Logo" class="logo-img" />
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
          <div class="info-row"><span>Issue Date:</span><span>${
            invoice.issue_date || "N/A"
          }</span></div>
          <div class="info-row"><span>Due Date:</span><span>${
            invoice.due_date || "N/A"
          }</span></div>
          <div class="info-row"><span>Payment Type:</span><span>${
            invoice.payment_type || "N/A"
          }</span></div>
          <div class="info-row"><span>Fee Option:</span><span>${
            invoice.fee_option || "N/A"
          }</span></div>
          <div class="info-row"><span>Unit Price:</span><span>${
            invoice.unit_price || "N/A"
          }</span></div>
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
        <p>${
          invoice.customer_note ||
          "Thanks for your business. Payment due in 14 days."
        }</p>
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
  ${invoiceItems
    .map(
      (item: any) => `
        <tr>
          <td>${item.item}</td>
          <td>${item.quantity}</td>
          <td>₦${Number(item.price).toLocaleString("en-NG")}</td>
          <td>₦${Number(item.quantity * item.price).toLocaleString(
            "en-NG"
          )}</td>
        </tr>
      `
    )
    .join("")}
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
        ${signedSection}

      <!-- Footer -->
      <div class="footer">
        Thank you for your business! Please remit payment by the due date.
      </div>
    </div>
  </div>
</body>
</html>`;

    try {
      setProcessingInvoiceId(invoice.id);
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullHtml }),
      });

      if (!res.ok) {
        const errorText = await res.text(); // Read once
        throw new Error(errorText || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_id || "download"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const sendInvoiceEmail = async (invoice: any) => {
    if (!userData?.email) return;

    const result = await MySwal.fire({
      title: "Send Invoice",
      text: "How would you like to send the invoice?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `<i class="fa-regular fa-envelope"></i> Send Invoice via Email`,
      cancelButtonText: `<i class="fa-brands fa-whatsapp"></i> Send via WhatsApp`,
      customClass: {
        cancelButton: "whatsapp-button",
      },
      buttonsStyling: true,
      didOpen: () => {
        const whatsappBtn = document.querySelector(".swal2-cancel");
        if (whatsappBtn) {
          (whatsappBtn as HTMLElement).style.backgroundColor = "#25D366";
          (whatsappBtn as HTMLElement).style.color = "#fff";
          (whatsappBtn as HTMLElement).style.border = "none";
        }
      },
    });

    if (result.isConfirmed) {
      try {
        setProcessing2(true);
        const res = await fetch("/api/send-invoice-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userData.email, invoice }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to send invoice email");
        }

        Swal.fire("Sent!", "Invoice sent via email.", "success");
        setProcessing2(false);
        setSelectedInvoice(null);
      } catch (error) {
        console.error("Error sending invoice email:", error);
        Swal.fire(
          "Error",
          "Failed to send invoice email. Please try again.",
          "error"
        );
        setProcessing2(false);
      }
    }
    // else if (result.dismiss === Swal.DismissReason.cancel) {
    //   // Send via WhatsApp
    //   const invoiceUrl = invoice.signing_link;
    //   const message = `Here is your invoice: ${invoiceUrl}`;
    //   const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    //   window.open(whatsappUrl, "_blank");
    //   setProcessing2(false);
    // }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex items-center justify-center text-semibold">
        No invoices records
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices?.map((invoice) => {
        let items: any[] = [];

        try {
          if (Array.isArray(invoice.invoice_items)) {
            items = invoice.invoice_items;
          } else if (typeof invoice.invoice_items === "string") {
            items = JSON.parse(invoice.invoice_items);
          }
        } catch (err) {
          console.error(
            "Failed to parse invoice_items:",
            invoice.invoice_items,
            err
          );
          items = [];
        }

        const totalAmount = items.reduce(
          (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
          0
        );

        return (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {invoice.invoice_id}
                    </h3>
                    <Badge
                      className={
                        statusColors[invoice.status] ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    {invoice.bill_to}
                  </p>
                  <p className="text-gray-600 mb-2">{invoice.message}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>
                      Date: {new Date(invoice.issue_date).toLocaleDateString()}
                    </span>
                    <span>
                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </span>
                    {invoice.created_at && (
                      <span>
                        Signed Date:{" "}
                        {new Date(invoice.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900">
                      {formatNumber(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <Button
                    onClick={() => setSelectedInvoice(invoice)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>

                  <>
                    <Button
                      onClick={() =>
                        router.push(
                          `/dashboard/services/create-invoice/invoice/edit/${invoice.id}`
                        )
                      }
                      variant="outline"
                      size="sm"
                      disabled={invoice.status === "paid"}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>

                    {/* <Button
                      onClick={() => sendInvoiceEmail(invoice)}
                      variant="outline"
                      size="sm"
                      disabled={processing2}
                    >
                      {processing2 ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      Send
                    </Button> */}
                  </>

                  <Button
                    onClick={() => downloadPdf(invoice)}
                    variant="outline"
                    size="sm"
                    disabled={
                      invoice.status === "unpaid" ||
                      processingInvoiceId === invoice.id
                    }
                  >
                    {processingInvoiceId === invoice.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {selectedInvoice && (
        <InvoicePreview
          form={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default InvoiceList;
