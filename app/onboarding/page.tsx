"use client"
import { useState } from "react";

import { CheckCircle } from "lucide-react";


import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import { useUserContextData } from "@/app/context/userData";
import { ProfileStep } from "../components/onboarding/ProfileStep";
import { BusinessStep } from "../components/onboarding/BusinessStep";
import { KYCStep } from "../components/onboarding/KYCStep";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

interface OnboardingData {
  profile: {
    // firstName: string;
    // lastName: string;
    // email: string;
    // phone: string;
    dateOfBirth: string;
  };
  business: {
    businessName: string;
    role: string;
    businessAddress: string;
    businessCategory: string;
    businessDescription: string;
    taxId: string;
    registrationNumber: string;
  };
  kyc: {
    documentNumber: string;
  };
}

const steps = [
  { id: 1, title: "Profile", description: "Personal information" },
  { id: 2, title: "Business", description: "Company details (optional)" },
  { id: 3, title: "Verification", description: "Identity verification" },
];


 export default function page () {
  const [currentStep, setCurrentStep] = useState(1);
const {userData} = useUserContextData()
 const [loading, setLoading] = useState(false);
console.log(userData)
  const [data, setData] = useState<OnboardingData>({
    profile: {
      //   firstName: "",
      //   lastName: "",
      //   email: "",
      //   phone:"",
      dateOfBirth: "",
    },
    business: {
      businessName: "",
      role: "",
      businessAddress: "",
      businessCategory: "",
      businessDescription: "",
      taxId: "",
      registrationNumber: "",
    },
    kyc: {
      documentNumber: "",
    },
  });

  const handleVerify = async (bvn: string) => {
  setLoading(true);
  try {
    // Step 1️⃣ Verify BVN
    const verifyRes = await fetch("/api/verify-bvn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authId: userData?.id,
        bvn,
      }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: verifyData.error || "Invalid BVN, please try again.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    // Step 2️⃣ Save user to DB
    const newData = {
      userId: userData?.id,
      dateOfBirth: data.profile.dateOfBirth,
      businessName: data.business.businessName,
      role: data.business.role,
      businessAddress: data.business.businessAddress,
      businessCategory: data.business.businessCategory,
      businessDescription: data.business.businessDescription,
      taxId: data.business.taxId,
      registrationNumber: data.business.registrationNumber,
    };

    const saveRes = await fetch("/api/save-user-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });

    const saveData = await saveRes.json();

    if (!saveRes.ok) {
      throw new Error(saveData.error || "Failed to save user data");
    }

    // Step  Store latest user in localStorage
    const user = saveData.user || saveData;
    if (user?.id && typeof window !== "undefined") {
      const userInfo = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        dob: user.date_of_birth,
        walletBalance: user.wallet_balance,
        zidcoinBalance: user.zidcoin_balance,
        bvnVerification: user.bvn_verification,
        referralCode: user.referral_code,
      };

      localStorage.setItem("userData", JSON.stringify(userInfo));

      // Set verified cookie
      document.cookie = `verified=true; path=/; max-age=${60 * 60 * 24 * 7};`;
    }

    setLoading(false);

    Swal.fire({
      icon: "success",
      title: "Onboarding Complete 🎉",
      text: "Your Information has been successfully verified.",
      confirmButtonColor: "#C29307",
    }).then(() => {
   
      window.location.href = "/dashboard";
    });
  } catch (error: unknown) {
    setLoading(false);
    console.error("❌ Verification flow error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "Something went wrong. Please try again.",
      confirmButtonColor: "#C29307",
    });
  }
};


  const updateData = (section: keyof OnboardingData, newData: any) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...newData },
    }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const skipStep = () => currentStep === 2 && setCurrentStep(3);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProfileStep
            data={data.profile}
            onUpdate={(newData) => updateData("profile", newData)}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <BusinessStep
            data={data.business}
            onUpdate={(newData) => updateData("business", newData)}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipStep}
          />
        );
      case 3:
        return (
          <KYCStep
            data={data.kyc}
            onUpdate={(newData) => updateData("kyc", newData)}
            onPrev={prevStep}
            onComplete={handleVerify}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex justify-center items-start bg-gradient-to-br from-yellow-50 via-white to-yellow-100 z-50 min-h-screen overflow-y-auto py-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="w-full max-w-5xl p-4 md:p-8">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome aboard!
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Let's get you set up in just a few steps
            </p>
          </div>

          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Steps */}
          
            <Card className="p-6 w-full md:w-1/3 shadow-elegant">
              <div className="flex flex-col relative">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="flex items-start space-x-3 relative"
                  >
                    {/* Step Circle + Connector */}
                    <div className="flex flex-col items-center">
                      {/* Circle */}
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor:
                            currentStep > step.id
                              ? "#22c55e" // green-500
                              : currentStep === step.id
                              ? "#C29307"
                              : "#d1d5db", // gray-300
                          color:
                            currentStep > step.id || currentStep === step.id
                              ? "#fff"
                              : "#374151", // gray-600
                          scale: currentStep === step.id ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10"
                      >
                        {currentStep > step.id ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </motion.div>

                      {/* Connector Line */}
                      {idx < steps.length - 1 && (
                        <motion.div
                          initial={{ height: 0, backgroundColor: "#d1d5db" }}
                          animate={{
                            height: currentStep > step.id ? 64 : 64, // h-16 → 64px
                            backgroundColor:
                              currentStep > step.id ? "#22c55e" : "#d1d5db",
                          }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="w-[2px]"
                        />
                      )}
                    </div>

                    {/* Step Text */}
                    <div className="ml-2">
                      <p className="font-medium">{step.title}</p>
                      <p className="text-xs text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar for mobile only */}
              <div className="mt-6 block md:hidden">
                <Progress value={progress} className="h-2" />
              </div>
            </Card>
            {/* Step Content */}
            <Card className="flex-1 p-4 md:p-8 shadow-elegant">
              {renderStep()}
            </Card>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            We respect your privacy. Your BVN is only used for identity
            verification.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};


