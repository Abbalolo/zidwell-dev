"use client"

import { useState } from "react"
import { Smartphone, Check, AlertCircle, CreditCard, ArrowRight } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import Image from "next/image"

interface NetworkProvider {
  id: string
  name: string
  code: string
  color: string
  bgColor: string
  logo: string
  prefix: string[]
}

interface AirtimeAmount {
  value: number
  bonus?: string
  popular?: boolean
}

const networkProviders: NetworkProvider[] = [
  {
    id: "mtn",
    name: "MTN",
    code: "MTN",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
    logo: "/placeholder.svg?height=60&width=60&text=MTN",
    prefix: ["0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903", "0906"],
  },
  {
    id: "airtel",
    name: "Airtel",
    code: "AIRTEL",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    logo: "/placeholder.svg?height=60&width=60&text=AIRTEL",
    prefix: ["0802", "0808", "0708", "0812", "0701", "0902", "0907", "0901"],
  },
  {
    id: "glo",
    name: "Glo",
    code: "GLO",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    logo: "/placeholder.svg?height=60&width=60&text=GLO",
    prefix: ["0805", "0807", "0705", "0815", "0811", "0905"],
  },
  {
    id: "9mobile",
    name: "9Mobile",
    code: "9MOBILE",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    logo: "/placeholder.svg?height=60&width=60&text=9MOB",
    prefix: ["0809", "0818", "0817", "0909", "0908"],
  },
]

const airtimeAmounts: AirtimeAmount[] = [
  { value: 100 },
  { value: 200, popular: true },
  { value: 500, bonus: "+50 bonus" },
  { value: 1000, bonus: "+100 bonus" },
  { value: 2000, bonus: "+300 bonus" },
  { value: 5000, bonus: "+750 bonus" },
  { value: 10000, bonus: "+1500 bonus" },
]

