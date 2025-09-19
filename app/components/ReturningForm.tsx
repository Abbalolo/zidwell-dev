"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { CheckCircle, Upload, Mail, Phone } from "lucide-react";
import { useUserContextData } from "../context/userData";

const ReturningForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bankStatement, setBankStatement] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const {userData} = useUserContextData()
  const handleFileChange = (file: File | null) => {
    setBankStatement(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    if (!bankStatement) {
      Swal.fire({
        icon: "error",
        title: "Missing Document",
        text: "Please upload your bank statement.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("userId", userData?.id);
      formData.append("bankStatement", bankStatement);

      const res = await fetch("/api/tax-filing/returning", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload bank statement");
      }

      setIsSubmitted(true);
      setLoading(false);
      Swal.fire({
        icon: "success",
        title: "Form Submitted Successfully!",
        text: "We'll review your bank statement and get back to you within 3-5 working days.",
      });
    } catch (error) {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text:
          (error as Error).message || "Something went wrong. Please try again.",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="">
        <Card className="p-8 text-center shadow-form">
          <CheckCircle className="w-16 h-16 text-tax-green mx-auto mb-6 text-green-600" />
          <h2 className="text-3xl font-bold text-tax-navy mb-4">Thank You!</h2>
          <div className="bg-tax-gray p-6 rounded-lg mb-6">
            <p className="text-muted-foreground leading-relaxed">
              Thank you for completing our taxpayers' information form. We will
              calculate your taxes and revert to you within{" "}
              <strong>3–5 working days</strong> with an invoice containing how
              much tax you owe and our service charge. Once you pay the invoice,
              we will file your taxes and send you an official tax receipt.
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-tax-navy mb-4">
              Contact Information
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>support@taxpro.com</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>+234 123 456 7890</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-tax-navy mb-4">
          Returning Tax Filing
        </h2>
        <p className="text-muted-foreground">
          Welcome back! Simply upload your current bank statement to continue
          with your tax filing.
        </p>
      </div>


      {/* Upload Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-8 shadow-card">
          <h3 className="text-xl font-bold text-tax-navy mb-6">
            Bank Statement Upload
          </h3>

          <div className="mb-8">
            <Label htmlFor="bankStatement">Bank Statement *</Label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                id="bankStatement"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("bankStatement")?.click()
                }
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </Button>
              {bankStatement && (
                <span className="text-sm text-tax-green">
                  ✓ {bankStatement.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Accepted formats: PDF, JPG, JPEG, PNG (Max size: 10MB)
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#C29307] hover:bg-[#C29307] hover:shadow-xl transition-all duration-300"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Submit Bank Statement"
            )}
          </Button>
        </Card>
      </form>
    </div>
  );
};

export default ReturningForm;
