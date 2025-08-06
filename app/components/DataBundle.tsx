"use client";

import {
  Wifi,
  Check,
  AlertCircle,
  CreditCard,
  ArrowRight,
  Clock,
  Smartphone,
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

const prefixColorMap = [
  {
    id: "mtn",
    serviceName: "mtn_vtu",
    serviceData: "mtn_data",
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
    serviceData: "airtel_data",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    prefix: ["0802", "0808", "0708", "0812", "0701", "0902", "0907", "0901"],
  },
  {
    id: "glo",
    serviceName: "glo_vtu",
    serviceData: "glo_data",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    prefix: ["0805", "0807", "0705", "0815", "0811", "0905"],
  },
  {
    id: "9mobile",
    serviceName: "9mobile_vtu",
    serviceData: "9mobile_data",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    prefix: ["0809", "0818", "0817", "0909", "0908"],
  },
];

export default function DataBundlePurchase() {
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [providers, setProviders] = useState<any[] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");

  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
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
    if (pin.length != 4) newErrors.amount = "Pin must be 4 digits";

    if (!pin) newErrors.amount = "Please enter transaction pin";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const purchaseDatabundle = async () => {
    // Step 1: Validate form
    if (!validateForm()) return;

    // Step 2: Confirm required data is present
    if (!selectedProvider?.slug || !selectedPlan) {
      Swal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please ensure you've selected a provider and a data plan.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    // Step 3: Map provider slug to service name
    const slugMap: Record<string, string> = {
      "mtn-data": "mtn_data",
      "airtel-data": "airtel_data",
      "glo-data": "glo_data",
      "9mobile-data": "9mobile_data",
    };

    const serviceName = slugMap[selectedProvider.slug];
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
      amount: selectedPlan.price,
      service: serviceName,
      customerId: phoneNumber,
      billerCode: selectedPlan.code,
      reference: `Data-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pin: pin,
    };

    // console.log("📦 Purchase payload:", payload);

    // Step 5: Make request
    try {
      setLoading(true);
      const response = await fetch("/api/buy-data-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw data;

      Swal.fire({
        icon: "success",
        title: "Data Bundle Purchase Successful",
        confirmButtonColor: "#0f172a",
      });

      // Clear inputs after successful purchase
      setPin("");
      setPhoneNumber("");
      setSelectedProvider(null);
      setSelectedPlan(null);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Databundle Purchase Failed",
        html: `<strong>${
          error.message || "Something went wrong"
        }</strong><br/><small>${error.detail || ""}</small>`,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNetworkProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/data-bundle-providers");
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
        };
      });

      setProviders(merged);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  

  const getNetworkDataBundle = async () => {
    if (!selectedProvider?.slug) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/get-data-bundles?service=${selectedProvider?.slug}`
      );
      const data = await response.json();
      console.log("📦 Bundles data:", data);
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch bundles");
      setBundles(data.data); // Enable if needed
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
      const matchedPrefixData = prefixColorMap.find((entry) =>
        entry.prefix.includes(prefix)
      );
      if (!matchedPrefixData) return;

      const matchedProvider = providers?.find(
        (provider) =>
          provider.slug === matchedPrefixData.serviceName ||
          provider.name.toLowerCase().includes(matchedPrefixData.id)
      );

      if (matchedProvider && matchedProvider?.name !== selectedProvider?.name) {
        setSelectedProvider(matchedProvider);
      }
    }
  }, [phoneNumber, providers]);

  useEffect(() => {
    if (selectedProvider) getNetworkDataBundle();
  }, [selectedProvider]);

  useEffect(() => {
    if (user) getNetworkProviders();
  }, [user]);

    const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading && !providers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col justify-center">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Buy Data Bundle
        </h1>
        <p className="text-gray-600">
          Instant data bundle top-up for all Nigerian networks
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
                {providers?.map((provider: any, index:any) => {
                  const isSelected = selectedProvider?.name === provider.name;

                  return (
                    <div
                      key={index}
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
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
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
          <div>
            <Label>Select Plan</Label>

            <DataPlanSelector
              plans={bundles || []}
              selectedPlan={selectedPlan}
              onSelect={(plan) => setSelectedPlan(plan)}
            />
            {errors.plan && (
              <p className="text-sm text-red-500">{errors.plan}</p>
            )}
          </div>

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
                    <span>₦{formatNumber(selectedPlan.price)}</span>
                  </div>
                </div>
              )}

              {/* Purchase Button */}
              <Button
                onClick={purchaseDatabundle}
                disabled={!phoneNumber || !selectedPlan}
                className="w-full bg-[#C29307] hover:bg-[#C29307] text-white py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
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
