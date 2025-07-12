"use client"

import { useState } from "react"
import { CreditCard, Building2, Smartphone, QrCode, Copy, Check } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

const bankDetails = {
  bankName: "Guaranty Trust Bank (GTB)",
  accountName: "Zidwell Technologies Ltd",
  accountNumber: "0123456789",
  sortCode: "058152036",
}

export default function FundAccountMethods() {
  const [amount, setAmount] = useState("")
  const [copied, setCopied] = useState("")

  const copyToClipboard = async (text: string, type: string) => {
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
      <Card>
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
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bank-transfer" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bank-transfer">Bank Transfer</TabsTrigger>
              <TabsTrigger value="card">Debit Card</TabsTrigger>
              <TabsTrigger value="ussd">USSD</TabsTrigger>
              <TabsTrigger value="qr-code">QR Code</TabsTrigger>
            </TabsList>

            <TabsContent value="bank-transfer" className="space-y-4">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Bank Transfer Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bank Name:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{bankDetails.bankName}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(bankDetails.bankName, "bank")}>
                        {copied === "bank" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Name:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{bankDetails.accountName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bankDetails.accountName, "name")}
                      >
                        {copied === "name" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Number:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium font-mono">{bankDetails.accountNumber}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bankDetails.accountNumber, "account")}
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
            </TabsContent>

            <TabsContent value="card" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Secure Card Payment</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input id="card-number" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                  <div>
                    <Label htmlFor="pin">Card PIN</Label>
                    <Input id="pin" type="password" placeholder="****" />
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" disabled={!amount}>
                  Pay ₦{amount || "0.00"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ussd" className="space-y-4">
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center">
                  <Smartphone className="w-5 h-5 mr-2" />
                  USSD Payment Codes
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">GTB</p>
                        <p className="text-sm text-gray-600">*737*1*Amount*ACCT#</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Dial Now
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Access Bank</p>
                        <p className="text-sm text-gray-600">*901*0*Amount*ACCT#</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Dial Now
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">First Bank</p>
                        <p className="text-sm text-gray-600">*894*Amount*ACCT#</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Dial Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="qr-code" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-purple-600">
                  <QrCode className="w-5 h-5" />
                  <span className="font-medium">Scan QR Code to Pay</span>
                </div>
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Scan this QR code with your banking app to make payment of ₦{amount || "0.00"}
                </p>
                <Button variant="outline">Generate New QR Code</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
