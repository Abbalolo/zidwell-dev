"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import CreateInvoice from "./CreateInvoice";
import InvoiceLIst from "./InvoiceLIst";
import { useUserContextData } from "../context/userData";
import Loader from "./Loader";

export interface InvoiceItem {
  item: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoice_id: string;
  created_by: string;
  email: string;
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
  issue_date: string;
  due_date: string;
  created_at: any;
  status: string;
  invoice_items: InvoiceItem[];
}

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("invoices");
  const { user } = useUserContextData();

  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async (email: string) => {
    setLoading(true);
    setError(null); 

    try {
      if (!email) {
        throw new Error("Email is required to fetch invoices");
      }

      const res = await fetch("/api/get-invoices-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || "Failed to fetch invoices");
      }

      const data = await res.json();

      if (!data.invoices || !Array.isArray(data.invoices)) {
        throw new Error("Invalid data structure received from server");
      }
      // console.log(data);
      setInvoices(data.invoices);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Something went wrong while fetching invoices");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const timeout = setTimeout(() => {
    if (user?.email) {
      fetchInvoice(user.email);
    }
  }, 100); 

  return () => clearTimeout(timeout);
}, [user?.email]);

  const totalAmount = invoices.reduce((sum, invoice) => {
    const invoiceTotal =
      invoice.invoice_items?.reduce((itemSum, item) => {
        return itemSum + item.quantity * item.price;
      }, 0) || 0;
    return sum + invoiceTotal;
  }, 0);

  const paidAmount = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, invoice) => {
      const invoiceTotal =
        invoice.invoice_items?.reduce((itemSum, item) => {
          return itemSum + item.quantity * item.price;
        }, 0) || 0;
      return sum + invoiceTotal;
    }, 0);

  const signedInvoices = invoices
    .filter((inv) => inv.status === "signed").length
  const pendingInvoices = invoices
    .filter((inv) => inv.status === "pending").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <p className="text-sm text-gray-600 mb-1">Signed Invoices</p>
              <p className="text-2xl font-bold text-green-600">
                {signedInvoices}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Pending Invoices</p>
              <p className="text-2xl font-bold text-yellow-600">
               {pendingInvoices}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <div className="relative flex gap-3 md:justify-between">
                  <div className=" sm:flex-1">
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
                    {/* Desktop version: Status buttons */}
                    <div className="hidden sm:flex gap-2">
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

                    {/* Mobile version: Dot menu */}
                    <div className="sm:hidden">
                      <Button
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="p-2 hover:bg-black "
                      >
                        <MoreHorizontal className="w-4 h-4 text-white" />
                      </Button>

                      {/* Dropdown menu for mobile */}
                      {isMenuOpen && (
                        <div className="absolute right-0 bg-white shadow-md rounded-lg mt-2 p-2 border border-gray-200 w-40">
                          {["All", "Paid", "Pending", "Overdue", "Draft"].map(
                            (status) => (
                              <Button
                                key={status}
                                variant={
                                  selectedStatus === status
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="w-full text-left p-2 hover:bg-[#C29307] hover:text-white mb-1"
                                onClick={() => {
                                  setSelectedStatus(status);
                                  setIsMenuOpen(false); // Close the menu after selecting
                                }}
                              >
                                {status}
                              </Button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* New Invoice Button */}
                <div className="w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto hover:bg-black bg-[#C29307] hover:shadow-xl transition-all duration-300"
                    onClick={() => setActiveTab("create")}
                  >
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
