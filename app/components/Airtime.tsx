"use client";

import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import {
  Smartphone,
  Check,
  AlertCircle,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { useUserContextData } from "../context/userData";
import Image from "next/image";
import Loader from "./Loader";

interface AirtimeAmount {
  value: number;
  bonus?: string;
  popular?: boolean;
}

const prefixColorMap = [
  {
    id: "mtn",
    serviceName: "mtn_vtu",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
    prefix: [
      "0803",
      "0806",
      "0703",
      "0706",
      "0813",
      "0816",
      "0810",
      "0814",
      "0903",
      "0906",
      "0913",
    ],
  },
  {
    id: "airtel",
    serviceName: "airtel_vtu",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    prefix: ["0802", "0808", "0708", "0812", "0701", "0902", "0907", "0901"],
  },
  {
    id: "glo",
    serviceName: "glo_vtu",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    prefix: ["0805", "0807", "0705", "0815", "0811", "0905"],
  },
  {
    id: "9mobile",
    serviceName: "9mobile_vtu",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    prefix: ["0809", "0818", "0817", "0909", "0908"],
  },
];

const airtimeAmounts: AirtimeAmount[] = [
  { value: 100 },
  { value: 200, popular: true },
  { value: 500, bonus: "+50 bonus" },
  { value: 1000, bonus: "+100 bonus" },
  { value: 2000, bonus: "+300 bonus" },
  { value: 5000, bonus: "+750 bonus" },
  { value: 10000, bonus: "+1500 bonus" },
];

export default function AirtimePurchase() {
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [providers, setProviders] = useState<any[] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user } = useUserContextData();

  const handlePhoneNumberChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setPhoneNumber(cleanValue);

    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: "" }));
    }
  };

  const validatePhoneNumber = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "");
    const nigerianPhoneRegex = /^(0[7-9][0-1]\d{8}|234[7-9][0-1]\d{8})$/;

    if (!cleanNumber) return "Phone number is required";
    if (cleanNumber.length !== 11 && cleanNumber.length !== 13)
      return "Phone number must be 11 digits (starting with 0) or 13 digits (starting with 234)";
    if (!nigerianPhoneRegex.test(cleanNumber))
      return "Please enter a valid Nigerian phone number";

    return "";
  };

  const handleAmountSelection = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setIsCustomAmount(false);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleCustomAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setCustomAmount(numericValue);
    setSelectedAmount(null);
    setIsCustomAmount(true);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    if (!selectedProvider)
      newErrors.provider = "Please select a network provider";

    const amount = isCustomAmount ? parseInt(customAmount) : selectedAmount;

    if (amount && amount > 50000)
      newErrors.amount = "Maximum amount is ₦50,000";

    if (pin.length != 4) newErrors.amount = "Pin must be 4 digits";

    if (!pin) newErrors.amount = "Please enter transaction pin";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const finalAmount = isCustomAmount
    ? parseInt(customAmount) || 0
    : selectedAmount || 0;

  const getNetworkProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/airtime-providers");
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch providers");

      const merged = data?.data?.map((provider: any) => {
        const match = prefixColorMap.find((entry) =>
          entry.prefix.some((p) => provider.prefixes?.includes(p))
        );

        return {
          ...provider,
          color: match?.color || "text-gray-600",
          bgColor: match?.bgColor || "bg-gray-50 border-gray-200",
          prefix: provider.prefixes || [], // API prefixes used
        };
      });

      setProviders(merged);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const purchaseAirtime = async () => {
    if (!validateForm()) return;


    const payload = {
      amount: finalAmount,
      service: selectedProvider?.slug,
      customerId: phoneNumber.trim(),
      reference: `AIRTIME-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pin: pin.trim(),
    };

    try {
      setLoading(true);

      const response = await fetch("/api/buy-airtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
   
      if (!response.ok) throw data;

      Swal.fire({
        icon: "success",
        title: "Airtime Purchase Successful",
        text: `₦${payload.amount} sent to ${payload.customerId}`,
        confirmButtonColor: "#0f172a",
      });

      // Reset form
      setPhoneNumber("");
      setPin("");
      setSelectedProvider(null);
      setSelectedAmount(null);
      setCustomAmount("");
      setIsCustomAmount(false);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Airtime Purchase Failed",
        html: `<strong>${error.message}</strong><br/><small>${
          error.detail || ""
        }</small>`,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    if (cleanNumber.length >= 4) {
      const prefix = cleanNumber.substring(0, 4);
      // console.log("Checking prefix:", prefix);

      // Find the provider using the prefixColorMap
      const matchedPrefixData = prefixColorMap.find((entry) =>
        entry.prefix.includes(prefix)
      );

      if (!matchedPrefixData) return;

      const matchedProvider = providers?.find(
        (provider) =>
          provider.slug === matchedPrefixData.serviceName ||
          provider.name.toLowerCase().includes(matchedPrefixData.id)
      );

      // console.log("Matched Provider:", matchedProvider);

      if (matchedProvider && matchedProvider?.name !== selectedProvider?.name) {
        setSelectedProvider(matchedProvider);
      }
    }
  }, [phoneNumber, providers]);

  useEffect(() => {
    if (user) getNetworkProviders();
  }, [user]);

  if (loading && !providers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Airtime</h1>
        <p className="text-gray-600">
          Instant airtime top-up for all Nigerian networks
        </p>
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
                {providers?.map((provider: any, i) => {
                 
                  const isSelected = selectedProvider?.name === provider.name;

                  return (
                    <div
                      key={i}
                      onClick={() =>
                        setSelectedProvider(provider)
                      }
                      className={`relative p-4 border-2 rounded-md transition-all duration-200 ${
                        isSelected
                          ? "bg-gray-100 border-gray-600 text-gray-900 shadow-md"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 relative">
                          <Image
                            src={provider.logo}
                            alt={`${provider.name} logo`}
                            width={64}
                            height={64}
                            className="rounded-lg"
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {provider.name}
                        </h3>
                       
                      </div>

                      {isSelected && (
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

          {/* Phone Number Input */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Phone Number</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Mobile Number</Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0803 123 4567"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    className={`pl-14 ${
                      errors.phoneNumber ? "border-red-500" : ""
                    }`}
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
                {selectedProvider && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{selectedProvider.name} detected</span>
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

              {/* Pin Input */}
              <div className="border-t pt-4">
                <Label htmlFor="pin">Transaction Pin</Label>

                <Input
                  id="pin"
                  type="text"
                  placeholder="Enter Pin here.."
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className={` ${errors.pin ? "border-red-500" : ""}`}
                />
              </div>

              {errors.pin && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.pin}</span>
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
              {selectedProvider && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{selectedProvider.id}</p>
                    <p className="text-sm text-gray-500">VTU Airtime</p>
                  </div>
                </div>
              )}

              {phoneNumber && (
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">
                    +234 {phoneNumber.replace(/\D/g, "").substring(1)}
                  </p>
                </div>
              )}

              {finalAmount > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{finalAmount.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Airtime Amount</span>
                  <span>₦{finalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Wallet balance after</span>
                  <span className="text-green-600">
                    -₦{finalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>₦{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={purchaseAirtime}
                disabled={
                  !selectedProvider ||
                  !phoneNumber ||
                  !finalAmount ||
                  !pin ||
                  loading
                }
                className="w-full bg-[#C29307] hover:bg-[#C29307] text-white py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Buy Airtime
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              <div className="text-center text-xs text-gray-500 mt-4">
                <p>🔒 Secure payment powered by Zidwell</p>
                <p>Instant delivery • 24/7 support</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
