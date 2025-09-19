import React, { useState } from "react";
import { Building, CreditCard, Eye, EyeOff, Key, Shield } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import { useUserContextData } from "@/app/context/userData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Swal from "sweetalert2";
import { Switch } from "../ui/switch";
import supabase from "@/app/supabase/supabase";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  loginAlerts: boolean;
}



const initialSecurity: SecuritySettings = {
  twoFactorEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
  loginAlerts: true,
};



function EditSecurityInfo() {

    
      const [security, setSecurity] = useState<SecuritySettings>(initialSecurity);
      const [showCurrentPassword, setShowCurrentPassword] = useState(false);
      const [showNewPassword, setShowNewPassword] = useState(false);
      const [loading, setLoading] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [currentPassword, setCurrentPassword] = useState("");
      const [newPassword, setNewPassword] = useState("");
      const [confirmPassword, setConfirmPassword] = useState("");
    const {userData} = useUserContextData()
    
    
      const handleSecurityChange = (
        field: keyof SecuritySettings,
        value: boolean
      ) => {
        setSecurity((prev) => ({ ...prev, [field]: value }));
      };
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
setLoading(true)
  try {
   
  
    if (!userData?.email) {
      return Swal.fire({
        icon: "error",
        title: "User not authenticated",
      });
    }

    // ✅ Re-authenticate the user with their current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData?.email,
      password: currentPassword,
    });

    if (signInError) {
      return Swal.fire({
        icon: "error",
        title: "Current password is incorrect",
      });
    }

    // ✅ Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return Swal.fire({
        icon: "error",
        title: "Error updating password",
        text: updateError.message,
      });
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    Swal.fire({
      icon: "success",
      title: "Password updated successfully",
    });

    setLoading(false)
  } catch (err) {
     setLoading(false)
    Swal.fire({
      icon: "error",
      title: "Something went wrong",
      text: (err as Error).message,
    });
  }
};
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
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
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Update Button */}
          <Button disabled={loading} className="bg-[#C29307] hover:opacity-100 transition-smooth" onClick={changeUserPassword}>
            
             {loading ? "updating..." : "Update Password"}
            </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      {/* <Card>
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
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={security.twoFactorEnabled}
              onCheckedChange={(checked) =>
                handleSecurityChange("twoFactorEnabled", checked)
              }
            />
          </div>
          {security.twoFactorEnabled && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                Two-factor authentication is enabled. You'll receive a code via
                SMS when logging in.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
              >
                View Recovery Codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card> */}
    </>
  );
}

export default EditSecurityInfo;
