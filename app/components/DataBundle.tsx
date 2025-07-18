"use client"

import { useState } from "react"
import { Wifi, Check, AlertCircle, CreditCard, ArrowRight, Clock, Smartphone } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
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

interface DataPlan {
  id: string
  size: string
  price: number
  validity: string
  description?: string
  popular?: boolean
  bonus?: string
}

interface DataCategory {
  id: string
  name: string
  plans: DataPlan[]
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

const dataPlans: { [key: string]: DataCategory[] } = {
  mtn: [
    {
      id: "daily",
      name: "Daily Plans",
      plans: [
        { id: "mtn-daily-1", size: "100MB", price: 100, validity: "1 Day" },
        { id: "mtn-daily-2", size: "200MB", price: 200, validity: "1 Day", popular: true },
        { id: "mtn-daily-3", size: "500MB", price: 500, validity: "1 Day" },
        { id: "mtn-daily-4", size: "1GB", price: 800, validity: "1 Day", bonus: "+200MB bonus" },
      ],
    },
    {
      id: "weekly",
      name: "Weekly Plans",
      plans: [
        { id: "mtn-weekly-1", size: "1GB", price: 1200, validity: "7 Days" },
        { id: "mtn-weekly-2", size: "2GB", price: 2000, validity: "7 Days", popular: true },
        { id: "mtn-weekly-3", size: "3GB", price: 2500, validity: "7 Days", bonus: "+500MB bonus" },
        { id: "mtn-weekly-4", size: "5GB", price: 3500, validity: "7 Days", bonus: "+1GB bonus" },
      ],
    },
    {
      id: "monthly",
      name: "Monthly Plans",
      plans: [
        { id: "mtn-monthly-1", size: "2GB", price: 2500, validity: "30 Days" },
        { id: "mtn-monthly-2", size: "5GB", price: 5000, validity: "30 Days", popular: true },
        { id: "mtn-monthly-3", size: "10GB", price: 8000, validity: "30 Days", bonus: "+2GB bonus" },
        { id: "mtn-monthly-4", size: "20GB", price: 15000, validity: "30 Days", bonus: "+5GB bonus" },
        { id: "mtn-monthly-5", size: "40GB", price: 25000, validity: "30 Days", bonus: "+10GB bonus" },
      ],
    },
  ],
  airtel: [
    {
      id: "daily",
      name: "Daily Plans",
      plans: [
        { id: "airtel-daily-1", size: "100MB", price: 100, validity: "1 Day" },
        { id: "airtel-daily-2", size: "300MB", price: 200, validity: "1 Day", popular: true },
        { id: "airtel-daily-3", size: "500MB", price: 400, validity: "1 Day" },
        { id: "airtel-daily-4", size: "1GB", price: 700, validity: "1 Day", bonus: "+300MB bonus" },
      ],
    },
    {
      id: "weekly",
      name: "Weekly Plans",
      plans: [
        { id: "airtel-weekly-1", size: "1.5GB", price: 1000, validity: "7 Days" },
        { id: "airtel-weekly-2", size: "3GB", price: 1800, validity: "7 Days", popular: true },
        { id: "airtel-weekly-3", size: "6GB", price: 3000, validity: "7 Days", bonus: "+1GB bonus" },
        { id: "airtel-weekly-4", size: "10GB", price: 4500, validity: "7 Days", bonus: "+2GB bonus" },
      ],
    },
    {
      id: "monthly",
      name: "Monthly Plans",
      plans: [
        { id: "airtel-monthly-1", size: "3GB", price: 2000, validity: "30 Days" },
        { id: "airtel-monthly-2", size: "6GB", price: 3500, validity: "30 Days", popular: true },
        { id: "airtel-monthly-3", size: "12GB", price: 6000, validity: "30 Days", bonus: "+3GB bonus" },
        { id: "airtel-monthly-4", size: "25GB", price: 12000, validity: "30 Days", bonus: "+5GB bonus" },
        { id: "airtel-monthly-5", size: "50GB", price: 20000, validity: "30 Days", bonus: "+10GB bonus" },
      ],
    },
  ],
  glo: [
    {
      id: "daily",
      name: "Daily Plans",
      plans: [
        { id: "glo-daily-1", size: "150MB", price: 100, validity: "1 Day" },
        { id: "glo-daily-2", size: "350MB", price: 200, validity: "1 Day", popular: true },
        { id: "glo-daily-3", size: "750MB", price: 500, validity: "1 Day" },
        { id: "glo-daily-4", size: "1.2GB", price: 800, validity: "1 Day", bonus: "+300MB bonus" },
      ],
    },
    {
      id: "weekly",
      name: "Weekly Plans",
      plans: [
        { id: "glo-weekly-1", size: "1.8GB", price: 1200, validity: "7 Days" },
        { id: "glo-weekly-2", size: "3.5GB", price: 2000, validity: "7 Days", popular: true },
        { id: "glo-weekly-3", size: "7GB", price: 3500, validity: "7 Days", bonus: "+1.5GB bonus" },
        { id: "glo-weekly-4", size: "12GB", price: 5000, validity: "7 Days", bonus: "+3GB bonus" },
      ],
    },
    {
      id: "monthly",
      name: "Monthly Plans",
      plans: [
        { id: "glo-monthly-1", size: "4GB", price: 2500, validity: "30 Days" },
        { id: "glo-monthly-2", size: "7.5GB", price: 4000, validity: "30 Days", popular: true },
        { id: "glo-monthly-3", size: "15GB", price: 7500, validity: "30 Days", bonus: "+3GB bonus" },
        { id: "glo-monthly-4", size: "30GB", price: 14000, validity: "30 Days", bonus: "+7GB bonus" },
        { id: "glo-monthly-5", size: "60GB", price: 25000, validity: "30 Days", bonus: "+15GB bonus" },
      ],
    },
  ],
  "9mobile": [
    {
      id: "daily",
      name: "Daily Plans",
      plans: [
        { id: "9mobile-daily-1", size: "100MB", price: 100, validity: "1 Day" },
        { id: "9mobile-daily-2", size: "250MB", price: 200, validity: "1 Day", popular: true },
        { id: "9mobile-daily-3", size: "500MB", price: 400, validity: "1 Day" },
        { id: "9mobile-daily-4", size: "1GB", price: 750, validity: "1 Day", bonus: "+250MB bonus" },
      ],
    },
    {
      id: "weekly",
      name: "Weekly Plans",
      plans: [
        { id: "9mobile-weekly-1", size: "1.5GB", price: 1100, validity: "7 Days" },
        { id: "9mobile-weekly-2", size: "3GB", price: 1900, validity: "7 Days", popular: true },
        { id: "9mobile-weekly-3", size: "6GB", price: 3200, validity: "7 Days", bonus: "+1GB bonus" },
        { id: "9mobile-weekly-4", size: "10GB", price: 4800, validity: "7 Days", bonus: "+2GB bonus" },
      ],
    },
    {
      id: "monthly",
      name: "Monthly Plans",
      plans: [
        { id: "9mobile-monthly-1", size: "2.5GB", price: 2200, validity: "30 Days" },
        { id: "9mobile-monthly-2", size: "5.5GB", price: 3800, validity: "30 Days", popular: true },
        { id: "9mobile-monthly-3", size: "11GB", price: 6500, validity: "30 Days", bonus: "+2GB bonus" },
        { id: "9mobile-monthly-4", size: "22GB", price: 12500, validity: "30 Days", bonus: "+5GB bonus" },
        { id: "9mobile-monthly-5", size: "45GB", price: 22000, validity: "30 Days", bonus: "+10GB bonus" },
      ],
    },
  ],
}

export default function DataBundlePurchase() {
  const [selectedProvider, setSelectedProvider] = useState<NetworkProvider | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null)
  const [activeCategory, setActiveCategory] = useState("daily")
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
        setSelectedPlan(null) // Reset selected plan when provider changes
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

