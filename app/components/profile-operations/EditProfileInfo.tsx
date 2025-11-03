"use client";
import React, { useEffect, useRef, useState } from "react";
import { User, Mail, Phone, CreditCard } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Loader from "../Loader";
import FileUpload from "../FileUpload";

type Bank = { code: string; name: string };

export default function EditProfileInfo() {
  const { userData, setUserData } = useUserContextData();

  const initialProfile = {
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    email: userData?.email || "",
    phone: userData?.phone || "",
    dob: userData?.dateOfBirth || "",
    address: userData?.address || "",
    city: userData?.city || "",
    state: userData?.state || "",
    country: userData?.country || "",
    nin: userData?.nin || "",
    idCardFile: null,
    utilityBillFile: null,
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  };

  const [profile, setProfile] = useState<any>(initialProfile);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<any>({});
  const [details, setDetails] = useState<any>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState<boolean>(false);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // Unified setter for profile fields
  const handleProfileChange = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch banks
  useEffect(() => {
    const fetchBanks = async () => {
      setBanksLoading(true);
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        setBanks(data?.data || []);
      } catch (err) {
        console.error("Error fetching banks:", err);
      } finally {
        setBanksLoading(false);
      }
    };
    fetchBanks();
  }, []);

  // Fetch wallet / bank account details
  useEffect(() => {
    if (!userData?.id) return;
    const fetchAccountDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await fetch("/api/get-wallet-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });
        const data = await res.json();
        setDetails(data || null);

        // populate bank fields if available
        if (data) {
          setProfile((prev: any) => ({
            ...prev,
            bankName: data.payment_details.p_bank_name || prev.bankName,
            bankCode: data.payment_details.p_bank_code || prev.bankCode,
            accountNumber: data.payment_details.p_account_number || prev.accountNumber,
            accountName: data.payment_details.p_account_name || prev.accountName,
          }));
        }
      } catch (err) {
        console.error("Error fetching account details:", err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchAccountDetails();
  }, [userData?.id]);

  // Keep profile in sync when userData updates
  useEffect(() => {
    if (userData) {
      setProfile((prev: any) => ({
        ...prev,
        firstName: userData.firstName || prev.firstName,
        lastName: userData.lastName || prev.lastName,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone,
        dob: userData.dateOfBirth || prev.dob,
        address: userData.address || prev.address,
        city: userData.city || prev.city,
        state: userData.state || prev.state,
        country: userData.country || prev.country,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleSave = async () => {
    const newErrors: any = {};
    setErrors({});

    if (!profile.dob) {
      newErrors.dob = "Date of birth is required";
    } else if (calculateAge(profile.dob) < 18) {
      newErrors.dob = "You must be at least 18 years old";
    }

    if (profile.accountNumber && profile.accountNumber.length !== 10) {
      newErrors.accountNumber = "Account number must be 10 digits";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fix the highlighted fields before saving.",
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ 1. First save profile info
      const response = await fetch("/api/profile/update-profile-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          dob: profile.dob,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          pBankName: profile.bankName || details?.data?.payment_details.p_bank_name,
          pBankCode: profile.bankCode || details?.data?.payment_details.p_bank_code,
          pAccountNumber: profile.accountNumber || details?.data?.payment_details.p_account_number,
          pAccountName: profile.accountName || details?.data?.payment_details.p_account_name,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to update profile");

      // ✅ 2. Upload KYC files if present
      if (profile.nin || profile.idCardFile || profile.utilityBillFile) {
        const formData = new FormData();
        formData.append("userId", userData?.id || "");

        if (profile.nin) formData.append("nin", profile.nin);
        if (profile.idCardFile) formData.append("idCard", profile.idCardFile);
        if (profile.utilityBillFile)
          formData.append("utilityBill", profile.utilityBillFile);

        const uploadRes = await fetch("/api/profile/upload-kyc", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok)
          throw new Error(uploadResult.error || "KYC upload failed");
      }

      // ✅ 3. Save local state
      const updatedUserData = {
        ...userData,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        dateOfBirth: profile.dob,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        kycStatus: "pending",
      };

      setUserData?.(updatedUserData);
      if (typeof window !== "undefined") {
        localStorage.setItem("userData", JSON.stringify(updatedUserData));
      }

      Swal.fire({
        icon: "success",
        title: "Profile Updated",
        text: "Your profile and KYC were submitted successfully ✅",
        timer: 1800,
        showConfirmButton: false,
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="w-5 h-5" />
          Personal Information
        </CardTitle>
        <Button variant="outline" onClick={() => setIsEditing((p) => !p)}>
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* First + Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={profile.firstName}
              disabled
              onChange={(e) => handleProfileChange("firstName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={profile.lastName}
              disabled
              onChange={(e) => handleProfileChange("lastName", e.target.value)}
            />
          </div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                disabled
                id="email"
                className="pl-10"
                value={profile.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                id="phone"
                className="pl-10"
                value={profile.phone}
                disabled={!isEditing}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Address + DOB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Address</Label>
            <Input
              disabled={!isEditing}
              value={profile.address}
              placeholder="10, Lagos street"
              onChange={(e) => handleProfileChange("address", e.target.value)}
            />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input
              type="date"
              disabled={!isEditing}
              value={profile.dob}
              onChange={(e) => handleProfileChange("dob", e.target.value)}
            />
            {errors.dob && <p className="text-sm text-red-500">{errors.dob}</p>}
          </div>
        </div>

        {/* City + State + country*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            disabled={!isEditing}
            value={profile.city}
            onChange={(e) => handleProfileChange("city", e.target.value)}
            placeholder="City"
          />
          <Input
            disabled={!isEditing}
            value={profile.state}
            onChange={(e) => handleProfileChange("state", e.target.value)}
            placeholder="State"
          />
          <Input
            disabled={!isEditing}
            value={profile.country}
            onChange={(e) => handleProfileChange("country", e.target.value)}
            placeholder="Country"
          />
        </div>

        {/* ✅ KYC Section */}
        <div
          className={`mt-6 p-4 rounded-md border ${
            !isEditing ? "pointer-events-none opacity-50 bg-gray-100" : ""
          }`}
        >
          <h3 className="text-lg font-semibold mb-2">KYC Verification</h3>

          {/* NIN Number */}
          <div className="mb-4">
            <Label htmlFor="nin">NIN Number</Label>
            <Input
              id="nin"
              name="nin"
              value={profile.nin || ""}
              maxLength={11}
              placeholder="Enter your 11-digit NIN"
              onChange={(e) => handleProfileChange("nin", e.target.value)}
            />
          </div>

          {/* ID Card Upload */}
          <div className="mb-4">
            <FileUpload
              label="Upload ID Card (National ID, Voter's Card, Driver's License, Passport)"
              accept="image/*,application/pdf"
              onChange={(files) => {
                const file = files?.[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  alert("Max file size is 5MB");
                  return;
                }
                handleProfileChange("idCardFile", file || null);
              }}
            />
          </div>

          {/* Utility Bill Upload */}
          <div className="mb-4">
            <FileUpload
              label="Upload Utility Bill (NEPA Bill, Water Bill, or Bank Statement)"
              accept="image/*,application/pdf"
              onChange={(files) => {
                const file = files?.[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  alert("Max file size is 5MB");
                  return;
                }
                handleProfileChange("utilityBillFile", file || null);
              }}
            />
          </div>
        </div>

        {/* Bank Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Bank Account Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {banksLoading || detailsLoading ? (
              <div className="flex justify-center items-center">
                <Loader />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>

                    <Select
                      value={profile.bankCode || ""}
                      onValueChange={(value) => {
                        const bank = banks.find((b) => b.code === value);
                        handleProfileChange("bankCode", bank?.code || "");
                        handleProfileChange("bankName", bank?.name || "");
                      }}
                    >
                      <SelectTrigger id="bankName" disabled={!isEditing}>
                        <SelectValue placeholder="Select a bank name" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-green-600">
                      {profile.bankName || details?.p_bank_name}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      disabled={!isEditing}
                      value={profile.accountNumber}
                      onChange={(e) =>
                        handleProfileChange("accountNumber", e.target.value)
                      }
                      placeholder="Enter account number"
                    />
                    {errors.accountNumber && (
                      <p className="text-sm text-red-500">
                        {errors.accountNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    disabled={!isEditing}
                    value={profile.accountName}
                    onChange={(e) =>
                      handleProfileChange("accountName", e.target.value)
                    }
                    placeholder="Enter account name"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {isEditing && (
          <Button
            disabled={loading}
            className="bg-[#C29307] hover:opacity-100 transition-smooth"
            onClick={handleSave}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
