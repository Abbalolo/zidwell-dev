"use client";
import Swal from "sweetalert2";
import { FormEvent, useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Camera,
  Key,
  Shield,
  Bell,
  CreditCard,
  Activity,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { useUserContextData } from "../context/userData";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseAuth";

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

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  loginAlerts: boolean;
}

const initialProfile: any = {
  firstName: "Chukwuebuka",
  lastName: "Okafor",
  email: "chukwuebuka@zidwell.com",
  phone: "+234 803 123 4567",
  businessName: "Zidwell Technologies Ltd",
  businessType: "Fintech",
  address: "123 Victoria Island",
  city: "Lagos",
  state: "Lagos State",
  country: "Nigeria",
};

const initialSecurity: SecuritySettings = {
  twoFactorEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
  loginAlerts: true,
};

const activityLog = [
  {
    action: "Login",
    location: "Lagos, Nigeria",
    time: "2 hours ago",
    status: "Success",
  },
  {
    action: "Password Changed",
    location: "Lagos, Nigeria",
    time: "1 day ago",
    status: "Success",
  },
  {
    action: "Profile Updated",
    location: "Lagos, Nigeria",
    time: "3 days ago",
    status: "Success",
  },
  {
    action: "Login Attempt",
    location: "Abuja, Nigeria",
    time: "1 week ago",
    status: "Failed",
  },
  {
    action: "API Key Generated",
    location: "Lagos, Nigeria",
    time: "2 weeks ago",
    status: "Success",
  },
];

