"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Check,
  AlertCircle,
  Building2Icon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import phedLogo from "../assets/phed-logo.png";
import Image from "next/image";
import { useUserContextData } from "../context/userData";
import ElectricityCustomerCard from "./ElectricityCusInfo";
import Swal from "sweetalert2";

interface AirtimeAmount {
  value: number;
}

const airtimeAmounts: AirtimeAmount[] = [
  { value: 1000 },
  { value: 2000 },
  { value: 5000 },
  { value: 10000 },
];

export default function ElectricityBills() {
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [powerProvider, setPowerProviders] = useState<any | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [meterNumber, setMeterNumber] = useState("");
  const [meterType, setMeterType] = useState("");
  const [decoderNumber, setDecoderNumber] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUserContextData();

  const meterTypes = ["Prepaid", "Postpaid"];

  const validateAmount = (amt: number | null) => {
    if (!amt) return "Amount is required";
    if (amt < 100) return "Minimum amount is ₦1000";
    if (amt > 50000) return "Maximum amount is ₦50,000";
    return "";
  };

  const handleAmountSelection = (amount: number) => {
    setSelectedAmount(amount);
    setAmount(amount);
    setCustomAmount(null);
    setIsCustomAmount(false);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleCustomAmountChange = (value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, ""), 10);
    setCustomAmount(numericValue);
    setAmount(numericValue);
    setSelectedAmount(null);
    setIsCustomAmount(true);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleMeterNumberChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setMeterNumber(cleanValue);
    setIsVerified(false);

    if (errors.meterNumber) {
      setErrors((prev) => ({ ...prev, meterNumber: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedProvider) {
      newErrors.provider = "Please select an electricity provider";
    }

    if (!isVerified) {
      newErrors.verification = "Please verify your meter number first";
    }

    const amountError = validateAmount(amount);
    if (amountError) {
      newErrors.amount = amountError;
    }

     if (!meterNumber) {
    newErrors.meterNumber = "Please enter your meter number";
  }
  if (!meterType) {
    newErrors.meterType = "Please select a meter type";
  }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handlePayment = async () => {
  // Step 1: Validate form
  if (!validateForm()) return;

  // Step 2: Ensure critical selections exist
  if (!selectedProvider?.slug) {
    Swal.fire({
      icon: "error",
      title: "Missing Information",
      text: "Please ensure you've selected a provider",
      confirmButtonColor: "#dc2626",
    });
    return;
  }

  // Step 3: Ensure userInfo exists
  if (!userInfo) {
    Swal.fire({
      icon: "error",
      title: "Missing Customer Info",
      text: "Please validate your meter number before proceeding.",
      confirmButtonColor: "#dc2626",
    });
    return;
  }

  // Step 4: Validate amount
  if (!amount || isNaN(Number(amount))) {
    Swal.fire({
      icon: "error",
      title: "Invalid Amount",
      text: "Amount must be a valid number.",
      confirmButtonColor: "#dc2626",
    });
    return;
  }



  // Step 5: Build payload
  const payload = {
    service: selectedProvider.slug,
    meterNumber: userInfo.meterNumber,
    meterType: userInfo.meterType.toLowerCase(),
    amount: Number(amount),
    customerName: userInfo.customerName,
    customerAddress: userInfo.customerAddress,
    reference: `power-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };

  // console.log("📦 Purchase payload:", mdata, payload);

  // Step 6: Make the request
  try {
    setLoading(true);

    const response = await fetch("/api/buy-electricity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) throw data;

    Swal.fire({
      icon: "success",
      title: "Power Purchase Successful",
      confirmButtonColor: "#0f172a",
    });

    // Clear form
    setSelectedProvider(null);
    setSelectedPlan(null);
    setAmount(null);
    setUserInfo(null);
  } catch (error: any) {
    Swal.fire({
      icon: "error",
      title: "Power Purchase Failed",
      html: `<strong>${error.message || "Something went wrong"}</strong><br/><small>${error.detail || ""}</small>`,
      confirmButtonColor: "#dc2626",
    });
  } finally {
    setLoading(false);
  }
};

  

  const getPowerProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/electricity-providers");
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to fetch providers");

      console.log("Power providers fetched:", data);
      setPowerProviders(data);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

const ValidateMeterNumber = async () => {
  const newErrors: { [key: string]: string } = {};

  // Input validation before making request
  if (!selectedProvider?.slug) {
    newErrors.provider = "Please select an electricity provider";
  }
 

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  const payload = {
    service: selectedProvider.slug,
    meterNumber: meterNumber.trim(),
    meterType: meterType.trim(),
  };

  try {
    setLoading(true);
    const response = await fetch("/api/validate-electricity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to validate meter number");
    }

    setUserInfo(data.data);
    setIsVerified(true);
    setErrors((prev) => ({ ...prev, meterNumber: "", provider: "", meterType: "" }));
    console.log("✅ Meter validation response:", data);
  } catch (error: any) {
    setIsVerified(false);
    setUserInfo(null);
    console.error("❌ Meter validation failed:", error.message);

    setErrors((prev) => ({
      ...prev,
      meterNumber: "Meter number validation failed. Please check and try again.",
    }));
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (user) getPowerProviders();
  }, [user]);

  useEffect(() => {
    if (meterNumber && meterType) ValidateMeterNumber();
  }, [meterNumber, meterType]);

  // 0209227217814
 

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
       
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pay Electricity Bills
        </h1>
        <p className="text-muted-foreground">
          Pay your electricity bills instantly across all DISCOs in Nigeria
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2Icon className="w-5 h-5" />
                Select Network Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {powerProvider?.data.map((provider: any) => {
                  const isDisabled = provider.status !== true;
                  const isSelected = selectedProvider?.name === provider.name;

                  return (
                    <div
                      key={provider.id}
                      onClick={() =>
                        !isDisabled && setSelectedProvider(provider)
                      }
                      className={`relative p-4 border-2 rounded-md transition-all duration-200 ${
                        isSelected
                          ? "bg-gray-100 border-gray-600 text-gray-900 shadow-md"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      } ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : "cursor-pointer hover:shadow-md"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 relative">
                          <Image
                            src={provider.logo}
                            alt={`${provider.name} logo`}
                            fill
                            className="rounded-lg object-contain"
                          />
                        </div>

                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                          {provider.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {provider.status ? "VTU Available" : "Unavailable"}
                        </p>
                      </div>

                      {isSelected && !isDisabled && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.provider && (
                <div className="flex items-center gap-2 mt-3 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.provider}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meter Details */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>Meter Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meterType">Meter Type</Label>
                    <Select
                      value={meterType}
                      onValueChange={(value) => {
                        setMeterType(value);
                        setIsVerified(false);
                      
                        setDecoderNumber("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meter type" />
                      </SelectTrigger>
                      <SelectContent>
                        {meterTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.meterType && (
                      <div className="flex items-center gap-2 mt-1 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{errors.meterType}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="meterNumber">Meter Number</Label>
                    <Input
                      id="meterNumber"
                      type="text"
                      placeholder="Enter meter number"
                      value={meterNumber}
                      onChange={(e) => handleMeterNumberChange(e.target.value)}
                      className={errors.meterNumber ? "border-destructive" : ""}
                      maxLength={13}
                    />
                    {errors.meterNumber && (
                      <div className="flex items-center gap-2 mt-1 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{errors.meterNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                            ${
                              selectedAmount === amount.value && !isCustomAmount
                                ? "border-[#C29307] bg-blue-50 text-[#C29307]"
                                : "border-gray-100 hover:border-gray-200"
                            }`}
                  >
                    <div className="text-center">
                      <p className="font-bold">
                        ₦{amount.value.toLocaleString()}
                      </p>
                    </div>
                    {selectedAmount === amount.value && !isCustomAmount && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-[#C29307] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="border-t pt-4">
                <Label htmlFor="customAmount">Or Enter Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₦
                  </span>
                  <Input
                    id="customAmount"
                    type="text"
                    placeholder="Enter amount (min ₦1000)"
                    value={customAmount || ""}
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

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          
            <ElectricityCustomerCard
              customerName={userInfo?.customerName || ""}
              customerAddress={userInfo?.customerAddress || ""}
              meterNumber={userInfo?.meterNumber || ""}
              meterType={userInfo?.meterType || ""}
              minVendAmount={userInfo?.minVendAmount || 0}
              selectedProvider={selectedProvider}
              selectedPlan={selectedPlan}
              amount={amount}
              loading={loading}
              handlePayment={handlePayment}
              errors={errors}
            />
        
        </div>
      </div>
    </div>
  );
}
