import { Download, Eye, Loader2, Send } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useRouter } from "next/navigation";
import { useUserContextData } from "../context/userData";
import Swal from "sweetalert2";
import Loader from "./Loader";
import { TaxFiling } from "./TaxGen";



type Props = {
  taxFiling: TaxFiling[];
  loading: boolean;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const TaxList: React.FC<Props> = ({ taxFiling, loading }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // const [sendingId, setSendingId] = useState<string | null>(null);
  // const { userData } = useUserContextData();
  // const router = useRouter();

  console.log("taxFiling", taxFiling )

  const downloadPdf = async (tax: TaxFiling) => {
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Filing</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #444; }
        </style>
      </head>
      <body>
        <h1>Tax Filing Record</h1>
        <div class="section">
          <p><span class="label">Name:</span> ${tax.first_name} ${tax.middle_name || ""} ${tax.last_name}</p>
          <p><span class="label">Company:</span> ${tax.company_name}</p>
          <p><span class="label">Business Address:</span> ${tax.business_address}</p>
          <p><span class="label">NIN:</span> ${tax.nin}</p>
        </div>
        <div class="section">
          <p><span class="label">Filing Type:</span> ${tax.filing_type}</p>
          <p><span class="label">Status:</span> ${tax.status}</p>
          <p><span class="label">Sent At:</span> ${new Date(tax.created_at).toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    try {
      setDownloadingId(tax.id); // 🔹 Only set loading for this tax
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullHtml }),
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-filing-${tax.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloadingId(null); // 🔹 Reset
    }
  };

  // const sendFilingEmail = async (tax: TaxFiling) => {
  //   if (!userData?.email) return;

  //   try {
  //     setSendingId(tax.id); // 🔹 Only set loading for this tax
  //     const res = await fetch("/api/send-filing-email", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email: userData.email, filing: tax }),
  //     });

  //     if (!res.ok) throw new Error("Failed to send filing email");

  //     Swal.fire("Sent!", "Tax filing sent via email.", "success");
  //   } catch (error) {
  //     console.error("Error sending filing email:", error);
  //     Swal.fire("Error", "Failed to send filing email. Please try again.", "error");
  //   } finally {
  //     setSendingId(null); // 🔹 Reset
  //   }
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }
  if (taxFiling.length === 0) {
    return (
      <div className="flex items-center justify-center text-semibold">
       No tax records
      </div>
    );
  }



  return (
    <div className="space-y-4 mb-5">
      {taxFiling.map((tax) => (
        <Card key={tax.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="font-semibold md:text-lg">
                    {tax.company_name} — {tax.filing_type}
                  </h3>
                  <Badge
                    className={statusColors[tax.status ?? "pending"] || "bg-gray-100 text-gray-800"}
                  >
                    {tax.status ?? "pending"}
                  </Badge>
                </div>
                <p className="text-gray-900 font-medium mb-1">
                  {tax.first_name} {tax.middle_name || ""} {tax.last_name}
                </p>
                <p className="text-gray-600 mb-2">{tax.business_address}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span>Sent: {new Date(tax.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <Button
                  onClick={() => downloadPdf(tax)}
                  variant="outline"
                  size="sm"
                  disabled={downloadingId === tax.id || tax.status === "pending"}
                >
                  {downloadingId === tax.id ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1" />
                  )}
                  PDF
                </Button>

                {/* <Button
                  onClick={() => sendFilingEmail(tax)}
                  variant="outline"
                  size="sm"
                  disabled={sendingId === tax.id}
                >
                  {sendingId === tax.id ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  Send
                </Button> */}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


export default TaxList;
