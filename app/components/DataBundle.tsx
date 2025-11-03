"use client";

import {
  Wifi,
  Check,
  AlertCircle,
  CreditCard,
  ArrowRight,
  Clock,
  Smartphone,
  ArrowLeft,
} from "lucide-react";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useUserContextData } from "../context/userData";
import DataPlanSelector from "./DataPlansSelector";
import Image from "next/image";
import Loader from "./Loader";
import { useRouter } from "next/navigation";
import PinPopOver from "./PinPopOver";

const prefixColorMap = [
  {
    id: "mtn",
    name: "MTN",
    src: "/networks-img/mtn.png",
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
    name: "Airtel",
    src: "/networks-img/airtel.png",
    prefix: ["0802", "0808", "0708", "0812", "0701", "0902", "0907", "0901"],
  },
  {
    id: "glo",
    name: "Glo",
    src: "/networks-img/glo.png",
    prefix: ["0805", "0807", "0705", "0815", "0811", "0905"],
  },
  {
    id: "9mobile",
    name: "9mobile",
    src: "/networks-img/9mobile.png",
    prefix: ["0809", "0818", "0817", "0909", "0908"],
  },
];

export default function DataBundlePurchase() {
  const inputCount = 4;
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const { userData, setUserData } = useUserContextData();
  const router = useRouter();
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
      return "Phone number must be 11 or 13 digits";
    if (!nigerianPhoneRegex.test(cleanNumber))
      return "Please enter a valid Nigerian phone number";

    return "";
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    if (!selectedProvider) newErrors.provider = "Please select a provider";
    if (!selectedPlan) newErrors.plan = "Please select a plan";

    if (pin.length != 4) newErrors.pin = "Pin must be 4 digits";

    if (!pin) newErrors.pin = "Please enter transaction pin";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const purchaseDatabundle = async () => {
    // Step 1: Validate form
    if (!validateForm()) return;

    // Step 2: Confirm required data is present
    if (!selectedProvider?.id || !selectedPlan) {
      Swal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please ensure you've selected a provider and a data plan.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const serviceName = selectedProvider.id;
    if (!serviceName) {
      Swal.fire({
        icon: "error",
        title: "Invalid Provider",
        text: "Unable to match provider with data service.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    // Step 4: Build payload
    const payload = {
      userId: userData?.id,
      pin: pin,
      amount: selectedPlan.amount,
      network: serviceName,
      phoneNumber: phoneNumber,
      merchantTxRef: `Data-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderName: userData?.firstName || "Zidwell User",
    };

    // console.log("📦 Purchase payload:", payload);

    // Step 5: Make request
    try {
      setLoading2(true);
      const response = await fetch("/api/buy-data-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("DataBundle Purchase Response Data:", data);
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
        title: "Data Bundle Purchase Successful",
        text: `₦${payload.amount} sent to ${payload.phoneNumber}`,
        confirmButtonColor: "#0f172a",
      }).then(() => {
        window.location.reload();
      });

      // Clear inputs after successful purchase
      setPin(Array(inputCount).fill(""));
      setPhoneNumber("");
      setSelectedProvider(null);
      setSelectedPlan(null);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Databundle Purchase Failed",
        html: `<strong>${error.message}</strong><br/><small>${
          error.detail || ""
        }</small>`,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading2(false);
    }
  };

  // const getNetworkProviders = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await fetch("/api/data-bundle-providers");
  //     const data = await response.json();

  //     if (!response.ok)
  //       throw new Error(data.error || "Failed to fetch providers");

  //     const merged = data?.data?.map((provider: any) => {
  //       const match = prefixColorMap.find((entry) =>
  //         entry.prefix.some((p) => provider.prefixes?.includes(p))
  //       );
  //       return {
  //         ...provider,
  //         color: match?.color || "text-gray-600",
  //         bgColor: match?.bgColor || "bg-gray-50 border-gray-200",
  //       };
  //     });

  //     setProviders(merged);
  //   } catch (error: any) {
  //     console.error("Fetch error:", error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const getNetworkDataBundle = async () => {
    if (!selectedProvider?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/get-data-bundles?service=${selectedProvider?.id}`
      );
      const data = await response.json();
      console.log("📦 Bundles data:", data);
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch bundles");
      setBundles(data.data);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (cleanNumber.length >= 4) {
      const prefix = cleanNumber.substring(0, 4);
      const matchedProvider = prefixColorMap.find((entry) =>
        entry.prefix.includes(prefix)
      );
      if (matchedProvider && matchedProvider?.id !== selectedProvider?.id) {
        setSelectedProvider(matchedProvider);
      }
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (selectedProvider) getNetworkDataBundle();
  }, [selectedProvider]);

  console.log("selectedProvider", selectedProvider);

  // useEffect(() => {
  //   if (user) getNetworkProviders();
  // }, [user]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6 md:max-w-5xl md:mx-auto">
      {/* Header */}
      <PinPopOver
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        pin={pin}
        setPin={setPin}
        inputCount={inputCount}
        onConfirm={() => {
          purchaseDatabundle();
        }}
      />

      <div className="flex items-start  space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 md:mr-2" />
          <span className="hidden md:block">Back</span>
        </Button>

        <div className="">
          <h1 className="md:text-3xl text-xl font-bold mb-2">
            Buy Data Bundle
          </h1>
          <p className=" text-muted-foreground">
            Instant Data bundle top-up for all Nigerian networks
          </p>
        </div>
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
                {prefixColorMap?.map((provider: any, index: any) => {
                  const isSelected = selectedProvider?.name === provider.name;

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedProvider(provider)}
                      className={`relative p-4 border-2 rounded-md transition-all duration-200 ${
                        isSelected
                          ? "bg-gray-100 border-[#C29307] text-gray-900 shadow-md"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 relative">
                          <Image
                            src={provider.src}
                            alt={`${provider.name} logo`}
                            width={64}
                            height={64}
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900">
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
          <div>
            <Label>Select Plan</Label>

            <DataPlanSelector
              plans={bundles || []}
              selectedPlan={selectedPlan}
              onSelect={(plan) => setSelectedPlan(plan)}
              loading={loading}
            />
            {errors.plan && (
              <p className="text-sm text-red-500">{errors.plan}</p>
            )}
          </div>

          {/* Pin Input */}
          {/* <div className="border-t pt-4">
            <Label htmlFor="pin">Transaction Pin</Label>

            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={4}
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
          )} */}
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
                    src={selectedProvider.src || "/placeholder.svg"}
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
                  <p className="font-medium">
                    +234 {phoneNumber.replace(/\D/g, "").substring(1)}
                  </p>
                </div>
              )}

              {/* Selected Plan */}
              {selectedPlan && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Data Plan</p>
                    <p className="font-medium text-lg">
                      {selectedPlan.description}
                    </p>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Databundle Amount</span>
                    <span>₦{formatNumber(selectedPlan.amount)}</span>
                  </div>
                </div>
              )}

              {/* Purchase Button */}
              <Button
                onClick={() => {
                  if (validateForm()) {
                    setIsOpen(true);
                  }
                }}
                disabled={!phoneNumber || !selectedPlan || loading2}
                className="w-full bg-[#C29307] hover:bg-[#C29307] text-white py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading2 ? (
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
  );
}
