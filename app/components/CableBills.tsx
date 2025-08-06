"use client";

import { useEffect, useState } from "react";
import { Zap, Check, AlertCircle, Building2Icon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import Image from "next/image";
import { useUserContextData } from "../context/userData";
import CableCustomerCard from "./CablesCusInfo";
import BouquePlanSelector from "./BouquetPlanSelector";
import Swal from "sweetalert2";
interface Plan {
  code: string;
  description: string;
  price: string;
}
export default function CableBills() {
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [CableProvider, setCableProviders] = useState<any | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [decorderNumber, setdecorderNumber] = useState("");
  const [bundles, setBundles] = useState<Plan[]>([]);
  const [amount, setAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUserContextData();

  // Validate amount
  const validateAmount = (amt: string) => {
    const numAmount = parseFloat(amt);

    if (!amt) {
      return "Amount is required";
    }

    if (numAmount < 100) {
      return "Minimum amount is ₦100";
    }

    if (numAmount > 50000) {
      return "Maximum amount is ₦50,000";
    }

    return "";
  };

  const handledecorderNumberChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setdecorderNumber(cleanValue);
    setIsVerified(false);

    if (errors.decorderNumber) {
      setErrors((prev) => ({ ...prev, decorderNumber: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedProvider) {
      newErrors.provider = "Please select an Cable provider";
    }

    if (!decorderNumber) {
      newErrors.decorderNumber = "Please verify your decorder number first";
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

   

    // Step 5: Build payload
    const payload = {
      service: selectedProvider.slug,
      smartCardNumber: userInfo?.smartCardNumber,
      amount: Number(selectedPlan?.price),
      packageCode: selectedPlan?.code,
      customerName: userInfo?.customerName,
      reference: `Cable-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    console.log("📦 Purchase payload:", payload);

    // Step 6: Make the request
    try {
      setLoading(true);

      const response = await fetch("/api/buy-cable-tv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw data;

      Swal.fire({
        icon: "success",
        title: "Cable Purchase Successful",
        confirmButtonColor: "#0f172a",
      });

      // Clear form
      setSelectedProvider(null);
      setSelectedPlan(null);
      setUserInfo(null);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Cable Purchase Failed",
        html: `<strong>${
          error.message || "Something went wrong"
        }</strong><br/><small>${error.detail || ""}</small>`,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCableProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cable-tv-providers");
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to fetch providers");

      console.log("Cable providers fetched:", data);

      setCableProviders(data);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const validatedecorderNumber = async () => {
    if (!selectedProvider?.slug || !decorderNumber) return;

    const payload = {
      service: selectedProvider.slug,
      smartCardNumber: decorderNumber.trim(),
    };

    try {
      setLoading(true);

      const response = await fetch("/api/validate-cable-tv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to validate decorder number");
      }
      setUserInfo(data.data);
      console.log("✅ decorder validation response:", data);
    } catch (error: any) {
      console.error("❌ decorder validation failed:", error.message);
      // Optionally show a UI alert
    } finally {
      setLoading(false);
    }
  };

  const getBouquetBundle = async () => {
    if (!selectedProvider?.slug) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/cable-tv-bouquet?service=${selectedProvider?.slug}`
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch bundles");
      setBundles(data.data); // Enable if needed
      console.log("data", data);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) getCableProviders();
  }, [user]);

  useEffect(() => {
    if (selectedProvider) getBouquetBundle();
  }, [selectedProvider]);

  useEffect(() => {
    if (decorderNumber) {
      validatedecorderNumber();
    }
  }, [decorderNumber]);

  //   useEffect(() => {
  //     if (decorderNumber && decorderType) ValidatedecorderNumber();
  //   }, [decorderNumber || decorderType]);

  // 0209227217814

  console.log("amount", selectedPlan);
  console.log("Selected Provider:", userInfo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
      
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pay Cable Bills
        </h1>
        <p className="text-muted-foreground">
          Pay your Cable bills instantly across all Cable/tv providers in
          Nigeria
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
                {CableProvider?.data.map((provider: any) => {
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

          {/* decorder Details */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>Decoder Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="decorderNumber">Decoder Number</Label>
                  <Input
                    id="decorderNumber"
                    type="text"
                    placeholder="Enter decorder number"
                    value={decorderNumber}
                    onChange={(e) => handledecorderNumberChange(e.target.value)}
                    className={
                      errors.decorderNumber ? "border-destructive" : ""
                    }
                    maxLength={13}
                  />
                  {errors.decorderNumber && (
                    <div className="flex items-center gap-2 mt-1 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.decorderNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label>Select Plan</Label>

            <BouquePlanSelector
              plans={bundles}
              selectedPlan={selectedPlan}
              onSelect={(plan) => setSelectedPlan(plan)}
            />
            {errors.plan && (
              <p className="text-sm text-red-500">{errors.plan}</p>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
         
            <CableCustomerCard
              customerName={userInfo?.customerName || ""}
              decorderNumber={userInfo?.smartCardNumber || ""}
              service={userInfo?.service || ""}
              selectedProvider={selectedProvider}
              selectedPlan={selectedPlan}
              loading={loading}
              handlePayment={handlePayment}
              errors={errors}
            />
        
        </div>
      </div>
    </div>
  );
}
