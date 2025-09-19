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
import ContractList from "./ContractLIst";

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
  const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("contracts");
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

 

  const signedContracts = contracts.filter(
    (con) => con.status?.toLowerCase() === "signed"
  ).length;
  const pendingContracts = contracts.filter(
    (con) => con.status?.toLowerCase() === "pending"
  ).length;




  return (
    <div className="space-y-6">

      {activeTab === "contracts" && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900">
                {contracts.length.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Signed Contracts</p>
              <p className="text-2xl font-bold text-green-600">
                {signedContracts}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Pending Contracts</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingContracts}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          <ContractList contracts={filteredContracts} loading={loading}  />

          
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
                    // loading={loading}
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
