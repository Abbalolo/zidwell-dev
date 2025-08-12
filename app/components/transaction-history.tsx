"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Search, Download } from "lucide-react"
import { Button } from "./ui/button" 
import { Card, CardContent, CardHeader } from "./ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Input } from "./ui/input"
import axios from "axios"

type TransactionStatus = "Success" | "Pending" | "Failed"

interface Transaction {
  id: string
  name: string
  date: string
  time: string
  status: TransactionStatus
  amount: number
}

const transactions: Transaction[] = [
  {
    id: "1",
    name: "MTN DATA",
    date: "25 April",
    time: "09:30 am",
    status: "Success",
    amount: 5000.0,
  },
  {
    id: "2",
    name: "EKDC",
    date: "25 April",
    time: "14:40 pm",
    status: "Pending",
    amount: 5000.0,
  },
  {
    id: "3",
    name: "AIRTEL AIRTIME",
    date: "25 April",
    time: "16:30 pm",
    status: "Success",
    amount: 5000.0,
  },
  {
    id: "4",
    name: "9MOBILE AIRTIME",
    date: "25 April",
    time: "16:30 pm",
    status: "Failed",
    amount: 5000.0,
  },
  {
    id: "5",
    name: "GLO DATA",
    date: "25 April",
    time: "16:30 pm",
    status: "Pending",
    amount: 5000.0,
  },
  {
    id: "6",
    name: "DSTV SUBSCRIPTION",
    date: "24 April",
    time: "10:15 am",
    status: "Success",
    amount: 8500.0,
  },
  {
    id: "7",
    name: "ELECTRICITY BILL",
    date: "24 April",
    time: "08:45 am",
    status: "Success",
    amount: 12000.0,
  },
  {
    id: "8",
    name: "MTN AIRTIME",
    date: "23 April",
    time: "19:20 pm",
    status: "Failed",
    amount: 2000.0,
  },
]

const statusConfig = {
  Success: { color: "text-green-600", bgColor: "bg-green-100", dotColor: "bg-green-500" },
  Pending: { color: "text-blue-600", bgColor: "bg-blue-100", dotColor: "bg-blue-500" },
  Failed: { color: "text-red-600", bgColor: "bg-red-100", dotColor: "bg-red-500" },
}

export default function TransactionHistory() {
  const [filter, setFilter] = useState("All transactions")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === "All transactions" || transaction.status === filter
    return matchesSearch && matchesFilter
  })


  const getTransaction = async () => {

    try{

      const response = await fetch("/api/bill-transactions")
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to fetch transaction");

      console.log("my bills transactions data" ,data)

    } catch(error) {
      console.log("Unable to get transactions", error)
    }


  }

// useEffect(() => {
// getTransaction()
// }, [])

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 md:w-64 w-full"
              />
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  {filter}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("All transactions")}>All transactions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("Success")}>Success</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("Pending")}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("Failed")}>Failed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

           
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transactions found matching your criteria.</div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{transaction.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {transaction.date} at {transaction.time}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[transaction.status].dotColor}`} />
                    <span className={`text-sm font-medium ${statusConfig[transaction.status].color}`}>
                      {transaction.status}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">
                      ₦{transaction.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-gray-900 text-white">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
