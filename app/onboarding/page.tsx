"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import { useUserContextData } from "@/app/context/userData";

import { ProfileStep } from "../components/onboarding/ProfileStep";
import { BusinessStep } from "../components/onboarding/BusinessStep";
import { KYCStep } from "../components/onboarding/KYCStep";
import { AccountDetailsStep } from "../components/onboarding/AccountDetails";

import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

interface OnboardingData {
  profile: {
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
  accountDetails: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  kyc: {
    documentNumber: string;
    transactionPin: string;
  };
}

const steps = [
  { id: 1, title: "Profile", description: "Personal information" },
  { id: 2, title: "Business", description: "Company details (optional)" },
  { id: 3, title: "Account", description: "Account Withdrawal Details" },
  { id: 4, title: "Verification", description: "Identity verification" },
];

export default function Page() {
  const [currentStep, setCurrentStep] = useState(1);
  const { userData } = useUserContextData();
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    profile: { dateOfBirth: "" },
    business: {
      businessName: "",
      role: "",
      businessAddress: "",
      businessCategory: "",
      businessDescription: "",
      taxId: "",
      registrationNumber: "",
    },
    accountDetails: {
      bankName: "",
      bankCode: "",
      accountNumber: "",
      accountName: "",
    },
    kyc: {
      documentNumber: "",
      transactionPin: "",
    },
  });

  const handleVerify = async (bvn: string) => {
    setLoading(true);
    try {
      // 1️⃣ Verify BVN
      const verifyRes = await fetch("/api/verify-bvn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authId: userData?.id, bvn }),
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

      // 2️⃣ Save user data
      const payload = {
        bvn,
        userId: userData?.id,
        dateOfBirth: data.profile.dateOfBirth,
        transactionPin: data.kyc.transactionPin,
        businessName: data.business.businessName,
        role: data.business.role,
        businessAddress: data.business.businessAddress,
        businessCategory: data.business.businessCategory,
        businessDescription: data.business.businessDescription,
        taxId: data.business.taxId,
        registrationNumber: data.business.registrationNumber,
        bankName: data.accountDetails.bankName,
        bankCode: data.accountDetails.bankCode,
        bankAccountNumber: data.accountDetails.accountNumber,
        bankAccountName: data.accountDetails.accountName,
      };

      const saveRes = await fetch("/api/save-user-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok)
        throw new Error(saveData.error || "Failed to save user data");

      // ✅ Store user locally
      const user = saveData.user || saveData;
      if (user?.id && typeof window !== "undefined") {
        const userInfo = {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          dob: user.date_of_birth,
          // walletBalance: user.wallet_balance,
          zidcoinBalance: user.zidcoin_balance,
          bvnVerification: user.bvn_verification,
          referralCode: user.referral_code,
        };

        localStorage.setItem("userData", JSON.stringify(userInfo));
        document.cookie = `verified=true; path=/; max-age=${60 * 60 * 24 * 7};`;
      }

      Swal.fire({
        icon: "success",
        title: "Onboarding Complete 🎉",
        text: "Your information has been successfully verified.",
        confirmButtonColor: "#C29307",
      }).then(() => {
        window.location.href = "/dashboard";
      });
    } catch (error) {
      console.error("❌ Verification flow error:", error);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "#C29307",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateData = (section: keyof OnboardingData, newData: any) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...newData },
    }));
  };

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const skipStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));

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
          <AccountDetailsStep
            data={data.accountDetails}
            onUpdate={(newData) => updateData("accountDetails", newData)}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipStep}
            userData={userData}
          />
        );
      case 4:
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

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Steps */}
            <Card className="p-6 w-full md:w-1/3 shadow-elegant">
              <div className="flex flex-col relative">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="flex items-start space-x-3 relative"
                  >
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor:
                            currentStep > step.id
                              ? "#22c55e"
                              : currentStep === step.id
                              ? "#C29307"
                              : "#d1d5db",
                          color: currentStep >= step.id ? "#fff" : "#374151",
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

                      {idx < steps.length - 1 && (
                        <motion.div
                          initial={{ height: 0, backgroundColor: "#d1d5db" }}
                          animate={{
                            height: 64,
                            backgroundColor:
                              currentStep > step.id ? "#22c55e" : "#d1d5db",
                          }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="w-[2px]"
                        />
                      )}
                    </div>

                    <div className="ml-2">
                      <p className="font-medium">{step.title}</p>
                      <p className="text-xs text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

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
}
