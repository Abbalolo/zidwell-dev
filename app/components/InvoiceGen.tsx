"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Download, Eye, Send, Edit } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import CreateInvoice from "./CreateInvoice";
import InvoiceLIst from "./InvoiceLIst";
import { useUserContextData } from "../context/userData";

export interface InvoiceItem {
  item: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceId: string;
  createdBy: string;
  email: string;
  name: string;
  customerNote: string;
  deliveryDue: string;
  deliveryIssue: string;
  deliveryTime: string;
  invoiceNumber: string;
  from: string;
  billTo: string;
  accountNumber: string;
  accountName: string;
  accountToPayName: string;
  message: string;
  issueDate: string;
  dueDate: string;
  sentAt: any;
  status: string;
  invoiceItems: InvoiceItem[];
}

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const { user } = useUserContextData();

  const fetchInvoice = async (email: string) => {
    const res = await fetch("/api/get-invoices-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail: email }),
    });

    const data = await res.json();
    console.log("Fetched Invoices:", data.invoices);
    setInvoices(data.invoices);
  };

  useEffect(() => {
    if (user?.email) fetchInvoice(user.email);
  }, [user]);

  const totalAmount = invoices.reduce((sum, invoice) => {
    const invoiceTotal =
      invoice.invoiceItems?.reduce((itemSum, item) => {
        return itemSum + item.quantity * item.price;
      }, 0) || 0;
    return sum + invoiceTotal;
  }, 0);

  const paidAmount = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, invoice) => {
      const invoiceTotal =
        invoice.invoiceItems?.reduce((itemSum, item) => {
          return itemSum + item.quantity * item.price;
        }, 0) || 0;
      return sum + invoiceTotal;
    }, 0);

  const pendingAmount = invoices
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, invoice) => {
      const invoiceTotal =
        invoice.invoiceItems?.reduce((itemSum, item) => {
          return itemSum + item.quantity * item.price;
        }, 0) || 0;
      return sum + invoiceTotal;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Invoiced</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{totalAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">
                ₦{paidAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">
                ₦{pendingAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4">
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Input */}
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  {["All", "Paid", "Pending", "Overdue", "Draft"].map(
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

                {/* New Invoice Button */}
                <div className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto hover:bg-black bg-[#C29307] hover:shadow-xl transition-all duration-300">
                    <Plus className="w-4 h-4 mr-2" />
                    New Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices List */}
          <InvoiceLIst
            invoices={invoices}
            searchTerm={searchTerm}
            selectedStatus={selectedStatus}
          />
        </TabsContent>

        <CreateInvoice />
      </Tabs>
    </div>
  );
}
