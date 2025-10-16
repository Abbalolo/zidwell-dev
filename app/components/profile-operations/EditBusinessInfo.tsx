"use client";

import React, { useState, useEffect } from "react";
import { Building } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import Loader from "../Loader";
import FileUpload from "../FileUpload";

interface BusinessForm {
  businessName: string;
  businessType: string;
  rcNumber: string;
  taxId: string;
  businessAddress: string;
  businessDescription: string;
  // bankName: string;
  // bankCode: string;
  // accountNumber: string;
  // accountName: string;
}

const businessCategories = [
  { label: "Fintech", value: "Fintech" },
  { label: "E-commerce", value: "E-commerce" },
  { label: "Technology", value: "Technology" },
  { label: "Consulting", value: "Consulting" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Education", value: "Education" },
  { label: "Real Estate", value: "Real Estate" },
  { label: "Transportation", value: "Transportation" },
  { label: "Agriculture", value: "Agriculture" },
  { label: "Manufacturing", value: "Manufacturing" },
  { label: "Media & Entertainment", value: "Media & Entertainment" },
  { label: "Hospitality", value: "Hospitality" },
  { label: "Retail", value: "Retail" },
  { label: "Construction", value: "Construction" },
  { label: "Telecommunications", value: "Telecommunications" },
  { label: "Legal Services", value: "Legal Services" },
  { label: "Non-profit", value: "Non-profit" },
  { label: "Logistics", value: "Logistics" },
  { label: "Beauty & Wellness", value: "Beauty & Wellness" },
  { label: "Energy & Utilities", value: "Energy & Utilities" },
  { label: "Finance", value: "Finance" },
  { label: "Food & Beverage", value: "Food & Beverage" },
  { label: "Automotive", value: "Automotive" },
  { label: "Insurance", value: "Insurance" },
  { label: "Gaming", value: "Gaming" },
  { label: "Cybersecurity", value: "Cybersecurity" },
  { label: "Other", value: "Other" },
];

const EditBusinessInfo: React.FC = () => {
  const { userData } = useUserContextData();
  const [cacFile, setCacFile] = useState<File | null>(null);

  const [form, setForm] = useState<BusinessForm>({
    businessName: "",
    businessType: "",
    rcNumber: "",
    taxId: "",
    businessAddress: "",
    businessDescription: "",
    // bankName: "",
    // bankCode: "",
    // accountNumber: "",
    // accountName: "",
  });
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  // Fetch business info on mount
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      setLoading(true);
      if (!userData?.id) return;

      try {
        const res = await fetch("/api/get-business-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });

        const result = await res.json();

        if (!res.ok) {
          console.error("Error fetching business info:", result.error);
          Swal.fire("Error", "Failed to load business info.", "error");
          return;
        }

        if (result.data) {
          const data = result.data;
          setForm({
            businessName: data.business_name || "",
            businessType: data.business_category || "",
            rcNumber: data.registration_number || "",
            taxId: data.tax_id || "",
            businessAddress: data.business_address || "",
            businessDescription: data.business_description || "",
            // bankName: data.bank_name || "",
            // bankCode: data.bank_code || "",
            // accountNumber: data.bank_account_number || "",
            // accountName: data.bank_account_name || "",
          });
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        Swal.fire(
          "Error",
          "Something went wrong while fetching business info.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessInfo();
  }, [userData?.id]);

  const handleChange = (field: keyof BusinessForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userData?.id) return;
    setLoading2(true);

    try {
      // 1️⃣ Upload CAC if file exists
      let cacUrl = null;
      if (cacFile) {
        const formData = new FormData();
        formData.append("userId", userData.id);
        formData.append("cacFile", cacFile);

        const uploadRes = await fetch("/api/profile/upload-cac", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "CAC upload failed");
        }

        cacUrl = uploadData.cacUrl;
      }

      // 2️⃣ Save business info
      const response = await fetch("/api/profile/update-business-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          businessName: form.businessName,
          businessType: form.businessType,
          rcNumber: form.rcNumber,
          taxId: form.taxId,
          businessAddress: form.businessAddress,
          businessDescription: form.businessDescription,
          // bankName: form.bankName,
          // bankCode: form.bankCode,
          // accountNumber: form.accountNumber,
          // accountName: form.accountName,
          cacUrl, // optional: store CAC URL in database
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Business info updated successfully ✅",
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Could not save business info. Please try again.",
      });
    } finally {
      setLoading2(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="Enter business name"
              />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={form.businessType}
                onValueChange={(value) => handleChange("businessType", value)}
              >
                <SelectTrigger id="businessType">
                  <SelectValue placeholder="Select a business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rcNumber">
                RC Number (the number on your CAC document)
              </Label>
              <Input
                id="rcNumber"
                value={form.rcNumber}
                maxLength={8}
                onChange={(e) => handleChange("rcNumber", e.target.value)}
                placeholder="Enter RC number"
              />
            </div>

            <div className="mb-4">
              <Label>CAC Document Upload (PDF or Image)</Label>
              <FileUpload
                label="Upload CAC Certificate"
                accept="application/pdf,image/*"
                onChange={(files) => {
                  const file = files?.[0];
                  if (file && file.size > 5 * 1024 * 1024) {
                    alert("Max file size is 5MB");
                    return;
                  }
                  setCacFile(file || null);
                }}
              />
            </div>

            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={form.taxId}
                maxLength={14}
                onChange={(e) => handleChange("taxId", e.target.value)}
                placeholder="Enter Tax ID"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessAddress">Business Address</Label>
            <textarea
              id="businessAddress"
              className="w-full p-3 border rounded-md h-20"
              value={form.businessAddress}
              onChange={(e) => handleChange("businessAddress", e.target.value)}
              placeholder="Enter your business address"
            />
          </div>

          <div>
            <Label htmlFor="businessDescription">Business Description</Label>
            <textarea
              id="businessDescription"
              className="w-full p-3 border rounded-md h-24"
              value={form.businessDescription}
              onChange={(e) =>
                handleChange("businessDescription", e.target.value)
              }
              placeholder="Describe your business..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Button
          className="bg-[#C29307] hover:opacity-100 transition-smooth"
          onClick={handleSave}
          disabled={loading}
        >
          {loading2 ? "Saving..." : "Save Business Info"}
        </Button>
      </div>
    </>
  );
};

export default EditBusinessInfo;
