"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Check,
  AlertCircle,
  Building2Icon,
  ArrowLeft,
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
import Image from "next/image";
import { useUserContextData } from "../context/userData";
import ElectricityCustomerCard from "./ElectricityCusInfo";
import Swal from "sweetalert2";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import PinPopOver from "./PinPopOver";

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
  const inputCount = 4;
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [powerProviders, setPowerProviders] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [meterNumber, setMeterNumber] = useState("");
  const [meterType, setMeterType] = useState("");
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const { userData, setUserData } = useUserContextData();
  const router = useRouter();
  const meterTypes = ["Prepaid", "Postpaid"];
  const [validatedMeters, setValidatedMeters] = useState<{
    [key: string]: any;
  }>({});

  const validateAmount = (amt: number | null) => {
    if (!amt) return "Amount is required";
    if (amt < 1000) return "Minimum amount is ₦1000";
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

    if (pin.length != 4) newErrors.pin = "Pin must be 4 digits";

    if (!pin) newErrors.pin = "Please enter transaction pin";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    // Step 1: Validate form
    if (!validateForm()) return;

    // Step 2: Ensure critical selections exist
    if (!selectedProvider?.id) {
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
      disco: selectedProvider.id,
      pin,
      customerId: userInfo.meterNumber,
      meterType: userInfo.meterType.toLowerCase(),
      amount: Number(amount),
      payerName: userData?.firstName || "Valued Customer",
      merchantTxRef: `power-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    console.log("📦 Purchase payload:", payload);

    // Step 6: Make the request
    try {
      setLoading3(true);

      const response = await fetch("/api/buy-electricity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw data;

      // if (data.newWalletBalance !== undefined) {
      //   setUserData((prev: any) => {
      //     const updated = { ...prev, walletBalance: data.newWalletBalance };
      //     localStorage.setItem("userData", JSON.stringify(updated));
      //     return updated;
      //   });
      // }

      Swal.fire({
        icon: "success",
        title: "Power Purchase Successful",
        confirmButtonColor: "#0f172a",
      }).then(() => {
        window.location.reload();
      });

      // Clear form
      setPin(Array(inputCount).fill(""));
      setSelectedProvider(null);
      setSelectedPlan(null);
      setAmount(null);
      setUserInfo(null);
      
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Power Purchase Failed",
        html: `<strong>${
          error.message || "Something went wrong"
        }</strong><br/><small>${error.detail || ""}</small>`,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading3(false);
    }
  };

  const getPowerProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/electricity-providers");
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to fetch providers");

      const prefixLogos: Record<string, string> = {
        phed: "/disco-img/portharcourt.png",
        jed: "/disco-img/jos.png",
        kaduna: "/disco-img/kaduna.png",
        ibedc: "/disco-img/ibadan.png",
        eko: "/disco-img/eko.png",
        benin: "/disco-img/benin.png",
        abuja: "/disco-img/abuja.png",
        kano: "/disco-img/kano.png",
        ikeja: "/disco-img/ikeja.png",
        enugu: "/disco-img/enugu.png",
      };

      // Merge logos into the providers
      const enrichedProviders = data.data.map((provider: any) => ({
        ...provider,
        logo: prefixLogos[provider.id] || null,
      }));

      // console.log("Enriched providers:", enrichedProviders);
      setPowerProviders(enrichedProviders);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateMeterNumber = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedProvider?.id) {
      newErrors.provider = "Please select an electricity provider";
    }

    if (!meterNumber) {
      newErrors.meterNumber = "Meter number is required";
    } else if (!/^\d{10,14}$/.test(meterNumber)) {
      newErrors.meterNumber = "Meter number must be 10–14 digits";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsVerified(false);
      return;
    }

    // ✅ Check cache first
    if (validatedMeters[meterNumber]) {
      setUserInfo(validatedMeters[meterNumber]);
      setIsVerified(true);
      setErrors({});
      return;
    }

    const params = new URLSearchParams({
      disco: selectedProvider.id || "",
      customerId: meterNumber.trim(),
    });

    try {
      setLoading2(true);

      const response = await fetch(`/api/validate-electricity?${params}`, {
        method: "GET",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Validation failed");

      // Success
      setUserInfo(data.data);
      setIsVerified(true);
      setErrors({});
      setValidatedMeters((prev) => ({ ...prev, [meterNumber]: data }));
      console.log("✅ Meter validation:", data);
    } catch (err: any) {
      setIsVerified(false);
      setUserInfo(null);
      setErrors({
        meterNumber:
          "Meter number validation failed. Please check and try again.",
      });
      console.error("❌ Validation failed:", err.message);
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    getPowerProviders();
  }, []);

  // 0209227217814

  return (
    <div className="space-y-6 md:max-w-5xl md:mx-auto pointer-events-none opacity-50">
      {/* Header */}
      <PinPopOver
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        pin={pin}
        setPin={setPin}
        inputCount={inputCount}
        onConfirm={() => {
          handlePayment();
        }}
      />

      <div className="flex items-start  space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden md:block">Back</span>
        </Button>

        <div className="">
          <h1 className="md:text-3xl text-xl font-bold mb-2">
            Pay Electricity Bills
          </h1>
          <p className=" text-muted-foreground">
            Pay your electricity bills instantly across all DISCOs in Nigeria
          </p>
        </div>
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
              {loading ? (
                // 🔄 Loading skeleton (while fetching)
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-4 border-2 rounded-md bg-gray-100 animate-pulse"
                    >
                      <div className="w-16 h-16 bg-gray-300 rounded mx-auto mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {powerProviders?.map((provider: any) => {
                    const isSelected = selectedProvider?.name === provider.name;

                    return (
                      <div
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider)}
                        className={`relative p-4 border-2 rounded-md transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-gray-100 border-[#C29307] text-gray-900 shadow-md"
                            : "bg-white border-gray-200 hover:border-gray-300"
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
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {provider.name}
                          </h3>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2">
                            <div className="w-6 h-6 bg-[#C29307] rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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
                        setMeterNumber("");
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
                    <div className="flex items-center gap-3">
                      <Input
                        id="meterNumber"
                        type="text"
                        placeholder="Enter meter number"
                        value={meterNumber}
                        onChange={(e) =>
                          handleMeterNumberChange(e.target.value)
                        }
                        className={
                          errors.meterNumber ? "border-destructive" : ""
                        }
                        onBlur={validateMeterNumber}
                        maxLength={13}
                      />
                      {loading2 ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      ) : isVerified ? (
                        <div className="text-green-600" title="Verified">
                          <Check className="w-6 h-6" />
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={validateMeterNumber}
                          disabled={!meterNumber || !meterType}
                        >
                          Verify
                        </Button>
                      )}
                    </div>
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

          {/* Pin Input */}
          {/* <div className="border-t pt-4">
            <Label htmlFor="pin">Transaction Pin</Label>

            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="\d*"
              placeholder="Enter Pin here.."
              value={pin}
              maxLength={4}
              onChange={(e) => setPin(e.target.value)}
              className={` ${errors.pin ? "border-red-500" : ""}`}
            />
          </div>

          {errors.pin && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.pin}</span>
            </div>
          )} */}
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <ElectricityCustomerCard
            customerName={userInfo || ""}
            meterNumber={meterNumber || ""}
            meterType={meterType || ""}
            selectedProvider={selectedProvider}
            selectedPlan={selectedPlan}
            amount={amount}
            loading={loading3}
            validateForm={validateForm}
            setIsOpen={setIsOpen}
            errors={errors}
          />
        </div>
      </div>
    </div>
  );
}
