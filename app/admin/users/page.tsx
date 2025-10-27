"use client";

import useSWR from "swr";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminTable from "@/app/components/admin-components/AdminTable";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const itemsPerPage = 10;

  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin-apis/users",
    fetcher
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, activityFilter]);

  // Process users data - DON'T format dates here to avoid hydration issues
  const users = React.useMemo(() => {
    if (!data) return [];
    return (data.users ?? data).map((user: any) => ({
      ...user,
      full_name: `${user.first_name} ${user.last_name}`,
      balance: user.wallet_balance,
      // Store raw dates and format in render functions
      created_at_raw: user.created_at,
      last_login_raw: user.last_login,
      last_logout_raw: user.last_logout,
    }));
  }, [data]);

  // Helper functions for user activity (use raw dates)
  const isUserRecentlyActive = (user: any) => {
    const isActiveStatus = user.status === 'active';
    const hasRecentLogin = user.last_login_raw;
    
    if (hasRecentLogin) {
      const lastLogin = new Date(user.last_login_raw);
      const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return isActiveStatus && daysSinceLogin <= 30; // Active within last 30 days
    }
    
    return isActiveStatus;
  };

  const isUserActiveToday = (user: any) => {
    if (user.status !== 'active' || !user.last_login_raw) return false;
    const lastLogin = new Date(user.last_login_raw);
    const today = new Date();
    return lastLogin.toDateString() === today.toDateString();
  };

  const isUserActiveThisWeek = (user: any) => {
    if (user.status !== 'active' || !user.last_login_raw) return false;
    const lastLogin = new Date(user.last_login_raw);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastLogin > weekAgo;
  };

  const isUserInactive = (user: any) => {
    if (user.status !== 'active') return false;
    if (!user.last_login_raw) return true;
    const lastLogin = new Date(user.last_login_raw);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastLogin < monthAgo;
  };

  // Calculate user counts
  const activeUsers = users.filter(isUserRecentlyActive);
  const activeToday = users.filter(isUserActiveToday);
  const activeThisWeek = users.filter(isUserActiveThisWeek);
  const inactiveUsers = users.filter(isUserInactive);

  // Filter users based on search and filters
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesActivity = 
      activityFilter === "all" ||
      (activityFilter === "active" && isUserRecentlyActive(user)) ||
      (activityFilter === "today" && isUserActiveToday(user)) ||
      (activityFilter === "week" && isUserActiveThisWeek(user)) ||
      (activityFilter === "inactive" && isUserInactive(user));
    
    return matchesSearch && matchesStatus && matchesRole && matchesActivity;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ---------- Delete (uses SweetAlert) ----------
  const handleDelete = async (user: any) => {
    const res = await Swal.fire({
      title: "Delete user?",
      text: `This will permanently delete ${user.email}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });

    if (!res.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/users/${user.id}`, {
        method: "DELETE",
      });

      if (!r.ok) throw new Error("Delete failed");

      Swal.fire("Deleted", `${user.email} has been deleted.`, "success");
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  // ---------- Block / Unblock (toggle status) ----------
  const handleBlockToggle = async (user: any) => {
    const willBlock = user.status !== "blocked";
    const actionText = willBlock ? "Block" : "Unblock";
    const confirm = await Swal.fire({
      title: `${actionText} user?`,
      text: willBlock
        ? `Blocked users will not be able to log in. Block ${user.email}?`
        : `Unblock ${user.email}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: actionText,
      confirmButtonColor: willBlock ? "#d33" : "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      const body = { status: willBlock ? "blocked" : "active" };
      const r = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error("Failed to update status");
      Swal.fire(
        `${actionText}ed`,
        `${user.email} is now ${body.status}`,
        "success"
      );
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", `Failed to ${actionText.toLowerCase()} user`, "error");
    }
  };

  // ---------- Edit modal (SweetAlert form) ----------
  const handleEdit = async (user: any) => {
    const { value: formValues } = await Swal.fire({
      title: `Edit ${user.email}`,
      html:
        `<input id="swal-full_name" class="swal2-input" placeholder="Full name" value="${escapeHtml(
          user.full_name ?? ""
        )}">` +
        `<input id="swal-email" class="swal2-input" placeholder="Email" value="${escapeHtml(
          user.email ?? ""
        )}">` +
        `<input id="swal-phone" class="swal2-input" placeholder="Phone" value="${escapeHtml(
          user.phone ?? ""
        )}">` +
        `<select id="swal-role" class="swal2-select">
           <option value="user" ${
             user.role === "user" ? "selected" : ""
           }>user</option>
           <option value="admin" ${
             user.role === "admin" ? "selected" : ""
           }>admin</option>
         </select>` +
        `<select id="swal-status" class="swal2-select">
           <option value="active" ${
             user.status === "active" ? "selected" : ""
           }>active</option>
           <option value="blocked" ${
             user.status === "blocked" ? "selected" : ""
           }>blocked</option>
         </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: () => {
        const full_name = (
          document.getElementById("swal-full_name") as HTMLInputElement
        )?.value?.trim();
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        )?.value?.trim();
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        )?.value?.trim();
        const role = (document.getElementById("swal-role") as HTMLSelectElement)
          ?.value;
        const status = (
          document.getElementById("swal-status") as HTMLSelectElement
        )?.value;

        if (!full_name) {
          Swal.showValidationMessage("Full name is required");
          return null;
        }
        if (!email) {
          Swal.showValidationMessage("Email is required");
          return null;
        }

        return { full_name, email, phone, role, status };
      },
    });

    if (!formValues) return; 

    try {
      const r = await fetch(`/api/admin-apis/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        throw new Error(errText || "Failed to update user");
      }

      Swal.fire("Saved", `${user.email} updated successfully.`, "success");
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update user", "error");
    }
  };

  // ---------- Force Logout ----------
  const handleForceLogout = async (user: any) => {
    const result = await Swal.fire({
      title: 'Force Logout?',
      text: `This will immediately log out ${user.email} from all sessions.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Force Logout',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/users/${user.id}/force-logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!r.ok) throw new Error("Force logout failed");

      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: `${user.email} has been logged out from all sessions.`,
        timer: 2000,
        showConfirmButton: false,
      });
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to force logout user", "error");
    }
  };

  // ---------- View Login History ----------
  const handleViewLoginHistory = async (user: any) => {
    try {
      const response = await fetch(`/api/admin-apis/users/${user.id}/login-history`);
      if (!response.ok) throw new Error("Failed to fetch login history");
      
      const history = await response.json();
      
      let historyHtml = '<div class="text-left max-h-64 overflow-y-auto">';
      if (history.length === 0) {
        historyHtml += '<p class="text-gray-500">No login history found.</p>';
      } else {
        historyHtml += '<ul class="space-y-2">';
        history.forEach((entry: any) => {
          const loginTime = isClient ? new Date(entry.login_time).toLocaleString() : entry.login_time;
          const logoutTime = entry.logout_time 
            ? (isClient ? new Date(entry.logout_time).toLocaleString() : entry.logout_time)
            : 'Still logged in';
          historyHtml += `
            <li class="border-b pb-2">
              <div class="font-medium">Login: ${loginTime}</div>
              <div class="text-sm text-gray-600">Logout: ${logoutTime}</div>
              <div class="text-xs text-gray-500">IP: ${entry.ip_address || 'Unknown'}</div>
            </li>
          `;
        });
        historyHtml += '</ul>';
      }
      historyHtml += '</div>';

      await Swal.fire({
        title: `Login History - ${user.email}`,
        html: historyHtml,
        width: 600,
        confirmButtonColor: "#3b82f6",
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load login history", "error");
    }
  };

  // Custom cell renderers
  const renderStatusCell = (value: string) => {
    if (value === "active") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ● Active
        </span>
      );
    } else if (value === "blocked") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ● Blocked
        </span>
      );
    }
    return value;
  };

  const renderRoleCell = (value: string) => {
    if (value === "admin") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          👑 Admin
        </span>
      );
    } else if (value === "user") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          👤 User
        </span>
      );
    }
    return value;
  };

  const renderKycCell = (value: string) => {
    if (value === "verified" || value === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Verified
        </span>
      );
    } else if (value === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Pending
        </span>
      );
    } else if (value === "rejected" || value === "failed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ✗ Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ○ Not Started
        </span>
      );
    }
  };

  const renderBalanceCell = (value: number) => {
    const amount = Number(value) || 0;
    if (amount > 0) {
      return (
        <span className="font-medium text-green-600">
          ₦{amount.toLocaleString()}
        </span>
      );
    } else if (amount < 0) {
      return (
        <span className="font-medium text-red-600">
          -₦{Math.abs(amount).toLocaleString()}
        </span>
      );
    } else {
      return (
        <span className="text-gray-500">
          ₦{amount.toLocaleString()}
        </span>
      );
    }
  };

  const renderLastLoginCell = (value: string, row: any) => {
    if (!row.last_login_raw) {
      return <span className="text-gray-400 italic">Never</span>;
    }
    
    if (!isClient) {
      return row.last_login_raw; // Return raw date during SSR
    }
    
    try {
      const loginDate = new Date(row.last_login_raw);
      if (isNaN(loginDate.getTime())) return "Invalid date";
      
      const now = new Date();
      const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
      
      const formattedDate = loginDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      
      if (hoursDiff < 24) {
        return <span className="text-green-600 font-medium">{formattedDate}</span>;
      } else if (hoursDiff < 168) {
        return <span className="text-blue-600">{formattedDate}</span>;
      } else {
        return <span className="text-orange-500">{formattedDate}</span>;
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderCreatedAtCell = (value: string, row: any) => {
    if (!row.created_at_raw) return "-";
    
    if (!isClient) {
      return row.created_at_raw; // Return raw date during SSR
    }
    
    try {
      const date = new Date(row.created_at_raw);
      if (isNaN(date.getTime())) return "Invalid date";
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderLastLogoutCell = (value: string, row: any) => {
    if (!row.last_logout_raw) {
      return <span className="text-gray-400 italic">Never</span>;
    }
    
    if (!isClient) {
      return row.last_logout_raw; // Return raw date during SSR
    }
    
    try {
      const logoutDate = new Date(row.last_logout_raw);
      if (isNaN(logoutDate.getTime())) return "Invalid date";
      
      return logoutDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderPhoneCell = (value: string) => {
    if (!value) {
      return <span className="text-gray-400 italic">Not set</span>;
    }
    return <span className="text-gray-700">{value}</span>;
  };

  // Define columns with render functions
  const columns = [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "balance", label: "Balance", render: renderBalanceCell },
    { key: "role", label: "Role", render: renderRoleCell },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "last_login", label: "Last Login", render: renderLastLoginCell },
    { key: "last_logout", label: "Last Logout", render: renderLastLogoutCell },
    { key: "created_at", label: "Created", render: renderCreatedAtCell },
    { key: "phone", label: "Phone", render: renderPhoneCell },
    { key: "kyc_status", label: "KYC", render: renderKycCell },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600">Failed to load users ❌</p>
        </div>
      </AdminLayout>
    );
  }

  // Show empty state
  if (!data || users.length === 0) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p>No users available.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Users Management</h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-semibold">{users.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Active (30d)</h3>
            <p className="text-2xl font-semibold text-green-600">
              {activeUsers.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Active Today</h3>
            <p className="text-2xl font-semibold text-blue-600">
              {activeToday.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Active This Week</h3>
            <p className="text-2xl font-semibold text-purple-600">
              {activeThisWeek.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Inactive (30d+)</h3>
            <p className="text-2xl font-semibold text-orange-600">
              {inactiveUsers.length}
            </p>
          </div>
        </div>

        {/* Filters with Shadcn Select Components */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <Input
              placeholder="Search by email, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-1/5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/5">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/5">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="active">Active (30d)</SelectItem>
                <SelectItem value="today">Active Today</SelectItem>
                <SelectItem value="week">Active This Week</SelectItem>
                <SelectItem value="inactive">Inactive (30d+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          Showing {paginatedUsers.length} of {filteredUsers.length} users
          {searchTerm && ` matching "${searchTerm}"`}
          {activityFilter !== "all" && ` (${activityFilter})`}
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          rows={paginatedUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBlockToggle={handleBlockToggle}
          onForceLogout={handleForceLogout}
          onViewLoginHistory={handleViewLoginHistory}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

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
      </div>
    </AdminLayout>
  );
}

/**
 * Small helper to escape input values used inside html template string
 * to avoid breaking the SweetAlert HTML.
 */
function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}