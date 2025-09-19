import { Download, Edit, Eye, Loader2, Send, X } from "lucide-react";
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
interface InvoiceItem {
  item: string;
  quantity: number;
  price: number;
}

 interface Invoice {
  invoice_id: string;
  created_by: string;
  email: string;
  signee_name: string;
  signee_email: string;
  initiator_name: string;
  signed_at: string;
  name: string;
  customer_note: string;
  delivery_due: string;
  delivery_issue: string;
  delivery_time: string;
  invoice_number: string;
  from: string;
  bill_to: string;
  account_number: string;
  account_name: string;
  account_to_pay_name: string;
  message: string;
  issue_date: string;
  due_date: string;
  created_at: any;
  status: string;
  invoice_items: InvoiceItem[];
}

interface InvoiceForm {
  signing_link: string,
  signee_name: string;
  email: string;
  initiator_name: string;
  message: string;
  invoice_id: string;
  bill_to: string;
  from: string;
  issue_date: string;
  due_date: string;
  delivery_due: string;
  delivery_issue: string;
  delivery_time: string;
  customer_note: string;
  account_number: string;
  account_name: string;
  created_at: string;
  signed_at: string;
  account_to_pay_name: string;
  invoice_items: InvoiceItem[];
}

type Props = {
  invoices: any[];
loading: boolean;
};

const InvoiceList: React.FC<Props> = ({
  invoices,
  loading
}) => {
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

 

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [processing, setProcessing] = useState(false);
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
  const downloadPdf = async (invoice: InvoiceForm) => {
    const totalAmount =
      invoice.invoice_items?.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      ) || 0;

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

     const signedSection = invoice.signee_name && invoice.signed_at
    ? `
      <div class="signatures">
        <p>Signee: ${invoice.signee_name}</p>
        <p>Date: ${formattedSignedAt}</p>
      </div>
    `
    : '';


    const fullHtml = `
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
        .no-print {
          display: none;
        }

        .signatures{
        display:flex;
        gap: 20px;
        margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="bg-white w-full max-w-4xl rounded-xl shadow-2xl mx-auto my-8 overflow-hidden max-h-[95vh] flex flex-col">
        <div class="bg-gray-200 px-8 py-6 flex justify-between items-center">
        <img src="${base64Logo}" alt="Logo" class="h-10 w-10 mr-2" />
          <div>
            <h1 class="text-2xl font-bold">INVOICE</h1>
            <p class=" text-sm mt-1">Professional Invoice Document</p>
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
                    <span class="font-semibold text-blue-600">#${
                      invoice.invoice_id || "12345"
                    }</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Issue Date:</span>
                    <span class="text-gray-800">${
                      invoice.issue_date || "N/A"
                    }</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Due Date:</span>
                    <span class="text-gray-800">${
                      invoice.due_date || "N/A"
                    }</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 font-medium">Delivery:</span>
                    <span class="text-gray-800">${
                      invoice.delivery_issue || "Standard"
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
                  invoice.bill_to || "Client Name\nAbuja, NG"
                }</p>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <div class="bg-gray-100 border-l-4 border-gray-300 p-6 rounded-r-lg">
              <h3 class="font-semibold text-gray-800 mb-2">Message</h3>
              <p class="text-gray-700 leading-relaxed">${
                invoice.customer_note ||
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
                    invoice.invoice_items
                      ?.map(
                        (item) => `
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
            <div class="bg-gray-200 p-6 rounded-lg min-w-80">
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


          
        
          <div class="bg-gray-50 p-6 rounded-lg border">
            <h3 class="font-semibold text-gray-800 mb-3">Customer Notes</h3>
            <p class="text-gray-600 leading-relaxed">${
              invoice.customer_note ||
              "Please contact us for any issues with this invoice."
            }</p>
          </div>


          <div class="signatures">
        <p>Initiator: ${invoice.initiator_name}</p>
          <p>Date: ${formattedCreatedAt}</p>
       </div>

             ${signedSection}


         

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

    try {
      setProcessing(true);
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullHtml }),
      });

      if (!res.ok) {
        const errorText = await res.text(); // Read once
        throw new Error(errorText || "Failed to generate PDF");
      }

      const blob = await res.blob(); // ✅ only read the body once
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_id || "download"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setProcessing(false);
    } catch (err) {
      console.error("PDF download failed:", err);
      setProcessing(false);
    }
  };

  const sendInvoiceEmail = async (invoice: InvoiceForm) => {
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
      // Send via Email
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
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // Send via WhatsApp
      const invoiceUrl = invoice.signing_link
      const message = `Here is your invoice: ${invoiceUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      setProcessing2(false);
    }
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
      {invoices.map((invoice) => {
        const totalAmount = invoice.invoice_items?.reduce(
          (sum:any, item:any) => sum + item.quantity * item.price,
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
                    disabled={invoice.status === "unpaid"}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                   <Button
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
                  </Button>
                  </>

                  
                  
                 
                  <Button
                    onClick={() => downloadPdf(invoice)}
                    variant="outline"
                    size="sm"
                     disabled={invoice.status === "unpaid" || processing}
                  >
                    {processing ? (
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
