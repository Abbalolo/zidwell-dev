"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

interface KYCData {
  documentNumber: string;
  transactionPin: string;
}

interface KYCStepProps {
  data: KYCData;
  onUpdate: (data: Partial<KYCData>) => void;
  onPrev: () => void;
  onComplete: (bvn: string) => void;
  loading: boolean;
}

export const KYCStep = ({
  data,
  onUpdate,
  onPrev,
  onComplete,
  loading,
}: KYCStepProps) => {
  const handleInputChange = (field: keyof KYCData, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ BVN validation (must be 11 digits)
    if (!/^\d{11}$/.test(data.documentNumber)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid BVN",
        text: "Your BVN must be exactly 11 digits.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    // ✅ PIN validation (must be 4 digits)
    if (!/^\d{4}$/.test(data.transactionPin)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Transaction PIN",
        text: "Transaction PIN must be exactly 4 digits.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    onComplete(data.documentNumber.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-2xl font-semibold mb-2">
          Let’s Secure Your Account
        </h2>
        <p className="text-muted-foreground">
          Please verify your BVN and set a secure 4-digit PIN to unlock all
          features and complete your onboarding.
        </p>
      </div>

      {/* BVN Field */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="documentNumber">Bank Verification Number (BVN) *</Label>
          <Input
            id="documentNumber"
            inputMode="numeric"
            pattern="\d*"
            maxLength={11}
            required
            placeholder="Enter your 11-digit BVN"
            className="w-full border p-3 mb-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#C29307]"
            value={data.documentNumber}
            onChange={(e) => handleInputChange("documentNumber", e.target.value)}
          />
        </div>

        {/* PIN Field */}
        <div className="border-t pt-4 space-y-2">
          <Label htmlFor="transactionPin">Transaction PIN *</Label>
          <Input
            id="transactionPin"
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={4}
            placeholder="Enter 4-digit PIN"
            className="w-full border p-3 mb-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#C29307]"
            value={data.transactionPin}
            onChange={(e) => handleInputChange("transactionPin", e.target.value)}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          type="button"
          onClick={onPrev}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="bg-[#C29307] text-white py-3 rounded-lg hover:bg-[#a67905] transition font-semibold"
        >
          {loading ? "Processing..." : "Verify BVN"}
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        🔐 Your BVN and PIN are encrypted and securely stored. We never share your data with third parties.
      </p>
    </form>
  );
};
