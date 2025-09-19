"use client";
import React, { useState, useEffect } from "react";
import { Building, CreditCard } from "lucide-react";
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
import supabase from "@/app/supabase/supabase";

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

const banks = [
  { label: "Access Bank", value: "Access Bank" },
  { label: "Zenith Bank", value: "Zenith Bank" },
  { label: "Guaranty Trust Bank (GTBank)", value: "Guaranty Trust Bank" },
  { label: "First Bank of Nigeria", value: "First Bank of Nigeria" },
  { label: "United Bank for Africa (UBA)", value: "UBA" },
  { label: "Fidelity Bank", value: "Fidelity Bank" },
  { label: "Union Bank", value: "Union Bank" },
  { label: "Sterling Bank", value: "Sterling Bank" },
  { label: "Polaris Bank", value: "Polaris Bank" },
  { label: "Ecobank", value: "Ecobank" },
  { label: "Stanbic IBTC Bank", value: "Stanbic IBTC Bank" },
  { label: "Wema Bank", value: "Wema Bank" },
  { label: "Keystone Bank", value: "Keystone Bank" },
  { label: "Heritage Bank", value: "Heritage Bank" },
  { label: "Providus Bank", value: "Providus Bank" },
  { label: "Jaiz Bank", value: "Jaiz Bank" },
  { label: "Globus Bank", value: "Globus Bank" },
  { label: "Parallex Bank", value: "Parallex Bank" },
  { label: "Lotus Bank", value: "Lotus Bank" },
  { label: "SunTrust Bank", value: "SunTrust Bank" },
];

function EditBusinessInfo() {
  const { userData } = useUserContextData();
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    rcNumber: "",
    taxId: "",
    businessAddress: "",
    businessDescription: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch business info when component mounts
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!userData?.id) return;

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "business_name, business_category, registration_number, tax_id, business_address, business_description, bank_name, bank_account_number, bank_account_name"
        )
        .eq("user_id", userData.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        console.error("Error fetching business info:", error);
        Swal.fire("Error", "Failed to load business info.", "error");
      } else if (data) {
        setForm({
          businessName: data.business_name || "",
          businessType: data.business_category || "",
          rcNumber: data.registration_number || "",
          taxId: data.tax_id || "",
          businessAddress: data.business_address || "",
          businessDescription: data.business_description || "",
          bankName: data.bank_name || "",
          accountNumber: data.bank_account_number || "",
          accountName: data.bank_account_name || "",
        });
      }
    };

    fetchBusinessInfo();
  }, [userData]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userData?.id) return;

    setLoading(true);
    try {
      // Check if business exists
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", userData.id)
        .single();

      let error;

      if (existing) {
        // Update
        ({ error } = await supabase
          .from("businesses")
          .update({
            business_name: form.businessName,
            business_category: form.businessType,
            registration_number: form.rcNumber,
            tax_id: form.taxId,
            business_address: form.businessAddress,
            business_description: form.businessDescription,
            bank_name: form.bankName,
            bank_account_number: form.accountNumber,
            bank_account_name: form.accountName,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userData.id));
      } else {
        // Insert new business
        ({ error } = await supabase.from("businesses").insert([
          {
            user_id: userData.id,
            business_name: form.businessName,
            business_category: form.businessType,
            registration_number: form.rcNumber,
            tax_id: form.taxId,
            business_address: form.businessAddress,
            business_description: form.businessDescription,
            bank_name: form.bankName,
            bank_account_number: form.accountNumber,
            bank_account_name: form.accountName,
          },
        ]));
      }

      if (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Could not save business info.",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Saved",
          text: "Business info saved successfully",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

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
              <Label htmlFor="rcNumber">RC Number</Label>
              <Input
                id="rcNumber"
                value={form.rcNumber}
                maxLength={8}
                onChange={(e) => handleChange("rcNumber", e.target.value)}
                placeholder="Enter RC number"
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bank Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Select
                value={form.bankName}
                onValueChange={(value) => handleChange("bankName", value)}
              >
                <SelectTrigger id="BankName">
                  <SelectValue placeholder="Select a bank name" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={form.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value)}
                placeholder="Enter account number"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={form.accountName}
              onChange={(e) => handleChange("accountName", e.target.value)}
              placeholder="Enter account name"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Button className="bg-[#C29307] hover:opacity-100 transition-smooth" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Business Info"}
        </Button>
      </div>
    </>
  );
}

export default EditBusinessInfo;
