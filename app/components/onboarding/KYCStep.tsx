"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Shield, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

interface KYCData {
  documentNumber: string;
}

interface KYCStepProps {
  data: KYCData;
  onUpdate: (data: Partial<KYCData>) => void;
  onPrev: () => void;
  onComplete: (bvn: string) => void;
  loading: boolean
}

export const KYCStep = ({ data, onUpdate, onPrev, onComplete, loading }: KYCStepProps) => {
 

  const handleInputChange = (field: keyof KYCData, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("bvn ")

    if (!/^\d{11}$/.test(data.documentNumber)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid BVN",
        text: "BVN must be 11 digits.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

 
    onComplete(data.documentNumber.trim());
  
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Let’s Secure Your Account</h2>
        <p className="text-muted-foreground">
          Please verify your BVN to unlock all features and complete your onboarding.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="documentNumber">Bank Verification Number (BVN) *</Label>
          <Input
            className="w-full border p-3 mb-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#C29307]"
            maxLength={11}
            required
            id="documentNumber"
            placeholder="Enter your 11-digit BVN"
            value={data.documentNumber}
            onChange={(e) => handleInputChange("documentNumber", e.target.value)}
          />
        </div>
      </div>

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
        We respect your privacy. Your BVN is only used for identity verification.
      </p>
    </form>
  );
};
