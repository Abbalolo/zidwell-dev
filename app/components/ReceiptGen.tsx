"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Download, Eye, Send, Edit } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { useUserContextData } from "../context/userData";
import RecieptList from "./RecieptLIst";
import CreateReceipt from "./CreateReciept";

interface ReceiptItem {
  item: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  id: string;
  name: string;
  email: string;
  message: string;
  receiptId: string;
  bill_to: string;
  from: string;
  issue_date: string;
  customer_note: string;
  amount_balance?: string;
  payment_for: string;
  receipt_items: ReceiptItem[];
  receipt_number: string;
  signee_name: string;
  sent_at: any;
  status: string;
}

export default function ReceiptManager() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activeTab, setActiveTab] = useState("Receipts");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useUserContextData();

  const fetchReceipts = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!email) {
        throw new Error("Email is required to fetch receipts");
      }

      const res = await fetch("/api/get-receipt-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || "Failed to fetch receipts");
      }

      const data = await res.json();
      console.log(data);
      if (!data.receipts || !Array.isArray(data.receipts)) {
        throw new Error("Invalid data structure received from server");
      }

      setReceipts(data.receipts);
    } catch (err: any) {
      console.error("Error fetching receipts:", err);
      setError(err.message || "Something went wrong while fetching receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (userData?.email) {
        fetchReceipts(userData.email);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [userData?.email]);

  const totalAmount = receipts.reduce((sum, receipt) => {
    const recieptTotal =
      receipt.receipt_items?.reduce((itemSum, item) => {
        return itemSum + item.quantity * item.price;
      }, 0) || 0;
    return sum + recieptTotal;
  }, 0);

  const signedReceipt = receipts.filter(
    (rcp) => rcp.status === "signed"
  ).length;
  const pendingReceipt = receipts.filter(
    (rcp) => rcp.status === "pending"
  ).length;

   const filteredReceipts = receipts?.filter((receipt) => {
    const title = receipt.bill_to || "";
    const status = receipt.status || "";
    const matchesSearch = title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "All" || status === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
       {activeTab === "Receipts" && (
        
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Receipt</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{totalAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Signed Receipt</p>
              <p className="text-2xl font-bold text-green-600">
                {signedReceipt}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Pending Receipt</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingReceipt}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4">
          <TabsTrigger value="Receipts">All Reciepts</TabsTrigger>
          <TabsTrigger value="create">Create Reciept</TabsTrigger>
        </TabsList>

        <TabsContent value="Receipts" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Input */}
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search Reciepts..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                   {["All", "Signed", "Pending", "Draft"].map(
                    (status) => (
                      <Button
                        key={status}
                        variant={
                          selectedStatus === status ? "default" : "outline"
                        }
                        size="sm"
                        className="hover:bg-[#C29307] hover:text-white border hover:shadow-xl transition-all duration-300"
                        onClick={() => setSelectedStatus(status)}
                      >
                        {status}
                      </Button>
                    )
                  )}
                </div>

                {/* New Reciept Button */}
                <div className="w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto hover:bg-black bg-[#C29307] hover:shadow-xl transition-all duration-300"
                    onClick={() => setActiveTab("create")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Reciept
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reciepts List */}
          <RecieptList
            receipts={filteredReceipts}
            loading={loading}
          />
        </TabsContent>

        <CreateReceipt />
      </Tabs>
    </div>
  );
}
