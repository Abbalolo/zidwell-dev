"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Eye, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ContractTemplateCard } from "./ContractsTemplates";
import { useRouter } from "next/navigation";
import { CreateNewView } from "./CreateNewView";
import { useUserContextData } from "../context/userData";
import ContractsPreview from "./previews/ContractsPreview";
import Swal from "sweetalert2";
import Loader from "./Loader";

export interface Contract {
  id: string;
  title: string;
  type: string;
  status: "signed" | "pending" | "draft";
  date: string;
  amount?: number;
  description: string;
}

export interface ContractTemplateType {
  id: string;
  title: string;
  description: string;
  icon: string;
  category:
    | "service"
    | "employment"
    | "vendor"
    | "legal"
    | "partnership"
    | "freelancer";
}

export const contractTemplates: ContractTemplateType[] = [
  {
    id: "service-agreement",
    title: "Service Agreement",
    description: "Standard service provision contract",
    icon: "FileText",
    category: "service",
  },
  {
    id: "employment-contract",
    title: "Employment Contract",
    description: "Employee hiring contract template",
    icon: "FileText",
    category: "employment",
  },
  {
    id: "nda-template",
    title: "NDA Template",
    description: "Non-disclosure agreement template",
    icon: "FileText",
    category: "legal",
  },
];

export default function ContractGen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const { userData } = useUserContextData();

  const fetchContracts = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/get-contracts-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });

      const data = await res.json();
      // console.log("Fetched Contracts:", data.contracts);
      setContracts(data.contracts);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.email) fetchContracts(userData.email);
  }, [userData]);

  const handleUseTemplate = (templateId: string) => {
    router.push(
      `/dashboard/services/simple-agreement/contract-editor/${templateId}`
    );
  };

  const statusColors: any = {
    signed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
  };

  const filteredContracts = contracts?.filter((contract) => {
    const title = contract.contract_title || "";
    const status = contract.status || "";
    const matchesSearch = title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "All" || status === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
  return (
    <div className="space-y-6">
      <Tabs defaultValue="contracts" className="w-full">
        <TabsList>
          <TabsTrigger value="contracts">My Contracts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {["All", "Signed", "Pending", "Draft"].map((status) => (
                    <Button
                      key={status}
                      variant={
                        selectedStatus === status ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                      className={
                        selectedStatus === status
                          ? `bg-[#C29307] hover:bg-[#b28a06] text-white border hover:shadow-xl transition-all duration-300`
                          : "border hover:shadow-md transition-all duration-300"
                      }
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredContracts?.map((contract) => {
              const title = contract.contract_title || "Untitled Contract";
              const status = contract.status || "draft";
              const createdAt = contract.created_at?.toDate?.() || new Date();
              const sentAt = contract.sent_at?.toDate?.() || new Date();
              const isDownloading = loadingMap[contract.id];

              return (
                <Card
                  key={contract.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{title}</h3>
                          <Badge className={statusColors[status]}>
                            {status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Issue Date: {createdAt.toLocaleDateString()}
                          </span>
                          {status === "signed" && (
                            <span>
                              Sent Date: {sentAt.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {contractTemplates.map((template) => (
                  <ContractTemplateCard
                    key={template.id}
                    template={template}
                    onUseTemplate={handleUseTemplate}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CreateNewView onUseTemplate={handleUseTemplate} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
