"use client"

import { useState } from "react"
import { Plus, Search, Download, Eye, Send, Edit } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface Invoice {
  id: string
  invoiceNumber: string
  client: string
  amount: number
  status: "Paid" | "Pending" | "Overdue" | "Draft"
  date: string
  dueDate: string
  description: string
}

const invoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    client: "MTN Nigeria",
    amount: 850000,
    status: "Paid",
    date: "2024-01-15",
    dueDate: "2024-02-15",
    description: "Bulk SMS and Data Services - January 2024",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    client: "Airtel Nigeria",
    amount: 650000,
    status: "Pending",
    date: "2024-02-01",
    dueDate: "2024-03-01",
    description: "Payment Gateway Integration Services",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    client: "Glo Mobile",
    amount: 450000,
    status: "Overdue",
    date: "2024-01-10",
    dueDate: "2024-02-10",
    description: "API Development and Maintenance",
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-004",
    client: "9Mobile",
    amount: 320000,
    status: "Draft",
    date: "2024-02-15",
    dueDate: "2024-03-15",
    description: "Mobile App Development Services",
  },
]

export default function InvoiceManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")

  const statusColors = {
    Paid: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Overdue: "bg-red-100 text-red-800",
    Draft: "bg-gray-100 text-gray-800",
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "All" || invoice.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const paidAmount = invoices.filter((inv) => inv.status === "Paid").reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingAmount = invoices
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Invoiced</p>
              <p className="text-2xl font-bold text-gray-900">₦{totalAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">₦{paidAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">₦{pendingAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e:any) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {["All", "Paid", "Pending", "Overdue", "Draft"].map((status) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Invoice
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices List */}
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                        <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                      </div>
                      <p className="text-gray-900 font-medium mb-1">{invoice.client}</p>
                      <p className="text-gray-600 mb-2">{invoice.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Date: {new Date(invoice.date).toLocaleDateString()}</span>
                        <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                        <span className="font-semibold text-gray-900">₦{invoice.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-1" />
                        Send
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Client Name</label>
                  <Input placeholder="Enter client name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Client Email</label>
                  <Input type="email" placeholder="client@example.com" />
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Invoice Number</label>
                  <Input placeholder="INV-2024-005" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Invoice Date</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <Input type="date" />
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium mb-2">Invoice Items</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input placeholder="Description" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Qty" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Rate" />
                    </div>
                    <div className="col-span-2">
                      <Input placeholder="Amount" disabled />
                    </div>
                    <div className="col-span-1">
                      <Button variant="outline" size="sm">
                        ×
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea className="w-full p-3 border rounded-md h-24" placeholder="Additional notes..." />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button>Create & Send Invoice</Button>
                <Button variant="outline">Save as Draft</Button>
                <Button variant="outline">Preview</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
