
import { Download, Edit, Eye, Loader2, Send } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import RecieptPreview from "./previews/RecieptPreview";
import { useRouter } from "next/navigation";
import { useUserContextData } from "../context/userData";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Receipt } from "./ReceiptGen";
import Loader from "./Loader";

const getBase64Logo = async () => {
  try {
    const response = await fetch("/logo.png");
    if (!response.ok) throw new Error("Logo not found");
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading logo:", error);
    return "";
  }
};

const MySwal = withReactContent(Swal);

interface ReceiptItem {
  item: string;
  quantity: number;
  price: number;
}

interface ReceiptForm {
  name: string;
  email: string;
  receipt_id: string;
  bill_to: string;
  from: string;
  issue_date: string;
  customer_note: string;
  amount_balance?: string;
  payment_for: string;
  receipt_items: ReceiptItem[];
  created_at?: string;
  signed_at?: string;
  signee_name?: string;
  initiator_name?: string;
  signing_link?: string;
  id?: string;
  status: string;
  sent_at?: string;
  reciept_number?: string;
  initator_name?: string;
}

type Props = {
  receipts: any[];
loading: boolean;
};

const RecieptList: React.FC<Props> = ({ receipts, loading }) => {
 const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
    signed: "bg-blue-100 text-blue-800",
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);


  const [selectedReciept, setSelectedReciept] = useState<ReceiptForm | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processing2, setProcessing2] = useState(false);
  const { user } = useUserContextData();
  const router = useRouter();
  const [base64Logo, setBase64Logo] = useState<string>("");

  useEffect(() => {
    const loadLogo = async () => {
      const logo = await getBase64Logo();
      setBase64Logo(logo);
    };
    loadLogo();
  }, []);

  const downloadPdf = async (receipt: ReceiptForm) => {
    const formattedCreatedAt = receipt.created_at
      ? new Date(receipt.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    const formattedSignedAt = receipt.signed_at
      ? new Date(receipt.signed_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    const signedSection =
      receipt.signee_name && receipt.signed_at
        ? `
      <div class="signatures">
        <p>Signee: ${receipt.signee_name}</p>
        <p>Date: ${formattedSignedAt}</p>
      </div>
    `
        : "";

    const formattedTotal = receipt.receipt_items?.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    ).toLocaleString("en-NG", { style: "currency", currency: "NGN" });

    const fullHtml = `
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
      padding: 20px;
    }
    .signatures {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="bg-white w-full max-w-4xl rounded-xl shadow-2xl mx-auto my-8 overflow-hidden">
    <div class="bg-gray-200 px-8 py-6 flex justify-between items-center">
      <img src="${base64Logo}" alt="Logo" class="h-10 w-10 mr-2" />
      <div>
        <h1 class="text-2xl font-bold">RECEIPT</h1>
        <p class="text-sm mt-1">Proof of Payment</p>
      </div>
    </div>

    <div class="p-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div class="space-y-6">
          <div class="bg-gray-50 p-6 rounded-lg border">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Receipt Details</h2>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500 font-medium">Receipt #:</span>
                <span class="font-semibold text-blue-600">#${receipt.receipt_id || "0001"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 font-medium">Issue Date:</span>
                <span class="text-gray-800">${receipt.issue_date || "N/A"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 font-medium">Payment For:</span>
                <span class="text-gray-800">${receipt.payment_for || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-gray-50 p-6 rounded-lg border">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">From</h2>
            <p class="text-gray-800 whitespace-pre-line">${receipt.initator_name || ""}</p>
          </div>
          <div class="bg-gray-50 p-6 rounded-lg border">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Bill To</h2>
            <p class="text-gray-800 whitespace-pre-line">${receipt.bill_to || ""}</p>
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Receipt Items</h2>
        <div class="overflow-x-auto border rounded-lg">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-100">
                <th class="text-left p-4 font-semibold text-gray-800 border-b">Description</th>
                <th class="text-center p-4 font-semibold text-gray-800 border-b">Qty</th>
                <th class="text-right p-4 font-semibold text-gray-800 border-b">Rate</th>
                <th class="text-right p-4 font-semibold text-gray-800 border-b">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.receipt_items
                ?.map(
                  (item) => `
                <tr class="border-b">
                  <td class="p-4 text-gray-800">${item.item}</td>
                  <td class="p-4 text-center text-gray-800">${item.quantity}</td>
                  <td class="p-4 text-right text-gray-800">${item.price.toLocaleString("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  })}</td>
                  <td class="p-4 text-right font-semibold text-gray-800">${(item.quantity * item.price).toLocaleString("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  })}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-end mb-8">
        <div class="bg-gray-200 p-6 rounded-lg min-w-80">
          <div class="space-y-3">
            <div class="flex justify-between text-lg">
              <span>Total:</span>
              <span class="font-bold">${formattedTotal}</span>
            </div>
            
          </div>
        </div>
      </div>

      <div class="bg-gray-50 p-6 rounded-lg border mb-8">
        <h3 class="font-semibold text-gray-800 mb-3">Customer Notes</h3>
        <p class="text-gray-600 leading-relaxed">${receipt.customer_note || "Thank you for your payment!"}</p>
      </div>

      <div class="signatures">
        <p>Initiator: ${receipt.initiator_name}</p>
        <p>Date: ${formattedCreatedAt}</p>
      </div>

      ${signedSection}

      <div class="mt-8 pt-6 border-t text-center">
        <p class="text-gray-500 text-sm">
          This receipt serves as confirmation of payment. Please retain for your records.
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
        const errorText = await res.text();
        throw new Error(errorText || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `reciept-${receipt.receipt_id || "download"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const sendrecieptEmail = async (receipt: ReceiptForm) => {
    if (!user?.email) return;

    const result = await MySwal.fire({
      title: "Send Invoice",
      text: "How would you like to send the invoice?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `<i class="fa-regular fa-envelope"></i> Send Receipt via Email`,
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
        const res = await fetch("/api/send-receipt-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, receipt }),
        });

        if (!res.ok) throw new Error("Failed to send reciept email");

        Swal.fire("Sent!", "reciept sent via email.", "success");
        setSelectedReciept(null);
      } catch (error) {
        Swal.fire(
          "Error",
          "Failed to send reciept email. Please try again.",
          "error"
        );
      } finally {
        setProcessing2(false);
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {

      const recieptUrl = receipt.signing_link
      const message = `Here is your reciept: ${recieptUrl}`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank"
      );
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

  
    if (receipts.length === 0) {
    return (
      <div className="flex items-center justify-center text-semibold">
       No receipts records
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {receipts.map((reciept) => {
        const totalAmount =
          reciept.receipt_items?.reduce(
            (sum:any, item:any) => sum + item.quantity * item.price,
            0
          ) || 0;

        return (
          <Card key={reciept.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {reciept.receipt_id}
                    </h3>
                    <Badge
                      className={
                        statusColors[reciept.status] ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {reciept.status}
                    </Badge>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    {reciept.bill_to}
                  </p>
                 
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>
                      Date: {new Date(reciept.issue_date).toLocaleDateString()}
                    </span>
                    {reciept.sent_at && (
                      <span>
                        Sent:{" "}
                        {new Date(reciept.sent_at).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900">
                      {formatNumber(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <Button
                    onClick={() => setSelectedReciept(reciept)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/services/create-receipt/receipt/edit/${reciept.id}`
                      )
                    }
                    variant="outline"
                    size="sm"
                    disabled={reciept.status === "signed" }
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button
                    onClick={() => sendrecieptEmail(reciept)}
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
                  <Button
                    onClick={() => downloadPdf(reciept)} 
                    variant="outline"
                    size="sm"
                    disabled={reciept.status !== "signed" || processing}
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

      {selectedReciept && (
        <RecieptPreview
          form={selectedReciept}
          onClose={() => setSelectedReciept(null)}
        />
      )}
    </div>
  );
};

export default RecieptList;
