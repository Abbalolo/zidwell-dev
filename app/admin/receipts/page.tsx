"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReceiptsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const itemsPerPage = 10;

  // Build API URL with all filters for server-side filtering
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      range: dateRange,
    });

    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return `/api/admin-apis/receipts?${params.toString()}`;
  }, [currentPage, dateRange, searchTerm, statusFilter, startDate, endDate, itemsPerPage]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher);

  // Separate hook for stats (all filtered data without pagination)
  const statsApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      range: dateRange,
      limit: '10000', // Get all for stats calculation
    });

    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return `/api/admin-apis/receipts?${params.toString()}`;
  }, [dateRange, searchTerm, statusFilter, startDate, endDate]);

  const { data: statsData } = useSWR(statsApiUrl, fetcher);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRange, startDate, endDate]);

  // Memoize calculations
  const receipts = useMemo(() => data?.receipts || [], [data]);
  const totalReceipts = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(() => Math.ceil(totalReceipts / itemsPerPage), [totalReceipts, itemsPerPage]);

  // Use statsData for calculations
  const allFilteredReceipts = useMemo(() => statsData?.receipts || [], [statsData]);

  // Calculate stats
  const totalAmount = useMemo(() => 
    allFilteredReceipts.reduce((sum: number, r: any) => sum + Number(r.amount_balance || 0), 0), 
    [allFilteredReceipts]
  );

  const pendingReceipts = useMemo(() => 
    allFilteredReceipts.filter((r: any) => r.status === "pending" || r.status === "draft"), 
    [allFilteredReceipts]
  );

  const signedReceipts = useMemo(() => 
    allFilteredReceipts.filter((r: any) => r.status === "signed" || r.status === "completed"), 
    [allFilteredReceipts]
  );

  const rejectedReceipts = useMemo(() => 
    allFilteredReceipts.filter((r: any) => r.status === "rejected" || r.status === "cancelled"), 
    [allFilteredReceipts]
  );

  const expiredReceipts = useMemo(() => 
    allFilteredReceipts.filter((r: any) => r.status === "expired"), 
    [allFilteredReceipts]
  );

  // ✅ Edit receipt status
  async function handleEdit(row: any) {
    const { value: newStatus } = await Swal.fire({
      title: 'Update Receipt Status',
      input: 'select',
      inputOptions: {
        'draft': 'Draft',
        'pending': 'Pending',
        'sent': 'Sent',
        'signed': 'Signed',
        'completed': 'Completed',
        'rejected': 'Rejected',
        'cancelled': 'Cancelled',
        'expired': 'Expired'
      },
      inputValue: row.status,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to select a status!';
        }
      }
    });

    if (newStatus) {
      try {
        await fetch("/api/admin-apis/receipts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.id, status: newStatus }),
        });
        
        Swal.fire({
          icon: "success",
          title: "Status Updated",
          text: `Receipt status updated to ${newStatus}`,
          timer: 2000,
          showConfirmButton: false,
        });
        
        mutate();
      } catch (err) {
        Swal.fire("Error", "Failed to update receipt status", "error");
      }
    }
  }

  // ✅ Delete receipt
  async function handleDelete(row: any) {
    const result = await Swal.fire({
      title: 'Delete Receipt?',
      text: `Are you sure you want to delete receipt ${row.receipt_id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await fetch("/api/admin-apis/receipts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.id }),
        });
        
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Receipt has been deleted successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        
        mutate();
      } catch (err) {
        Swal.fire("Error", "Failed to delete receipt", "error");
      }
    }
  }

  // View receipt details
  async function handleViewDetails(row: any) {
    let detailsHtml = `
      <div class="text-left space-y-3">
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Receipt ID:</strong></div>
          <div class="font-mono text-sm">${row.receipt_id}</div>
          
          <div><strong>Initiator:</strong></div>
          <div>${row.initiator_email}</div>
          
          <div><strong>Signee:</strong></div>
          <div>${row.signee_email || "N/A"}</div>
          
          <div><strong>Amount:</strong></div>
          <div class="font-semibold">₦${Number(row.amount_balance || 0).toLocaleString()}</div>
          
          <div><strong>Status:</strong></div>
          <div>${row.status}</div>
          
          <div><strong>Created:</strong></div>
          <div>${new Date(row.created_at).toLocaleString()}</div>
        </div>
    `;

    // Add additional fields if available
    if (row.updated_at) {
      detailsHtml += `
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Last Updated:</strong></div>
          <div>${new Date(row.updated_at).toLocaleString()}</div>
        </div>
      `;
    }

    detailsHtml += `</div>`;

    await Swal.fire({
      title: `Receipt Details`,
      html: detailsHtml,
      width: 600,
      confirmButtonColor: "#3b82f6",
    });
  }

  // Custom cell renderers
  const renderStatusCell = (value: string) => {
    const statusConfig: any = {
      draft: { color: "bg-gray-100 text-gray-800", text: "📝 Draft" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "⏳ Pending" },
      sent: { color: "bg-blue-100 text-blue-800", text: "📤 Sent" },
      signed: { color: "bg-green-100 text-green-800", text: "✅ Signed" },
      completed: { color: "bg-green-100 text-green-800", text: "🎉 Completed" },
      rejected: { color: "bg-red-100 text-red-800", text: "❌ Rejected" },
      cancelled: { color: "bg-red-100 text-red-800", text: "🚫 Cancelled" },
      expired: { color: "bg-orange-100 text-orange-800", text: "⏰ Expired" }
    };

    const config = statusConfig[value] || { color: "bg-gray-100 text-gray-800", text: value };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderAmountCell = (value: number) => {
    return (
      <span className="font-semibold text-green-600">
        ₦{Number(value || 0).toLocaleString()}
      </span>
    );
  };

  const renderDateCell = (value: string) => {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value || "-";
      
      const now = new Date();
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      const formattedDate = date.toLocaleString();
      
      if (hoursDiff < 1) {
        return <span className="text-green-600 font-medium">{formattedDate}</span>;
      } else if (hoursDiff < 24) {
        return <span className="text-blue-600">{formattedDate}</span>;
      } else {
        return <span className="text-gray-600">{formattedDate}</span>;
      }
    } catch (error) {
      return value || "-";
    }
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
        <div className="text-center text-red-500 mt-10">Failed to load receipts.</div>
      </AdminLayout>
    );
  }

  const columns = [
    { key: "receipt_id", label: "Receipt #" },
    { key: "initiator_email", label: "Initiator" },
    { key: "signee_email", label: "Signee" },
    { key: "amount_balance", label: "Amount", render: renderAmountCell },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "created_at", label: "Created", render: renderDateCell },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">🧾 Receipts Management</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
            <p className="text-2xl font-semibold">₦{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-2xl font-semibold text-yellow-600">
              {pendingReceipts.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Signed</h3>
            <p className="text-2xl font-semibold text-green-600">
              {signedReceipts.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
            <p className="text-2xl font-semibold text-red-600">
              {rejectedReceipts.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Expired</h3>
            <p className="text-2xl font-semibold text-orange-600">
              {expiredReceipts.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by receipt ID, initiator, signee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateRange("total");
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          Showing {receipts.length} of {totalReceipts} receipts
          {searchTerm && ` matching "${searchTerm}"`}
          {statusFilter !== 'all' && ` | Status: ${statusFilter}`}
          {dateRange !== "total" && ` | Date: ${dateRange}`}
          {` - Page ${currentPage} of ${totalPages}`}
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          rows={receipts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
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
      </div>
    </AdminLayout>
  );
}