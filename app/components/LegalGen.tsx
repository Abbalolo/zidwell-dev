"use client"

import { useState } from "react"
import { FileText, Download, Eye, Search } from "lucide-react"
import { Button } from "./ui/button" 
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input" 
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface Contract {
  id: string
  title: string
  type: string
  status: "Active" | "Pending" | "Expired" | "Draft"
  date: string
  amount?: number
  description: string
}

const contracts: Contract[] = [
  {
    id: "1",
    title: "Service Agreement - MTN Partnership",
    type: "Service Agreement",
    status: "Active",
    date: "2024-01-15",
    amount: 500000,
    description: "Partnership agreement for bulk SMS and data services",
  },
  {
    id: "2",
    title: "Vendor Contract - Payment Gateway",
    type: "Vendor Contract",
    status: "Pending",
    date: "2024-02-01",
    amount: 250000,
    description: "Integration contract for payment processing services",
  },
  {
    id: "3",
    title: "Employment Contract - Software Developer",
    type: "Employment",
    status: "Active",
    date: "2024-01-10",
    description: "Full-time employment contract for senior developer position",
  },
  {
    id: "4",
    title: "NDA - Technology Partner",
    type: "NDA",
    status: "Active",
    date: "2023-12-20",
    description: "Non-disclosure agreement for technology collaboration",
  },
]

const contractTemplates = [
  { name: "Service Agreement", description: "Standard service provision contract" },
  { name: "Employment Contract", description: "Employee hiring contract template" },
  { name: "Vendor Agreement", description: "Supplier and vendor contract" },
  { name: "NDA Template", description: "Non-disclosure agreement template" },
  { name: "Partnership Agreement", description: "Business partnership contract" },
  { name: "Freelancer Contract", description: "Independent contractor agreement" },
]

export default function LegalContracts() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")

  const statusColors = {
    Active: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Expired: "bg-red-100 text-red-800",
    Draft: "bg-gray-100 text-gray-800",
  }

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "All" || contract.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="contracts" className="w-full">
        <TabsList>
          <TabsTrigger value="contracts">My Contracts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e:any) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {["All", "Active", "Pending", "Expired", "Draft"].map((status) => (
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
              </div>
            </CardContent>
          </Card>

          {/* Contracts List */}
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">{contract.title}</h3>
                        <Badge className={statusColors[contract.status]}>{contract.status}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{contract.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Type: {contract.type}</span>
                        <span>Date: {new Date(contract.date).toLocaleDateString()}</span>
                        {contract.amount && <span>Value: ₦{contract.amount.toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractTemplates.map((template, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-8 h-8 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{template.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          <Button size="sm" className="w-full">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contract Title</label>
                  <Input placeholder="Enter contract title" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contract Type</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Service Agreement</option>
                    <option>Employment Contract</option>
                    <option>Vendor Agreement</option>
                    <option>NDA</option>
                    <option>Partnership Agreement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea className="w-full p-3 border rounded-md h-32" placeholder="Enter contract description..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input type="date" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contract Value (₦)</label>
                <Input type="number" placeholder="Enter contract value" />
              </div>
              <div className="flex gap-3">
                <Button>Create Contract</Button>
                <Button variant="outline">Save as Draft</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
