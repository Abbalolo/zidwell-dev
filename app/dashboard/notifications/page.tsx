// app/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useUserContextData } from "../../context/userData";
import Loader from "../../components/Loader";
import DashboardSidebar from "../../components/dashboard-sidebar";
import DashboardHeader from "../../components/dashboard-hearder";

export default function UserNotificationsPage() {
  const {
    userData,
    notifications,
    unreadCount,
    notificationsLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useUserContextData();

  const [filter, setFilter] = useState("all");

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read_at;
    if (filter === "all") return true;
    return notification.type === filter;
  });

  // TEMPORARY: Show all notifications without filtering
  const displayNotifications = filteredNotifications.map(notification => ({
    ...notification,
    // Add display properties for empty notifications
    displayTitle: notification.title === "Notification" ? "System Notification" : notification.title,
    displayMessage: notification.message === "No message" ? "Notification received" : notification.message,
    isPlaceholder: notification.title === "Notification" && notification.message === "No message"
  }));

  const renderTypeBadge = (type: string) => {
    const typeConfig: any = {
      info: { color: "bg-blue-100 text-blue-800", text: "ℹ️ Info" },
      success: { color: "bg-green-100 text-green-800", text: "✅ Success" },
      warning: { color: "bg-yellow-100 text-yellow-800", text: "⚠️ Warning" },
      error: { color: "bg-red-100 text-red-800", text: "❌ Error" },
      contract: { color: "bg-purple-100 text-purple-800", text: "📝 Contract" },
      wallet: { color: "bg-orange-100 text-orange-800", text: "💰 Wallet" },
      transaction: {
        color: "bg-indigo-100 text-indigo-800",
        text: "💸 Transaction",
      },
    };
    const config = typeConfig[type] || {
      color: "bg-gray-100 text-gray-800",
      text: type,
    };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manually refreshing notifications...');
    fetchNotifications();
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
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

  if (notificationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

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
                  {unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : "All caught up!"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {notifications.length} total notifications
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={notificationsLoading}
                >
                  {notificationsLoading ? "Refreshing..." : "Refresh"}
                </Button>
                {unreadCount > 0 && (
                  <Button variant="outline" onClick={markAllAsRead}>
                    Mark All as Read
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Your Notifications</CardTitle>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border rounded px-3 py-2 text-sm"
                      >
                        <option value="all">All ({displayNotifications.length})</option>
                        <option value="unread">Unread ({unreadCount})</option>
                        <option value="contract">Contract</option>
                        <option value="wallet">Wallet</option>
                        <option value="transaction">Transaction</option>
                        <option value="info">Info</option>
                      </select>
                    </div>
                    <CardDescription>
                      Showing {displayNotifications.length} notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {displayNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            !notification.read_at
                              ? "bg-blue-50 border-blue-200 shadow-sm"
                              : notification.isPlaceholder
                              ? "bg-gray-50 border-gray-200"
                              : "bg-white hover:bg-gray-50"
                          } ${notification.isPlaceholder ? 'opacity-75' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {renderTypeBadge(notification.type)}
                                {!notification.read_at && (
                                  <Badge className="bg-blue-500 text-white animate-pulse">
                                    NEW
                                  </Badge>
                                )}
                                {notification.isPlaceholder && (
                                  <Badge variant="outline" className="text-gray-500">
                                    Placeholder
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatDate(notification.created_at)}
                                </span>
                              </div>

                              <h3 className="font-semibold text-lg mb-2 break-words">
                                {notification.displayTitle}
                              </h3>
                              <p className="text-gray-600 mb-3 break-words">
                                {notification.displayMessage}
                              </p>

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  {notification.channels?.includes("email") && "📧"}
                                  {notification.channels?.includes("push") && "🔔"}
                                  {notification.channels?.includes("sms") && "💬"}
                                  {notification.channels?.includes("in_app") && "📱"}
                                  {notification.channels?.join(", ")}
                                </span>
                                <span>•</span>
                                <span>
                                  ID: {notification.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>

                            {!notification.read_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="flex-shrink-0"
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {displayNotifications.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🔔</div>
                          <h3 className="text-lg font-semibold mb-2">
                            {filter === "unread"
                              ? "No unread notifications"
                              : "No notifications found"}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {filter === "unread"
                              ? "You're all caught up!"
                              : "No notifications available for this filter"}
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={handleRefresh}
                          >
                            Check for New Notifications
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-medium">{notifications.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Unread:</span>
                      <span className="font-medium text-blue-600">{unreadCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Showing:</span>
                      <span className="font-medium text-green-600">{displayNotifications.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Debug Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>User ID:</span>
                      <span className="font-mono">{userData?.id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Fetch:</span>
                      <span>{notificationsLoading ? 'Loading...' : 'Ready'}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleRefresh}
                    >
                      Force Refresh
                    </Button>
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