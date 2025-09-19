import { Download, Edit, Eye, FileText, Loader2, Send } from "lucide-react";
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
import ContractsPreview from "./previews/ContractsPreview";

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

type Props = {
  contracts: any[];
  loading: boolean;
};

const ContractList: React.FC<Props> = ({ contracts, loading }) => {
  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const { userData } = useUserContextData();
  const router = useRouter();
  const [base64Logo, setBase64Logo] = useState<string>("");

  useEffect(() => {
    const loadLogo = async () => {
      const logo = await getBase64Logo();
      setBase64Logo(logo);
    };
    loadLogo();
  }, []);

  const statusColors: any = {
    signed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
  };

  const handleDownload = async (contract: any) => {
    if (!contract.contract_text?.trim()) {
      Swal.fire(
        "Empty Contract",
        "This contract has no text to download.",
        "warning"
      );
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [contract.id]: true }));
    try {
      const res = await fetch("/api/generate-contract-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_title: contract.contract_title,
          contract_text: contract.contract_text,
          signee_name: contract.signee_name,
          signed_at: contract.signed_at,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contract.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        "An error occurred while generating the PDF.",
        "error"
      );
    } finally {
      setLoadingMap((prev) => ({ ...prev, [contract.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }
  if (contracts.length === 0) {
    return (
      <div className="flex items-center justify-center text-semibold">
        No contracts records
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts?.map((contract) => {
        const title = contract.contract_title || "Untitled Contract";
        const status = contract.status || "draft";
        const createdAt = contract.created_at?.toDate?.() || new Date();
        const sentAt = contract.sent_at?.toDate?.() || new Date();
        const isDownloading = loadingMap[contract.id];

        return (
          <Card key={contract.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <Badge className={statusColors[status]}>{status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Issue Date: {createdAt.toLocaleDateString()}</span>
                    {status === "signed" && (
                      <span>Sent Date: {sentAt.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContract(contract);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/services/simple-agreement/edit/${contract.id}`
                        )
                      }
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDownload(contract)}
                    variant="outline"
                    size="sm"
                    disabled={status === "pending"}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {isDownloading ? "Downloading..." : "Download"}
                  </Button>
                </div>
                <ContractsPreview
                  isOpen={isPreviewOpen}
                  contract={selectedContract}
                  onClose={() => setIsPreviewOpen(false)}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ContractList;
