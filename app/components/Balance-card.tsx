"use client"

import { useState } from "react"
import { Eye, EyeOff, Plus, Receipt, Router } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { useUserContextData } from "../context/userData"
import { useRouter } from "next/navigation"


export default function BalanceCard() {
  const [showBalance, setShowBalance] = useState(false)
const {user} = useUserContextData();
const router = useRouter()

// console.log("user balance:", balance);

 const formatNumber = (value: any) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card className=" shadow-sm">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div>
            <p className="text-gray-500 text-sm mb-2">Total Balance</p>
            <div className="flex items-center justify-center">
              <h2 className="md:text-3xl text-xl font-bold text-gray-900">
                Available Balance: ₦ {showBalance ? formatNumber(user?.walletBalance) : "*****"}
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
{/* 
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Zidcoin Balance:</p>
              <p className="text-xl font-semibold text-gray-900">₦ {showBalance ? "1,250" : "***"}</p>
            </div>
          </div> */}

          <div className="flex items-center justify-center md:space-x-4 space-x-2 pt-4">
            <Button onClick={() => router.push("/dashboard/services/fund-account")} className="bg-[#C29307] hover:bg-[#C29307] text-white md:px-8 md:py-3">
              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/transactions")} className="md:px-8 md:py-3 bg-transparent">
              <Receipt className="w-4 h-4 mr-2" />
              Transaction
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
