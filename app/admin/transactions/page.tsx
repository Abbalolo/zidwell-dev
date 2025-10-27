// app/admin/transactions/page.tsx
"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminTable from "@/app/components/admin-components/AdminTable";
import AdminLayout from "@/app/components/admin-components/layout";
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

export default function TransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isClient, setIsClient] = useState(false);
  const itemsPerPage = 20;

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
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return `/api/admin-apis/transactions?${params.toString()}`;
  }, [currentPage, dateRange, searchTerm, typeFilter, statusFilter, startDate, endDate, itemsPerPage]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher);

  // Separate hook for stats (all filtered data without pagination)
  const statsApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      range: dateRange,
      limit: '10000', // Get all for stats calculation
    });

    if (searchTerm) params.append('search', searchTerm);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return `/api/admin-apis/transactions?${params.toString()}`;
  }, [dateRange, searchTerm, typeFilter, statusFilter, startDate, endDate]);

  const { data: statsData } = useSWR(statsApiUrl, fetcher);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateRange, startDate, endDate]);

  // Memoize calculations - MUST BE BEFORE ANY CONDITIONAL RETURNS
  const transactions = useMemo(() => data?.transactions || [], [data]);
  const totalTransactions = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(() => Math.ceil(totalTransactions / itemsPerPage), [totalTransactions, itemsPerPage]);

  // Use statsData for calculations instead of current page data
  const allFilteredTransactions = useMemo(() => statsData?.transactions || [], [statsData]);

  const totalAmount = useMemo(() => 
    allFilteredTransactions.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0), 
    [allFilteredTransactions]
  );

  const totalFee = useMemo(() => 
    allFilteredTransactions.reduce((sum: number, t: any) => sum + Number(t.fee || 0), 0), 
    [allFilteredTransactions]
  );

  const successfulTransactions = useMemo(() => 
    allFilteredTransactions.filter((t: any) => t.status === "success"), 
    [allFilteredTransactions]
  );

  const failedTransactions = useMemo(() => 
    allFilteredTransactions.filter((t: any) => t.status === "failed"), 
    [allFilteredTransactions]
  );

  const pendingTransactions = useMemo(() => 
    allFilteredTransactions.filter((t: any) => t.status === "pending"), 
    [allFilteredTransactions]
  );

  // Now the conditional returns can happen after all hooks
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }
  if (error) return <p className="p-6 text-red-600">Failed to load transactions ❌</p>;
  if (!data) return <p className="p-6">No data available.</p>;

  // Debug: Log the API URL to see what's being requested
  console.log('API URL:', apiUrl);
  console.log('Transactions count:', transactions.length);
  console.log('Total transactions:', totalTransactions);

  // ---------- Export to CSV ----------
  const handleExportCSV = async () => {
    try {
      // Get all transactions for export (without pagination)
      const exportParams = new URLSearchParams({
        range: dateRange,
        limit: '10000', // Large limit to get all transactions
      });

      if (searchTerm) exportParams.append('search', searchTerm);
      if (typeFilter !== 'all') exportParams.append('type', typeFilter);
      if (statusFilter !== 'all') exportParams.append('status', statusFilter);
      if (startDate) exportParams.append('startDate', startDate);
      if (endDate) exportParams.append('endDate', endDate);

      const exportResponse = await fetch(`/api/admin-apis/transactions?${exportParams.toString()}`);
      const exportData = await exportResponse.json();
      const exportTransactions = exportData.transactions || [];

      // Convert to CSV
      const headers = ["ID", "User ID", "Type", "Amount", "Fee", "Total", "Status", "Reference", "Description", "Phone", "Network", "Channel", "Created At"];
      const csvData = exportTransactions.map((t: any) => [
        t.id,
        t.user_id || "",
        t.type,
        t.amount,
        t.fee || 0,
        t.total_deduction || t.amount,
        t.status,
        t.reference || "",
        t.description || "",
        t.phone_number || "",
        t.network || "",
        t.channel || "",
        isClient ? new Date(t.created_at).toLocaleString() : t.created_at
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row: any[]) => row.map(field => `"${field}"`).join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Export Successful",
        text: `${exportTransactions.length} transactions exported to CSV`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to export transactions", "error");
    }
  };

  // ---------- View Transaction Details ----------
  const handleViewDetails = async (transaction: any) => {
    let detailsHtml = `
      <div class="text-left space-y-3">
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Transaction ID:</strong></div>
          <div class="font-mono text-sm">${transaction.id}</div>
          
          <div><strong>Reference:</strong></div>
          <div>${transaction.reference || "N/A"}</div>
          
          <div><strong>User ID:</strong></div>
          <div class="font-mono text-sm">${transaction.user_id || "N/A"}</div>
          
          <div><strong>Type:</strong></div>
          <div>${transaction.type}</div>
          
          <div><strong>Amount:</strong></div>
          <div class="font-semibold">₦${Number(transaction.amount).toLocaleString()}</div>
          
          <div><strong>Fee:</strong></div>
          <div>₦${Number(transaction.fee || 0).toLocaleString()}</div>
          
          <div><strong>Total:</strong></div>
          <div class="font-semibold">₦${Number(transaction.total_deduction || transaction.amount).toLocaleString()}</div>
          
          <div><strong>Status:</strong></div>
          <div>${transaction.status}</div>
          
          <div><strong>Created:</strong></div>
          <div>${isClient ? new Date(transaction.created_at).toLocaleString() : transaction.created_at}</div>
        </div>
    `;

    // Add additional fields if available
    if (transaction.description) {
      detailsHtml += `
        <div class="border-t pt-2">
          <div><strong>Description:</strong></div>
          <div>${transaction.description}</div>
        </div>
      `;
    }

    if (transaction.phone_number) {
      detailsHtml += `
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Phone Number:</strong></div>
          <div>${transaction.phone_number}</div>
        </div>
      `;
    }

    if (transaction.network) {
      detailsHtml += `
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Network:</strong></div>
          <div>${transaction.network}</div>
        </div>
      `;
    }

    if (transaction.channel) {
      detailsHtml += `
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Channel:</strong></div>
          <div>${transaction.channel}</div>
        </div>
      `;
    }

    // Add fraud detection alerts
    const fraudAlerts = detectFraudAlerts(transaction);
    if (fraudAlerts.length > 0) {
      detailsHtml += `
        <div class="border-t pt-2">
          <div class="flex items-center space-x-2 text-red-600">
            <span class="font-semibold">⚠️ Fraud Alerts:</span>
          </div>
          <ul class="list-disc list-inside text-sm text-red-600 mt-1">
            ${fraudAlerts.map(alert => `<li>${alert}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    detailsHtml += `</div>`;

    await Swal.fire({
      title: `Transaction Details`,
      html: detailsHtml,
      width: 600,
      confirmButtonColor: "#3b82f6",
    });
  };

  // ---------- Fraud Detection ----------
  const detectFraudAlerts = (transaction: any) => {
    const alerts = [];
    const amount = Number(transaction.amount);

    // High amount alert
    if (amount > 1000000) { // 1 million Naira
      alerts.push(`High transaction amount: ₦${amount.toLocaleString()}`);
    }

    // Failed but high amount
    if (transaction.status === "failed" && amount > 500000) {
      alerts.push(`Failed high-value transaction: ₦${amount.toLocaleString()}`);
    }

    // Multiple rapid transactions (this would need additional context)
    if (transaction.type === "transfer" && amount > 200000) {
      alerts.push(`Large transfer transaction`);
    }

    // Unusual transaction type patterns
    const unusualTypes = ["reversal", "chargeback", "refund"];
    if (unusualTypes.includes(transaction.type)) {
      alerts.push(`Unusual transaction type: ${transaction.type}`);
    }

    return alerts;
  };

  // ---------- Retry Failed Transaction ----------
  const handleRetryTransaction = async (transaction: any) => {
    if (transaction.status !== "failed") {
      Swal.fire("Info", "Only failed transactions can be retried", "info");
      return;
    }

    const result = await Swal.fire({
      title: 'Retry Transaction?',
      text: `Retry this failed transaction (${transaction.reference})?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Retry',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      // This would call your transaction retry API
      const r = await fetch(`/api/admin-apis/transactions/${transaction.id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!r.ok) throw new Error("Retry failed");

      Swal.fire({
        icon: "success",
        title: "Retry Initiated",
        text: "Transaction retry has been initiated",
        timer: 2000,
        showConfirmButton: false,
      });
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to retry transaction", "error");
    }
  };

  // Custom cell renderers
  const renderAmountCell = (value: number, row: any) => {
    const amount = Number(value);
    const isPositive = ["deposit", "credit", "refund"].includes(row.type);
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    const symbol = isPositive ? "+" : "-";
    
    return (
      <span className={`font-semibold ${colorClass}`}>
        {symbol}₦{Math.abs(amount).toLocaleString()}
      </span>
    );
  };

  const renderStatusCell = (value: string) => {
    const statusConfig: any = {
      success: { color: "bg-green-100 text-green-800", text: "✓ Success" },
      failed: { color: "bg-red-100 text-red-800", text: "✗ Failed" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "⏳ Pending" },
      processing: { color: "bg-blue-100 text-blue-800", text: "🔄 Processing" }
    };

    const config = statusConfig[value] || { color: "bg-gray-100 text-gray-800", text: value };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderTypeCell = (value: string) => {
    const typeConfig: any = {
      deposit: { color: "bg-green-100 text-green-800", emoji: "📥" },
      withdrawal: { color: "bg-red-100 text-red-800", emoji: "📤" },
      transfer: { color: "bg-blue-100 text-blue-800", emoji: "🔄" },
      airtime: { color: "bg-purple-100 text-purple-800", emoji: "📞" },
      electricity: { color: "bg-orange-100 text-orange-800", emoji: "💡" },
      data: { color: "bg-indigo-100 text-indigo-800", emoji: "📶" },
      cable: { color: "bg-pink-100 text-pink-800", emoji: "📺" }
    };

    const config = typeConfig[value] || { color: "bg-gray-100 text-gray-800", emoji: "💳" };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.emoji} {value}
      </span>
    );
  };

  const renderDateCell = (value: string) => {
    if (!isClient) {
      return value || "-";
    }
    
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

  const renderReferenceCell = (value: string) => {
    if (!value) return <span className="text-gray-400 italic">No reference</span>;
    return <span className="font-mono text-sm">{value}</span>;
  };

  // Define columns with render functions
  const columns = [
    { key: "reference", label: "Reference", render: renderReferenceCell },
    { key: "user_id", label: "User ID" },
    { key: "type", label: "Type", render: renderTypeCell },
    { key: "amount", label: "Amount", render: renderAmountCell },
    { key: "fee", label: "Fee" },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "description", label: "Description" },
    { key: "created_at", label: "Created", render: renderDateCell },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Transactions Management</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportCSV}>
              📊 Export CSV
            </Button>
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Volume</h3>
            <p className="text-2xl font-semibold">₦{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Fees</h3>
            <p className="text-2xl font-semibold text-orange-600">
              ₦{totalFee.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Successful</h3>
            <p className="text-2xl font-semibold text-green-600">
              {successfulTransactions.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Failed</h3>
            <p className="text-2xl font-semibold text-red-600">
              {failedTransactions.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-2xl font-semibold text-yellow-600">
              {pendingTransactions.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by reference, user ID, description..."
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
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Transfer</SelectItem>
                {/* <SelectItem value="transfer">Transfer</SelectItem> */}
                <SelectItem value="airtime">Airtime</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="cable">Cable TV</SelectItem>
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
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
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
                setTypeFilter("all");
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
          Showing {transactions.length} of {totalTransactions} transactions
          {searchTerm && ` matching "${searchTerm}"`}
          {typeFilter !== 'all' && ` | Type: ${typeFilter}`}
          {statusFilter !== 'all' && ` | Status: ${statusFilter}`}
          {dateRange !== "total" && ` | Date: ${dateRange}`}
          {` - Page ${currentPage} of ${totalPages}`}
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          rows={transactions}
          onViewDetails={handleViewDetails}
          onRetryTransaction={handleRetryTransaction}
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