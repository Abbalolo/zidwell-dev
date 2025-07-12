"use client"

import { useState } from "react"
import { Eye, EyeOff, Plus, Receipt } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"


export default function BalanceCard() {
  const [showBalance, setShowBalance] = useState(false)

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div>
            <p className="text-gray-500 text-sm mb-2">Total Balance</p>
            <div className="flex items-center justify-center space-x-3">
              <h2 className="text-3xl font-bold text-gray-900">
                Available Balance: ₦ {showBalance ? "25,450" : "*,***"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Zidcoin Balance:</p>
              <p className="text-xl font-semibold text-gray-900">₦ {showBalance ? "1,250" : "***"}</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4 pt-4">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3">
              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
            <Button variant="outline" className="px-8 py-3 bg-transparent">
              <Receipt className="w-4 h-4 mr-2" />
              Transaction
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
