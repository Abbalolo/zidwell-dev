"use client"

import { useState } from "react"
import { CreditCard, Building2, Smartphone, QrCode, Copy, Check } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useUserContextData } from "../context/userData"



export default function FundAccountMethods() {
  const [amount, setAmount] = useState("")
  const [copied, setCopied] = useState("")
const {user} = useUserContextData()
  const copyToClipboard = async (text: any, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(""), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Amount Input */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Enter Amount to Fund</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e:any) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            <p className="text-sm text-gray-500">Minimum amount: ₦100.00</p>
          </div>
        </CardContent>
      </Card> */}

        <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Bank Transfer Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bank Name:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user?.bankName}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(user?.bankName, "bank")}>
                        {copied === "bank" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Name:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user?.bankAccountName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user?.bankAccountName, "name")}
                      >
                        {copied === "name" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Number:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium font-mono">{user?.bankAccountNumber}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user?.bankAccountNumber, "account")}
                      >
                        {copied === "account" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Please use your registered phone number as the transfer reference to
                    ensure automatic credit.
                  </p>
                </div>
              </div>

    
    </div>
  )
}
