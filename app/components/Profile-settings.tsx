"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Switch } from "./ui/switch"
import { Badge } from "./ui/badge"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  businessName: string
  businessType: string
  address: string
  city: string
  state: string
  country: string
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  loginAlerts: boolean
}

const initialProfile: ProfileData = {
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
}

const initialSecurity: SecuritySettings = {
  twoFactorEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
  loginAlerts: true,
}

const activityLog = [
  { action: "Login", location: "Lagos, Nigeria", time: "2 hours ago", status: "Success" },
  { action: "Password Changed", location: "Lagos, Nigeria", time: "1 day ago", status: "Success" },
  { action: "Profile Updated", location: "Lagos, Nigeria", time: "3 days ago", status: "Success" },
  { action: "Login Attempt", location: "Abuja, Nigeria", time: "1 week ago", status: "Failed" },
  { action: "API Key Generated", location: "Lagos, Nigeria", time: "2 weeks ago", status: "Success" },
]

export default function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile)
  const [security, setSecurity] = useState<SecuritySettings>(initialSecurity)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSecurityChange = (field: keyof SecuritySettings, value: boolean) => {
    setSecurity((prev) => ({ ...prev, [field]: value }))
  }

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
              <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600">{profile.businessName}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Verified Account
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
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
                    onChange={(e) => handleProfileChange("firstName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => handleProfileChange("lastName", e.target.value)}
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
                      onChange={(e:any) => handleProfileChange("email", e.target.value)}
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
                      onChange={(e:any) => handleProfileChange("phone", e.target.value)}
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
                    onChange={(e) => handleProfileChange("address", e.target.value)}
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
                    onChange={(e) => handleProfileChange("city", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) => handleProfileChange("state", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => handleProfileChange("country", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              {isEditing && (
                <div className="flex gap-3">
                  <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
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
                    onChange={(e) => handleProfileChange("businessName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="Fintech">Fintech</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Technology">Technology</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
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
                <Label htmlFor="businessDescription">Business Description</Label>
                <textarea className="w-full p-3 border rounded-md h-24" placeholder="Describe your business..." />
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
                  <Input id="accountNumber" placeholder="Enter account number" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
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
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
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
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
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
              <Button>Update Password</Button>
            </CardContent>
          </Card>

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
                  onCheckedChange={(checked:any) => handleSecurityChange("twoFactorEnabled", checked)}
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

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Production API Key</h4>
                  <p className="text-sm text-gray-600 font-mono">zw_live_••••••••••••••••••••••••••••</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    Regenerate
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Test API Key</h4>
                  <p className="text-sm text-gray-600 font-mono">zw_test_••••••••••••••••••••••••••••</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    Regenerate
                  </Button>
                </div>
              </div>
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
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  checked={security.emailNotifications}
                  onCheckedChange={(checked:any) => handleSecurityChange("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                </div>
                <Switch
                  checked={security.smsNotifications}
                  onCheckedChange={(checked:any) => handleSecurityChange("smsNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Login Alerts</h4>
                  <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                </div>
                <Switch
                  checked={security.loginAlerts}
                  onCheckedChange={(checked:any) => handleSecurityChange("loginAlerts", checked)}
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
                    <div key={type} className="flex items-center justify-between">
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
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.status === "Success" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div>
                        <h4 className="font-medium">{activity.action}</h4>
                        <p className="text-sm text-gray-600">{activity.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{activity.time}</p>
                      <Badge variant={activity.status === "Success" ? "secondary" : "destructive"}>
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
  )
}
