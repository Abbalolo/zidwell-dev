"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "./ui/input";
import { Label } from "@/app/components/ui/label";
import { CheckCircle } from "lucide-react";
import { useUserContextData } from "../context/userData";
import FileUpload from "./FileUpload";

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  companyName: string;
  businessAddress: string;
  ceoNin: string;
  addressVerification: File | null;
  idCard: File | null;
  bankStatement: File | null;
}

const FirstTimeForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    companyName: "",
    businessAddress: "",
    ceoNin: "",
    addressVerification: null,
    idCard: null,
    bankStatement: null,
  });

  const { userData } = useUserContextData();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.companyName)
      newErrors.companyName = "Company name is required.";
    if (!formData.businessAddress)
      newErrors.businessAddress = "Business address is required.";
    if (!formData.ceoNin) newErrors.ceoNin = "CEO NIN is required.";

    if (!formData.addressVerification)
      newErrors.addressVerification = "Please upload address verification.";
    if (!formData.idCard) newErrors.idCard = "Please upload ID card.";
    if (!formData.bankStatement)
      newErrors.bankStatement = "Please upload bank statement.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire({
        icon: "error",
        title: "Form Incomplete",
        text: "Please fix the highlighted errors before submitting.",
      });
      return;
    }
    setLoading(true);

    console.log("formData", formData);

    try {
      //  Build FormData for API
      const apiForm = new FormData();
      apiForm.append("userId", userData?.id);
      apiForm.append("filingType", "first-time");
      apiForm.append("firstName", formData.firstName);
      apiForm.append("middleName", formData.middleName);
      apiForm.append("lastName", formData.lastName);
      apiForm.append("companyName", formData.companyName);
      apiForm.append("businessAddress", formData.businessAddress);
      apiForm.append("nin", formData.ceoNin);

      if (formData.addressVerification)
        apiForm.append("addressProof", formData.addressVerification);
      if (formData.idCard) apiForm.append("idCard", formData.idCard);
      if (formData.bankStatement)
        apiForm.append("bankStatement", formData.bankStatement);

      // 🚀 Call API route
      const res = await fetch("/api/tax-filing/first-time", {
        method: "POST",
        body: apiForm,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setIsSubmitted(true);
      setLoading(false);

      Swal.fire({
        icon: "success",
        title: "Form Submitted Successfully!",
        text: data.message,
      });
    } catch (err: any) {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: err.message,
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="">
        <Card className="p-8 text-center shadow-form">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <p className="text-gray-600 leading-relaxed">
              Thank you for completing our taxpayers' information form. We will
              calculate your taxes and revert to you within{" "}
              <strong>3–5 working days</strong>.
            </p>
          </div>
        </Card>
      </div>
    );
  }
  return (
    <>
      <Card className="p-6 mb-8 shadow-card">
        <h3 className="text-xl font-bold text-tax-navy mb-4">
          Service Cost Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-tax-gray-dark">
            <span>Account statement audit</span>
            <span className="font-semibold">₦4,000 per page</span>
          </div>
          <div className="flex justify-between py-2 border-b border-tax-gray-dark">
            <span>First-time taxpayer fee</span>
            <span className="font-semibold">₦50,000</span>
          </div>
          <div className="flex justify-between py-2 border-b border-tax-gray-dark">
            <span>Tax filing service charge (federal)</span>
            <span className="font-semibold">₦40,000</span>
          </div>
          <div className="flex justify-between py-2 border-b border-tax-gray-dark">
            <span>VAT (federal)</span>
            <span className="font-semibold">
              7.5% of gross profit (monthly)
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-tax-gray-dark">
            <span>Company Income Tax (CIT)</span>
            <span className="font-semibold">% based on annual net profit</span>
          </div>
          <div className="flex justify-between py-2 border-b border-tax-gray-dark">
            <span>Personal Income Tax (PIT)</span>
            <span className="font-semibold">% is based on income</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Tax filing service charge (state)</span>
            <span className="font-semibold">Depends on state</span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Additional charges may apply if incomplete
            bank statements are uploaded.
          </p>
        </div>
      </Card>
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          <Card className="p-8 shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <Label>First Name *</Label>
              <Input
                className={errors.firstName ? "border-red-500" : ""}
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">{errors.firstName}</p>
              )}
            </div>

            {/* Middle Name */}
            <div>
              <Label>Middle Name</Label>
              <Input
                value={formData.middleName}
                onChange={(e) =>
                  handleInputChange("middleName", e.target.value)
                }
              />
            </div>

            {/* Last Name */}
            <div>
              <Label>Last Name *</Label>
              <Input
                className={errors.lastName ? "border-red-500" : ""}
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">{errors.lastName}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <Label>Company Name *</Label>
              <Input
                className={errors.companyName ? "border-red-500" : ""}
                value={formData.companyName}
                onChange={(e) =>
                  handleInputChange("companyName", e.target.value)
                }
              />
              {errors.companyName && (
                <p className="text-red-500 text-sm">{errors.companyName}</p>
              )}
            </div>

            {/* Business Address */}
            <div>
              <Label>Business Address *</Label>
              <Input
                className={errors.businessAddress ? "border-red-500" : ""}
                value={formData.businessAddress}
                onChange={(e) =>
                  handleInputChange("businessAddress", e.target.value)
                }
              />
              {errors.businessAddress && (
                <p className="text-red-500 text-sm">{errors.businessAddress}</p>
              )}
            </div>

            {/* CEO NIN */}
            <div>
              <Label>CEO's NIN *</Label>
              <Input
                className={errors.ceoNin ? "border-red-500" : ""}
                value={formData.ceoNin}
                onChange={(e) => handleInputChange("ceoNin", e.target.value)}
              />
              {errors.ceoNin && (
                <p className="text-red-500 text-sm">{errors.ceoNin}</p>
              )}
            </div>

            {/* File Uploads */}
            <FileUpload
              label="Upload Address Verification"
              accept=".pdf,.jpg,.png"
              onChange={(files) =>
                handleFileChange("addressVerification", files?.[0] || null)
              }
            />

            <FileUpload
              label="Upload ID Card"
              accept=".pdf,.jpg,.png"
              onChange={(files) =>
                handleFileChange("idCard", files?.[0] || null)
              }
            />

            <FileUpload
              label="Upload Bank Statement"
              accept=".pdf"
              onChange={(files) =>
                handleFileChange("bankStatement", files?.[0] || null)
              }
            />

            {/* Submit Button - full width */}
            <div className="md:col-span-2 flex md:justify-start justify-center  mt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C29307] hover:bg-[#a67c05] hover:shadow-lg transition-all duration-300 md:w-[300px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </>
  );
};

export default FirstTimeForm;
