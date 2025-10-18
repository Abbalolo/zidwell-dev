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

import Image from "next/image";
import { useUserContextData } from "../context/userData";
import CableCustomerCard from "./CablesCusInfo";
import BouquePlanSelector from "./BouquetPlanSelector";
import Swal from "sweetalert2";
import Loader from "./Loader";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import PinPopOver from "./PinPopOver";
interface Plan {
  code: string;
  description: string;
  price: string;
}
export default function CableBills() {
  const inputCount = 4;
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [decorderNumber, setdecorderNumber] = useState("");
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [bundles, setBundles] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const router = useRouter();
  const { setUserData, userData } = useUserContextData();

  const cableTvProviders = [
    {
      id: "dstv",
      name: "DSTV",
      src: "/cable-img/dstv.png",
    },
    {
      id: "gotv",
      name: "GOTV",
      src: "/cable-img/gotv.png",
    },
    {
      id: "startimes",
      name: "Startimes",
      src: "/cable-img/startimes.png",
    },
    {
      id: "showmax",
      name: "Showmax",
      src: "/cable-img/showmax.png",
    },
  ];

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

    // Step 5: Build payload
    const payload = {
      userId: userData?.id,
      pin,
      customerId: decorderNumber,
      cableTvPaymentType: selectedProvider.id,
      amount: Number(selectedPlan?.amount),
      payerName: userData?.firstName,
      merchantTxRef: `Cable-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    // console.log("📦 Purchase payload:", payload);

    // Step 6: Make the request
    try {
      setLoading3(true);

      const response = await fetch("/api/buy-cable-tv", {
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
        title: "Cable Purchase Successful",
        confirmButtonColor: "#0f172a",
      }).then(() => {
        window.location.reload();
      });

      // Clear form
      setPin(Array(inputCount).fill(""));
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
      setLoading3(false);
    }
  };

  // const getCableProviders = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await fetch("/api/cable-tv-providers");
  //     const data = await response.json();

  //     if (!response.ok)
  //       throw new Error(data.error || "Failed to fetch providers");

  //     // console.log("Cable providers fetched:", data);

  //     setCableProviders(data);
  //   } catch (error: any) {
  //     console.error("Fetch error:", error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const validatedecorderNumber = async () => {
    if (!decorderNumber || !selectedProvider) return;

    const params = new URLSearchParams({
      cableTvType: selectedProvider?.id || "",
      customerId: decorderNumber.trim(),
    });

    try {
      setLoading(true);

      const response = await fetch(`/api/validate-cable-tv?${params}`, {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to validate decoder number");
      }

      setUserInfo(data);
      setIsVerified(true);

      // console.log("✅ decoder validation response:", data);
    } catch (error: any) {
      console.error("❌ decoder validation failed:", error.message);
      setIsVerified(false);
      setErrors((prev) => ({
        ...prev,
        decorderNumber: "Invalid decoder number",
      }));
    } finally {
      setLoading(false);
    }
  };

  const getBouquetBundle = async () => {
    if (!selectedProvider?.id) return;

    try {
      setLoading2(true);
      const response = await fetch(
        `/api/cable-tv-bouquet?service=${selectedProvider?.id}`
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch bundles");
      setBundles(data.data);
      // console.log("data", data);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    if (selectedProvider) getBouquetBundle();
  }, [selectedProvider]);

  useEffect(() => {
    if (!decorderNumber) return;

    // Format check first
    if (!/^[0-9]{10,14}$/.test(decorderNumber)) {
      setErrors((prev) => ({
        ...prev,
        decorderNumber: "Decoder number must be 10–14 digits",
      }));
      return;
    }

    // Clear error before validating
    setErrors((prev) => ({ ...prev, decorderNumber: "" }));

    const timeoutId = setTimeout(() => {
      validatedecorderNumber();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [decorderNumber, selectedProvider]);

  // 8057900967

  // console.log("Selected :", selectedPlan);

  return (
    <div className="space-y-6  md:max-w-5xl md:mx-auto">
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
            Pay Cable Bills
          </h1>
          <p className=" text-muted-foreground">
            Pay your Cable bills instantly across all Cable/tv providers in
            Nigeria
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cableTvProviders?.map((provider: any, index: any) => {
                  const isSelected = selectedProvider?.name === provider.name;

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedProvider(provider)}
                      className={`relative p-4 border-2 rounded-md transition-all duration-200 ${
                        isSelected
                          ? "bg-gray-100 border-[#C29307] text-gray-900 shadow-md"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      } `}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 relative">
                          <Image
                            src={provider.src}
                            alt={`${provider.name} logo`}
                            fill
                            className="rounded-lg object-contain"
                          />
                        </div>

                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
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

          {/* decorder Details */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>Decoder Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="decorderNumber">Decoder Number</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="decorderNumber"
                      type="text"
                      placeholder="Enter decorder number"
                      value={decorderNumber}
                      onChange={(e) =>
                        handledecorderNumberChange(e.target.value)
                      }
                      className={
                        errors.decorderNumber ? "border-destructive" : ""
                      }
                      maxLength={13}
                    />
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    ) : isVerified ? (
                      <div className="text-green-600" title="Verified">
                        <Check className="w-6 h-6" />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={validatedecorderNumber}
                        disabled={!decorderNumber}
                      >
                        Verify
                      </Button>
                    )}
                  </div>

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

          {isVerified && (
            <div>
              <Label>Select Plan</Label>

              <BouquePlanSelector
                plans={bundles}
                selectedPlan={selectedPlan}
                onSelect={(plan) => setSelectedPlan(plan)}
                loading={loading2}
              />
              {errors.plan && (
                <p className="text-sm text-red-500">{errors.plan}</p>
              )}
            </div>
          )}

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
          <CableCustomerCard
            customerName={userInfo?.data || ""}
            decorderNumber={userInfo?.smartCardNumber || ""}
            service={userInfo?.service || ""}
            selectedProvider={selectedProvider}
            selectedPlan={selectedPlan}
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
