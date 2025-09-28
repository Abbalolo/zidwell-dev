"use client";
import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Baby } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useUserContextData } from "@/app/context/userData";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Swal from "sweetalert2";

function EditProfileInfo() {
  const supabase = createClientComponentClient();
  const { userData } = useUserContextData();

  const initialProfile: any = {
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    email: userData?.email || "",
    phone: userData?.phone || "",
    dob: userData?.dateOfBirth || "",
    address: userData?.address || "",
    city: userData?.city || "",
    state: userData?.state || "",
    country: userData?.country || "",
  };

  const [profile, setProfile] = useState<any>(initialProfile);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<any>({});

  const handleProfileChange = (field: keyof typeof profile, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (userData) {
      setProfile({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        dob: userData.dob,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        country: userData.country,
      });
    }
  }, [userData]);

  const handleSave = async () => {
  const newErrors: Partial<any> = {};
  setErrors({});
  setLoading(true);

  if (!profile.dob) {
    newErrors.dob = "Date of birth is required";
  } else if (calculateAge(profile.dob) < 18) {
    newErrors.dob = "You must be at least 18 years old";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setLoading(false);
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Please fix the highlighted fields before saving.",
    });
    return;
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        date_of_birth: profile.dob,
        address: profile.address,
        city: profile.city,
        state: profile.state,
      })
      .eq("id", userData?.id);

    if (error) {
      console.error("Update error:", error.message);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update profile. Try again.",
      });
    } else {
     
      const updatedUserData = {
        ...userData,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        dob: profile.dob,
        address: profile.address,
        city: profile.city,
        state: profile.state
      };

      localStorage.setItem("userData", JSON.stringify(updatedUserData));

      Swal.fire({
        icon: "success",
        title: "Profile Updated",
        text: "Your profile was updated successfully ✅",
        timer: 2000,
        showConfirmButton: false,
      });

      setIsEditing(false);
    }
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
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
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
              onChange={(e) => handleProfileChange("firstName", e.target.value)}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e) => handleProfileChange("lastName", e.target.value)}
              disabled
            />
          </div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                disabled
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Address + DOB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => handleProfileChange("address", e.target.value)}
                placeholder="Enter your address"
                className="pl-10"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <div className="relative">
              <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="dob"
                type="date"
                value={profile.dob}
                onChange={(e) => handleProfileChange("dob", e.target.value)}
                className="pl-10"
                disabled={!isEditing}
              />
            </div>
            {errors.dob && (
              <p className="text-sm text-red-500">{errors.dob}</p>
            )}
          </div>
        </div>

        {/* City + State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={profile.city}
              onChange={(e) => handleProfileChange("city", e.target.value)}
              placeholder="Enter your city"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={profile.state}
              onChange={(e) => handleProfileChange("state", e.target.value)}
              placeholder="Enter your state"
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Save Buttons */}
        {isEditing && (
          <div className="flex gap-3">
            <Button
              disabled={loading}
              className="bg-[#C29307] hover:opacity-100 transition-smooth"
              onClick={handleSave}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EditProfileInfo;