export default function ProfileSettings() {
  const [profile, setProfile] = useState<any>(initialProfile);
  const [security, setSecurity] = useState<SecuritySettings>(initialSecurity);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { userData, user } = useUserContextData();
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

  const handleProfileChange = (field: keyof any, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (
    field: keyof SecuritySettings,
    value: boolean
  ) => {
    setSecurity((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Fetch user data from context or local storage if needed
    if (userData) {
      setProfile({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        // businessName: userData.businessName || "",
        // businessType: userData.businessType || "",
        address: userData.fullAddress || "",
        // city: userData.city || "",
        // state: userData.state || "",
        // country: userData.country || "",
      });
    }
  }, [userData]);


 const changeUserPassword = async () => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return Swal.fire({
      icon: "warning",
      title: "Please fill in all password fields",
    });
  }

  if (newPassword !== confirmPassword) {
    return Swal.fire({
      icon: "error",
      title: "New password and confirmation do not match",
    });
  }

  if (user) {
    try {
      if (user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        // Reset fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        Swal.fire({
          icon: "success",
          title: "Password updated successfully",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "User email is not available",
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      Swal.fire({
        icon: "error",
        title: "Error updating password",
        text: (error as Error).message,
      });
    }
  } else {
    Swal.fire({
      icon: "warning",
      title: "No authenticated user found",
    });
  }
};

const updateProfileInfo = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // setIsLoading(true);

  if (!user?.uid) {
    console.error("No authenticated user found");
    Swal.fire({
      icon: "error",
      title: "No authenticated user found",
    });
    // setIsLoading(false);
    return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    // await updateDoc(userDocRef, {
    //   phone,
    //   fullAddress,
    //   birthDate,
    //   nin,
    // });

    console.log("Profile information updated successfully");

    Swal.fire({
      icon: "success",
      title: "Profile information updated successfully",
    });

    // setIsLoading(false);
  } catch (error) {
    console.error("Error updating profile information:", error);

    Swal.fire({
      icon: "error",
      title: "Error updating profile information",
      text: (error as Error).message,
    });

    // setIsLoading(false);
  }
};

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center md:text-left flex-1">
              {userData && (userData.firstName || userData.lastName) ? (
                <h2 className="text-xl text-center md:text-start w-full font-bold text-gray-900">
                  Hello {`${userData.firstName} ${userData.lastName}`}
                </h2>
              ) : null}
              <p className="text-gray-600">{profile.businessName}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                {user && user?.emailVerified ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    Verified Account
                  </Badge>
                ) : null}

                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Premium User
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">₦2.5M</p>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                  <p className="text-sm text-gray-600">Successful Payments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">98.5%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) =>
                      handleProfileChange("firstName", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) =>
                      handleProfileChange("lastName", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e: any) =>
                        handleProfileChange("email", e.target.value)
                      }
                      disabled={!isEditing}
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
                      onChange={(e: any) =>
                        handleProfileChange("phone", e.target.value)
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) =>
                      handleProfileChange("address", e.target.value)
                    }
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) =>
                      handleProfileChange("city", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) =>
                      handleProfileChange("state", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) =>
                      handleProfileChange("country", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
              {isEditing && (
                <div className="flex gap-3">
                  <Button onClick={() => setIsEditing(false)}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                    value={profile.businessName}
                    onChange={(e) =>
                      handleProfileChange("businessName", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
<select className="w-full p-2 border rounded-md">
  {businessCategories.map((category) => (
    <option key={category.value} value={category.value}>
      {category.label}
    </option>
  ))}
</select>


               
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rcNumber">RC Number</Label>
                  <Input id="rcNumber" placeholder="Enter RC number" />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input id="taxId" placeholder="Enter Tax ID" />
                </div>
              </div>
              <div>
                <Label htmlFor="businessDescription">
                  Business Description
                </Label>
                <textarea
                  className="w-full p-3 border rounded-md h-24"
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
                  <select className="w-full p-2 border rounded-md">
                    <option>Guaranty Trust Bank</option>
                    <option>Access Bank</option>
                    <option>First Bank</option>
                    <option>Zenith Bank</option>
                    <option>UBA</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter account number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" placeholder="Enter account name" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

       <TabsContent value="security" className="space-y-6">
  {/* Change Password */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Key className="w-5 h-5" />
        Change Password
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Current Password */}
      <div>
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Update Button */}
      <Button onClick={changeUserPassword}>Update Password</Button>
    </CardContent>
  </Card>

  {/* Two-Factor Authentication */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Two-Factor Authentication
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Enable 2FA</h4>
          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
        </div>
        <Switch
          checked={security.twoFactorEnabled}
          onCheckedChange={(checked) => handleSecurityChange("twoFactorEnabled", checked)}
        />
      </div>
      {security.twoFactorEnabled && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            Two-factor authentication is enabled. You'll receive a code via SMS when logging in.
          </p>
          <Button variant="outline" size="sm" className="mt-2 bg-transparent">
            View Recovery Codes
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>


        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={security.emailNotifications}
                  onCheckedChange={(checked: any) =>
                    handleSecurityChange("emailNotifications", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={security.smsNotifications}
                  onCheckedChange={(checked: any) =>
                    handleSecurityChange("smsNotifications", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Login Alerts</h4>
                  <p className="text-sm text-gray-600">
                    Get notified of new login attempts
                  </p>
                </div>
                <Switch
                  checked={security.loginAlerts}
                  onCheckedChange={(checked: any) =>
                    handleSecurityChange("loginAlerts", checked)
                  }
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Email Notification Types</h4>
                <div className="space-y-3">
                  {[
                    "Transaction confirmations",
                    "Payment receipts",
                    "Account balance updates",
                    "Security alerts",
                    "Marketing updates",
                    "System maintenance",
                  ].map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{type}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLog.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.status === "Success"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <div>
                        <h4 className="font-medium">{activity.action}</h4>
                        <p className="text-sm text-gray-600">
                          {activity.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{activity.time}</p>
                      <Badge
                        variant={
                          activity.status === "Success"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">156</p>
                  <p className="text-sm text-gray-600">Total Logins</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">1,234</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">45</p>
                  <p className="text-sm text-gray-600">API Calls Today</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">98.5%</p>
                  <p className="text-sm text-gray-600">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