  const handlePlanSelection = (plan: DataPlan) => {
    setSelectedPlan(plan)
    if (errors.plan) {
      setErrors((prev) => ({ ...prev, plan: "" }))
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

    // Validate plan selection
    if (!selectedPlan) {
      newErrors.plan = "Please select a data plan"
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
      alert("Data bundle purchase successful!")

      // Reset form
      setPhoneNumber("")
      setSelectedProvider(null)
      setSelectedPlan(null)
    } catch (error) {
      alert("Purchase failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const currentPlans = selectedProvider ? dataPlans[selectedProvider.id] || [] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
          <Wifi className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">VTU Data Bundle Purchase</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Data Bundle</h1>
        <p className="text-gray-600">Instant data bundle top-up for all Nigerian networks</p>
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
                    onClick={() => {
                      setSelectedProvider(provider)
                      setSelectedPlan(null) // Reset plan when provider changes
                    }}
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
                      <p className="text-sm text-gray-500">Data Available</p>
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

          {/* Data Plans Selection */}
          {selectedProvider && currentPlans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Select Data Plan - {selectedProvider.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>

                  {currentPlans.map((category) => (
                    <TabsContent key={category.id} value={category.id} className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.plans.map((plan) => (
                          <div
                            key={plan.id}
                            onClick={() => handlePlanSelection(plan)}
                            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedPlan?.id === plan.id
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-lg">{plan.size}</h4>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm">{plan.validity}</span>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">₦{plan.price.toLocaleString()}</p>
                              {plan.bonus && <p className="text-sm text-green-600 font-medium">{plan.bonus}</p>}
                              {plan.description && <p className="text-sm text-gray-600">{plan.description}</p>}
                            </div>

                            {plan.popular && (
                              <Badge className="absolute -top-2 left-4 bg-orange-500 text-white text-xs">Popular</Badge>
                            )}

                            {selectedPlan?.id === plan.id && (
                              <div className="absolute -top-2 -right-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {errors.plan && (
                  <div className="flex items-center gap-2 mt-4 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.plan}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
                    <p className="text-sm text-gray-500">Data Bundle</p>
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

              {/* Selected Plan */}
              {selectedPlan && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Data Plan</p>
                    <p className="font-medium text-lg">{selectedPlan.size}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Valid for {selectedPlan.validity}</span>
                  </div>
                  {selectedPlan.bonus && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="text-sm text-green-700 font-medium">{selectedPlan.bonus}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing */}
              {selectedPlan && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Data Bundle</span>
                    <span>₦{selectedPlan.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>₦{selectedPlan.price.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Zidcoin Reward */}
              {selectedPlan && selectedPlan.price >= 1000 && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      You'll earn {Math.floor(selectedPlan.price / 1000)} Zidcoin
                      {Math.floor(selectedPlan.price / 1000) > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Purchase Button */}
              <Button
                onClick={handlePurchase}
                disabled={!selectedProvider || !phoneNumber || !selectedPlan || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Buy Data Bundle
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              {/* Security Notice */}
              <div className="text-center text-xs text-gray-500 mt-4">
                <p>🔒 Secure payment powered by Zidwell</p>
                <p>Instant activation • 24/7 support</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