export default function AirtimePurchase() {
  const [selectedProvider, setSelectedProvider] = useState<NetworkProvider | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [isCustomAmount, setIsCustomAmount] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isProcessing, setIsProcessing] = useState(false)

  // Auto-detect network from phone number
  const detectNetwork = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "")
    if (cleanNumber.length >= 4) {
      const prefix = cleanNumber.substring(0, 4)
      const provider = networkProviders.find((p) => p.prefix.includes(prefix))
      if (provider && provider.id !== selectedProvider?.id) {
        setSelectedProvider(provider)
      }
    }
  }

  // Validate Nigerian phone number
  const validatePhoneNumber = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "")
    const nigerianPhoneRegex = /^(0[7-9][0-1]\d{8}|234[7-9][0-1]\d{8})$/

    if (!cleanNumber) {
      return "Phone number is required"
    }

    if (cleanNumber.length !== 11 && cleanNumber.length !== 13) {
      return "Phone number must be 11 digits (starting with 0) or 13 digits (starting with 234)"
    }

    if (!nigerianPhoneRegex.test(cleanNumber)) {
      return "Please enter a valid Nigerian phone number"
    }

    return ""
  }

  const handlePhoneNumberChange = (value: string) => {
    // Format phone number as user types
    const cleanValue = value.replace(/\D/g, "")
    let formattedValue = cleanValue

    if (cleanValue.length > 4) {
      formattedValue = `${cleanValue.substring(0, 4)} ${cleanValue.substring(4, 7)} ${cleanValue.substring(7, 11)}`
    }

    setPhoneNumber(formattedValue)
    detectNetwork(cleanValue)

    // Clear phone number error when user starts typing
    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: "" }))
    }
  }

  const handleAmountSelection = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount("")
    setIsCustomAmount(false)
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }))
    }
  }

  const handleCustomAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    setCustomAmount(numericValue)
    setSelectedAmount(null)
    setIsCustomAmount(true)
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Validate phone number
    const phoneError = validatePhoneNumber(phoneNumber)
    if (phoneError) {
      newErrors.phoneNumber = phoneError
    }

    // Validate provider selection
    if (!selectedProvider) {
      newErrors.provider = "Please select a network provider"
    }

    // Validate amount
    const amount = isCustomAmount ? Number.parseInt(customAmount) : selectedAmount
    if (!amount || amount < 50) {
      newErrors.amount = "Please select an amount or enter minimum ₦50"
    }
    if (amount && amount > 50000) {
      newErrors.amount = "Maximum amount is ₦50,000"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePurchase = async () => {
    if (!validateForm()) return

    setIsProcessing(true)

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Success - you would handle the actual purchase here
      alert("Airtime purchase successful!")

      // Reset form
      setPhoneNumber("")
      setSelectedProvider(null)
      setSelectedAmount(null)
      setCustomAmount("")
      setIsCustomAmount(false)
    } catch (error) {
      alert("Purchase failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const finalAmount = isCustomAmount ? Number.parseInt(customAmount) || 0 : selectedAmount || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
          <Smartphone className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">VTU Airtime Purchase</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Airtime</h1>
        <p className="text-gray-600">Instant airtime top-up for all Nigerian networks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Purchase Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Network Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Select Network Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {networkProviders.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider)}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedProvider?.id === provider.id
                        ? `${provider.bgColor} border-current ${provider.color} shadow-md`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 relative">
                        <Image
                          src={provider.logo || "/placeholder.svg"}
                          alt={`${provider.name} logo`}
                          width={64}
                          height={64}
                          className="rounded-lg"
                        />
                      </div>
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-500">VTU Available</p>
                    </div>
                    {selectedProvider?.id === provider.id && (
                      <div className="absolute -top-2 -right-2">
                        <div
                          className={`w-6 h-6 ${provider.color.replace("text-", "bg-")} rounded-full flex items-center justify-center`}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {errors.provider && (
                <div className="flex items-center gap-2 mt-3 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.provider}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phone Number Input */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Phone Number</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber">Mobile Number</Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0803 123 4567"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    className={`pl-12 ${errors.phoneNumber ? "border-red-500" : ""}`}
                    maxLength={13}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-500 font-medium">+234</span>
                  </div>
                </div>
                {errors.phoneNumber && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.phoneNumber}</span>
                  </div>
                )}
                {selectedProvider && phoneNumber && !errors.phoneNumber && (
                  <div className="flex items-center gap-2 mt-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">{selectedProvider.name} number detected</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Amount Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {airtimeAmounts.map((amount) => (
                  <div
                    key={amount.value}
                    onClick={() => handleAmountSelection(amount.value)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedAmount === amount.value && !isCustomAmount
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-bold">₦{amount.value.toLocaleString()}</p>
                      {amount.bonus && <p className="text-xs text-green-600 mt-1">{amount.bonus}</p>}
                    </div>
                    {amount.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs">
                        Popular
                      </Badge>
                    )}
                    {selectedAmount === amount.value && !isCustomAmount && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="border-t pt-4">
                <Label htmlFor="customAmount">Or Enter Custom Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                  <Input
                    id="customAmount"
                    type="text"
                    placeholder="Enter amount (min ₦50)"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={`pl-8 ${errors.amount ? "border-red-500" : ""}`}
                  />
                </div>
              </div>

              {errors.amount && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.amount}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Purchase Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Provider */}
              {selectedProvider && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Image
                    src={selectedProvider.logo || "/placeholder.svg"}
                    alt={selectedProvider.name}
                    width={40}
                    height={40}
                    className="rounded"
                  />
                  <div>
                    <p className="font-medium">{selectedProvider.name}</p>
                    <p className="text-sm text-gray-500">VTU Airtime</p>
                  </div>
                </div>
              )}

              {/* Phone Number */}
              {phoneNumber && (
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">+234 {phoneNumber.replace(/\D/g, "").substring(1)}</p>
                </div>
              )}

              {/* Amount */}
              {finalAmount > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₦{finalAmount.toLocaleString()}</p>
                </div>
              )}

              {/* Fees */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Airtime Amount</span>
                  <span>₦{finalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Fee</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>₦{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Zidcoin Reward */}
              {finalAmount >= 1000 && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      You'll earn {Math.floor(finalAmount / 1000)} Zidcoin
                      {Math.floor(finalAmount / 1000) > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Purchase Button */}
              <Button
                onClick={handlePurchase}
                disabled={!selectedProvider || !phoneNumber || finalAmount < 50 || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Buy Airtime
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              {/* Security Notice */}
              <div className="text-center text-xs text-gray-500 mt-4">
                <p>🔒 Secure payment powered by Zidwell</p>
                <p>Instant delivery • 24/7 support</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
