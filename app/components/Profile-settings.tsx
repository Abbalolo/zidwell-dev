"use client";
import { Camera, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import Swal from "sweetalert2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { useUserContextData } from "../context/userData";

import EditProfileInfo from "./profile-operations/EditProfileInfo";
import EditBusinessInfo from "./profile-operations/EditBusinessInfo";
import EditSecurityInfo from "./profile-operations/EditSecurityInfo";
import supabase from "../supabase/supabase";
import { useRef, useState } from "react";
import UserDashboardStats from "./UserDashboardStats";

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
 const { userData, setUserData } = useUserContextData();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

 
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  try {
    if (!userData?.id) {
      throw new Error("User is not authenticated");
    }

    if (!event.target.files || event.target.files.length === 0) {
      throw new Error("No file selected");
    }

    const file = event.target.files[0];
    setUploading(true);

    // Send to API route
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userData.id);

    const response = await fetch("/api/profile/upload-profile-picture", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload image");
    }

    // ✅ Update context + local storage
    const updatedUser = { ...userData, profile_picture: data.url };
    setUserData(updatedUser);
    localStorage.setItem("userData", JSON.stringify(updatedUser));

    Swal.fire({
      icon: "success",
      title: "Profile Updated!",
      text: "Your profile picture has been uploaded.",
    });

  } catch (err: any) {
    console.error("❌ Upload failed:", err);
    Swal.fire({
      icon: "error",
      title: "Upload Failed",
      text: err.message || "Something went wrong.",
    });
  } finally {
    setUploading(false);
  }
};





  return (
    <div className="space-y-6 mb-5">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {userData?.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {userData?.firstName?.charAt(0).toUpperCase()}
                  {userData?.lastName?.charAt(0).toUpperCase()}
                </div>
              )}

              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-gray-800 text-white hover:bg-gray-700"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <Camera className="w-4 h-4" />
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
            </div>
            <div className="text-center md:text-left flex-1">
              {userData && (userData?.firstName || userData?.lastName) ? (
                <h2 className="text-xl text-center md:text-start w-full font-bold text-gray-900">
                  {`${userData.firstName} ${userData.lastName}`}
                </h2>
              ) : null}
              {/* <p className="text-gray-600">{userData}</p> */}
              <p className="text-sm text-gray-500">{userData?.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                {/* {user && user?.emailVerified ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    Verified Account
                  </Badge>
                ) : null} */}

                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Premium User
                </Badge>
              </div>
            </div>
            <div className="text-center">
             <UserDashboardStats/>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {/* <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger> */}
        </TabsList>

        {/* personal info */}

        <TabsContent value="personal" className="space-y-6">
          <EditProfileInfo />
        </TabsContent>

        {/* business info */}
        <TabsContent value="business" className="space-y-6">
          <EditBusinessInfo />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <EditSecurityInfo />
        </TabsContent>

        {/* <TabsContent value="notifications" className="space-y-6">
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
        </TabsContent> */}

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
