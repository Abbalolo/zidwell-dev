"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NotificationsCenterPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info",
    channels: ["in_app"],
    target_audience: "all_users",
    scheduled_for: "",
    is_urgent: false
  });
  const itemsPerPage = 15;

  // Build API URL with all filters for server-side filtering
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      range: dateRange,
    });

    if (searchTerm) params.append('search', searchTerm);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (channelFilter !== 'all') params.append('channel', channelFilter);

    return `/api/admin-apis/notifications?${params.toString()}`;
  }, [currentPage, dateRange, searchTerm, typeFilter, statusFilter, channelFilter, itemsPerPage]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher);

  // Separate hook for stats
  const statsApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      range: dateRange,
      limit: '10000',
    });

    if (searchTerm) params.append('search', searchTerm);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (channelFilter !== 'all') params.append('channel', channelFilter);

    return `/api/admin-apis/notifications?${params.toString()}`;
  }, [dateRange, searchTerm, typeFilter, statusFilter, channelFilter]);

  const { data: statsData } = useSWR(statsApiUrl, fetcher);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, channelFilter, dateRange]);

  // Memoize calculations
  const notifications = useMemo(() => data?.notifications || [], [data]);
  const totalNotifications = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(() => Math.ceil(totalNotifications / itemsPerPage), [totalNotifications, itemsPerPage]);

  // Use statsData for calculations
  const allFilteredNotifications = useMemo(() => statsData?.notifications || [], [statsData]);

  // Calculate stats
  const sentNotifications = useMemo(() => 
    allFilteredNotifications.filter((n: any) => n.status === "sent"), 
    [allFilteredNotifications]
  );

  const scheduledNotifications = useMemo(() => 
    allFilteredNotifications.filter((n: any) => n.status === "scheduled"), 
    [allFilteredNotifications]
  );

  const failedNotifications = useMemo(() => 
    allFilteredNotifications.filter((n: any) => n.status === "failed"), 
    [allFilteredNotifications]
  );

  const pushNotifications = useMemo(() => 
    allFilteredNotifications.filter((n: any) => n.channels?.includes("push")), 
    [allFilteredNotifications]
  );

  const emailNotifications = useMemo(() => 
    allFilteredNotifications.filter((n: any) => n.channels?.includes("email")), 
    [allFilteredNotifications]
  );

  // Create new notification
  const handleCreateNotification = async () => {
    try {
      const response = await fetch("/api/admin-apis/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotification),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Notification Created!",
          text: "Your notification has been scheduled successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        
        setShowCreateModal(false);
        setNewNotification({
          title: "",
          message: "",
          type: "info",
          channels: ["in_app"],
          target_audience: "all_users",
          scheduled_for: "",
          is_urgent: false
        });
        mutate();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      Swal.fire("Error", "Failed to create notification", "error");
    }
  };

  // Send notification immediately
  const handleSendNow = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin-apis/notifications/${notificationId}/send`, {
        method: "POST",
      });
      
      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Notification Sent!",
          text: "The notification has been sent immediately",
          timer: 2000,
          showConfirmButton: false,
        });
        
        mutate();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to send notification", "error");
    }
  };

  // Cancel scheduled notification
  const handleCancel = async (notificationId: string) => {
    const result = await Swal.fire({
      title: 'Cancel Notification?',
      text: 'This will cancel the scheduled notification',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Cancel Notification',
      cancelButtonText: 'Keep Scheduled'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin-apis/notifications?id=${notificationId}`, {
          method: "DELETE",
        });
        
        const deleteResult = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Cancelled!",
            text: "The notification has been cancelled",
            timer: 2000,
            showConfirmButton: false,
          });
          
          mutate();
        } else {
          throw new Error(deleteResult.error);
        }
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to cancel notification", "error");
      }
    }
  };

  // Custom renderers
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

  const renderStatusBadge = (status: string) => {
    const statusConfig: any = {
      draft: { color: "bg-gray-100 text-gray-800", text: "📝 Draft" },
      scheduled: { color: "bg-yellow-100 text-yellow-800", text: "⏰ Scheduled" },
      sent: { color: "bg-green-100 text-green-800", text: "✅ Sent" },
      failed: { color: "bg-red-100 text-red-800", text: "❌ Failed" }
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", text: status };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const renderChannels = (channels: string[]) => {
    const channelIcons: any = {
      in_app: "📱",
      email: "📧",
      sms: "💬",
      push: "🔔"
    };

    return (
      <div className="flex space-x-1">
        {channels?.map((channel) => (
          <Badge key={channel} variant="outline" className="text-xs">
            {channelIcons[channel] || "📦"} {channel}
          </Badge>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-500 mt-10">Failed to load notifications.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">🔔 Notifications Center</h2>
            <p className="text-gray-600">Manage platform alerts and communications</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              📢 Create Notification
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Sent</h3>
            <p className="text-2xl font-semibold text-green-600">{sentNotifications.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Scheduled</h3>
            <p className="text-2xl font-semibold text-yellow-600">{scheduledNotifications.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Failed</h3>
            <p className="text-2xl font-semibold text-red-600">{failedNotifications.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Push Notifications</h3>
            <p className="text-2xl font-semibold text-blue-600">{pushNotifications.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Emails Sent</h3>
            <p className="text-2xl font-semibold text-orange-600">{emailNotifications.length}</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by title, message, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="in_app">In-App</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                    setChannelFilter("all");
                    setDateRange("total");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing {notifications.length} of {totalNotifications} notifications
                {` - Page ${currentPage} of ${totalPages}`}
              </div>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications History</CardTitle>
            <CardDescription>
              All platform notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <div key={notification.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {renderTypeBadge(notification.type)}
                        {renderStatusBadge(notification.status)}
                        {notification.is_urgent && (
                          <Badge className="bg-red-100 text-red-800">🚨 URGENT</Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg">{notification.title}</h3>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span>To: {notification.target_audience}</span>
                        <span>Channels: {renderChannels(notification.channels)}</span>
                        <span>Created: {new Date(notification.created_at).toLocaleString()}</span>
                        {notification.scheduled_for && (
                          <span>Scheduled: {new Date(notification.scheduled_for).toLocaleString()}</span>
                        )}
                        {notification.sent_at && (
                          <span>Sent: {new Date(notification.sent_at).toLocaleString()}</span>
                        )}
                      </div>

                      {/* Delivery Stats */}
                      {notification.stats && (
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <span>📱 In-App: {notification.stats.in_app_sent || 0}</span>
                          <span>📧 Email: {notification.stats.email_sent || 0}</span>
                          <span>💬 SMS: {notification.stats.sms_sent || 0}</span>
                          <span>🔔 Push: {notification.stats.push_sent || 0}</span>
                          <span>✅ Successful: {notification.stats.successful || 0}</span>
                          <span>❌ Failed: {notification.stats.failed || 0}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {notification.status === "scheduled" && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleSendNow(notification.id)}
                          >
                            Send Now
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCancel(notification.id)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {notification.status === "draft" && (
                        <Button size="sm">
                          Edit
                        </Button>
                      )}
                      {notification.status === "failed" && (
                        <Button 
                          size="sm"
                          onClick={() => handleSendNow(notification.id)}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🔔</div>
                  <h3 className="text-lg font-semibold">No notifications found</h3>
                  <p className="text-gray-600">Create your first notification to get started</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Create New Notification</CardTitle>
                <CardDescription>
                  Send alerts to users via multiple channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    placeholder="Notification title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <Textarea
                    placeholder="Enter your notification message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select 
                      value={newNotification.type} 
                      onValueChange={(value) => setNewNotification({...newNotification, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="contract">Contract Update</SelectItem>
                        <SelectItem value="wallet">Wallet Alert</SelectItem>
                        <SelectItem value="transaction">Transaction Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Audience</label>
                    <Select 
                      value={newNotification.target_audience} 
                      onValueChange={(value) => setNewNotification({...newNotification, target_audience: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_users">All Users</SelectItem>
                        <SelectItem value="premium_users">Premium Users</SelectItem>
                        <SelectItem value="new_users">New Users</SelectItem>
                        <SelectItem value="inactive_users">Inactive Users</SelectItem>
                        <SelectItem value="specific_user">Specific User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Channels</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["in_app", "email", "sms", "push"].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newNotification.channels.includes(channel)}
                          onChange={(e) => {
                            const updatedChannels = e.target.checked
                              ? [...newNotification.channels, channel]
                              : newNotification.channels.filter(c => c !== channel);
                            setNewNotification({...newNotification, channels: updatedChannels});
                          }}
                        />
                        <span className="text-sm capitalize">
                          {channel === 'in_app' ? '📱 In-App' :
                           channel === 'email' ? '📧 Email' :
                           channel === 'sms' ? '💬 SMS' : '🔔 Push'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Schedule For (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={newNotification.scheduled_for}
                      onChange={(e) => setNewNotification({...newNotification, scheduled_for: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newNotification.is_urgent}
                      onCheckedChange={(checked) => setNewNotification({...newNotification, is_urgent: checked})}
                    />
                    <label className="text-sm font-medium">Mark as Urgent</label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateNotification}
                    disabled={!newNotification.title || !newNotification.message}
                  >
                    Create Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}