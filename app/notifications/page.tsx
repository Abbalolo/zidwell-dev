// app/notifications/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { useUserContextData } from "../context/userData";
import Loader from "../components/Loader";
import DashboardSidebar from "../components/dashboard-sidebar";
import DashboardHeader from "../components/dashboard-hearder";

const fetcher = (url: string, userData: any, filter: string) => 
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userData, filter })
  }).then(r => r.json());

export default function UserNotificationsPage() {
  const { userData } = useUserContextData();
  const [filter, setFilter] = useState("all");
  
  const { data: notifications, error, isLoading, mutate } = useSWR(
    userData ? ['/api/notifications', userData, filter] : null,
    ([url, userData, filter]) => fetcher(url, userData, filter),
    { refreshInterval: 30000 }
  );

  const { data: preferences, mutate: mutatePreferences } = useSWR(
    userData ? ['/api/notifications/preferences', userData] : null,
    ([url, userData]) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData })
    }).then(r => r.json())
  );

  const markAsRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData })
    });
    mutate();
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData })
    });
    mutate();
  };

  const updatePreference = async (key: string, value: boolean) => {
    await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, [key]: value }),
    });
    mutatePreferences();
  };

  const renderTypeBadge = (type: string) => {
    const typeConfig: any = {
      info: { color: "bg-blue-100 text-blue-800", text: "ℹ️ Info" },
      success: { color: "bg-green-100 text-green-800", text: "✅ Success" },
      warning: { color: "bg-yellow-100 text-yellow-800", text: "⚠️ Warning" },
      error: { color: "bg-red-100 text-red-800", text: "❌ Error" },
      contract: { color: "bg-purple-100 text-purple-800", text: "📝 Contract" },
      wallet: { color: "bg-orange-100 text-orange-800", text: "💰 Wallet" },
      transaction: { color: "bg-indigo-100 text-indigo-800", text: "💸 Transaction" }
    };
    const config = typeConfig[type] || { color: "bg-gray-100 text-gray-800", text: type };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center">Please sign in to view notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader/></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">Error loading notifications</div>;

  const unreadCount = notifications?.filter((n: any) => !n.read_at).length || 0;

  return (
   <div className="min-h-screen bg-gray-50 fade-in overflow-x-hidden">
      <DashboardSidebar />
      <div className="lg:ml-64">
        <DashboardHeader />
        <main className="p-5">
       <div className="md:max-w-6xl md:mx-auto space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">🔔 Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Notifications</CardTitle>
                  <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="unread">Unread</option>
                    <option value="contract">Contract</option>
                    <option value="wallet">Wallet</option>
                    <option value="transaction">Transaction</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications?.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${
                        !notification.read_at ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {renderTypeBadge(notification.type)}
                            {!notification.read_at && (
                              <Badge className="bg-blue-100 text-blue-800">NEW</Badge>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-lg">{notification.title}</h3>
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                            <span>•</span>
                            <span>
                              {notification.channels?.includes('email') && '📧 '}
                              {notification.channels?.includes('push') && '🔔 '}
                              {notification.channels?.includes('sms') && '💬 '}
                              {notification.channels?.includes('in_app') && '📱'}
                            </span>
                          </div>
                        </div>
                        
                        {!notification.read_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!notifications || notifications.length === 0) && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔔</div>
                      <h3 className="text-lg font-semibold">No notifications</h3>
                      <p className="text-gray-600">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Preferences */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Email Notifications</label>
                  <Switch
                    checked={preferences?.email_notifications ?? true}
                    onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Push Notifications</label>
                  <Switch
                    checked={preferences?.push_notifications ?? true}
                    onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">SMS Notifications</label>
                  <Switch
                    checked={preferences?.sms_notifications ?? false}
                    onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
                  />
                </div>
                
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Contract Updates</label>
                    <Switch
                      checked={preferences?.contract_updates ?? true}
                      onCheckedChange={(checked) => updatePreference('contract_updates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Wallet Alerts</label>
                    <Switch
                      checked={preferences?.wallet_alerts ?? true}
                      onCheckedChange={(checked) => updatePreference('wallet_alerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Transaction Alerts</label>
                    <Switch
                      checked={preferences?.transaction_alerts ?? true}
                      onCheckedChange={(checked) => updatePreference('transaction_alerts', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </main>

      </div>
    </div>
  );
}


   