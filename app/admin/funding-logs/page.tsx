"use client";

import useSWR from "swr";
import { useState, useMemo, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "test-admin-key",
    },
  }).then((r) => r.json());

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function FundingLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const itemsPerPage = 20;

  // Use debounced search term with 1s delay
  const debouncedSearch = useDebounce(searchTerm, 1000);

  // Update the actual search term used in API calls when debounced value changes
  useEffect(() => {
    setDebouncedSearchTerm(debouncedSearch);
  }, [debouncedSearch]);

  // Build API URL with filters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    });

    if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (dateRange !== "total") params.append("range", dateRange);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return `/api/admin-apis/wallets/funding-logs?${params.toString()}`;
  }, [
    currentPage,
    debouncedSearchTerm,
    typeFilter,
    statusFilter,
    dateRange,
    startDate,
    endDate,
    itemsPerPage,
  ]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    typeFilter,
    statusFilter,
    dateRange,
    startDate,
    endDate,
  ]);

  // Memoize calculations
  const logs = useMemo(() => data?.logs || [], [data]);
  const totalLogs = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(
    () => Math.ceil(totalLogs / itemsPerPage),
    [totalLogs, itemsPerPage]
  );

  // Calculate stats
  const totalFunding = useMemo(
    () =>
      logs
        .filter((log: any) => log.type === "funding")
        .reduce((sum: number, log: any) => sum + Number(log.amount || 0), 0),
    [logs]
  );

  const totalWithdrawals = useMemo(
    () =>
      logs
        .filter((log: any) => log.type === "withdrawal")
        .reduce((sum: number, log: any) => sum + Number(log.amount || 0), 0),
    [logs]
  );

  const successfulTransactions = useMemo(
    () => logs.filter((log: any) => log.status === "success"),
    [logs]
  );

  const failedTransactions = useMemo(
    () => logs.filter((log: any) => log.status === "failed"),
    [logs]
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  // View transaction details
  async function handleViewDetails(row: any) {
    let detailsHtml = `
      <div class="text-left space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>User Email:</strong></div>
          <div>${row.user_email || "N/A"}</div>
          
          <div><strong>Type:</strong></div>
          <div class="font-semibold ${
            row.type === "funding" ? "text-green-600" : "text-blue-600"
          }">
            ${row.type?.toUpperCase()}
          </div>
          
          <div><strong>Amount:</strong></div>
          <div class="font-bold text-lg">₦${Number(
            row.amount || 0
          ).toLocaleString()}</div>
          
          <div><strong>Gateway:</strong></div>
          <div>${row.gateway || "N/A"}</div>
          
          <div><strong>Reference:</strong></div>
          <div class="font-mono text-xs">${row.reference_id || "N/A"}</div>
          
          <div><strong>Status:</strong></div>
          <div class="${
            row.status === "success"
              ? "text-green-600"
              : row.status === "failed"
              ? "text-red-600"
              : "text-yellow-600"
          }">
            ${row.status?.toUpperCase()}
          </div>
          
          <div><strong>Date:</strong></div>
          <div>${new Date(row.created_at).toLocaleString()}</div>
        </div>
    `;

    if (row.metadata) {
      detailsHtml += `
        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 class="font-semibold mb-2">Additional Details:</h4>
          <pre class="text-xs whitespace-pre-wrap">${JSON.stringify(
            row.metadata,
            null,
            2
          )}</pre>
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
  }

  // Retry failed transaction
  async function handleRetryTransaction(row: any) {
    const result = await Swal.fire({
      title: "Retry Transaction?",
      text: `Retry this ${row.type} transaction for ₦${Number(
        row.amount || 0
      ).toLocaleString()}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Retry Transaction",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // This would call your payment gateway API to retry the transaction
        // For now, we'll just show a success message
        Swal.fire({
          icon: "success",
          title: "Transaction Retried",
          text: "The transaction has been queued for retry",
          timer: 3000,
          showConfirmButton: false,
        });

        mutate();
      } catch (err) {
        Swal.fire("Error", "Failed to retry transaction", "error");
      }
    }
  }

  // Custom cell renderers
  const renderTypeCell = (value: string) => {
    const typeConfig: any = {
      funding: {
        color: "bg-green-100 text-green-800",
        text: "💰 Funding",
        icon: "⬆️",
      },
      withdrawal: {
        color: "bg-blue-100 text-blue-800",
        text: "💳 Withdrawal",
        icon: "⬇️",
      },
    };

    const config = typeConfig[value] || {
      color: "bg-gray-100 text-gray-800",
      text: value,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  const renderAmountCell = (value: number, row: any) => {
    const amount = Number(value || 0);
    const colorClass =
      row.type === "funding" ? "text-green-600" : "text-blue-600";

    return (
      <span className={`font-semibold ${colorClass}`}>
        {row.type === "funding" ? "+" : "-"}₦{amount.toLocaleString()}
      </span>
    );
  };

  const renderStatusCell = (value: string) => {
    const statusConfig: any = {
      success: { color: "bg-green-100 text-green-800", text: "✅ Success" },
      failed: { color: "bg-red-100 text-red-800", text: "❌ Failed" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "⏳ Pending" },
      processing: { color: "bg-blue-100 text-blue-800", text: "🔄 Processing" },
    };

    const config = statusConfig[value] || {
      color: "bg-gray-100 text-gray-800",
      text: value,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const renderDateCell = (value: string) => {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value || "-";

      return (
        <span className="text-sm text-gray-600">{date.toLocaleString()}</span>
      );
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
        <div className="text-center text-red-500 mt-10">
          Failed to load funding logs.
        </div>
      </AdminLayout>
    );
  }

  const columns = [
    { key: "user_email", label: "User" },
    { key: "type", label: "Type", render: renderTypeCell },
    {
      key: "amount",
      label: "Amount",
      render: (value: number, row: any) => renderAmountCell(value, row),
    },
    { key: "gateway", label: "Gateway" },
    { key: "reference_id", label: "Reference" },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "created_at", label: "Date", render: renderDateCell },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            💳 Funding & Withdrawal Logs
          </h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Funding</h3>
            <p className="text-2xl font-semibold text-green-600">
              ₦{totalFunding.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">
              Total Withdrawals
            </h3>
            <p className="text-2xl font-semibold text-blue-600">
              ₦{totalWithdrawals.toLocaleString()}
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
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by user email or reference..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
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

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          Showing {logs.length} of {totalLogs} transactions
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
          {typeFilter !== "all" && ` | Type: ${typeFilter}`}
          {statusFilter !== "all" && ` | Status: ${statusFilter}`}
          {` - Page ${currentPage} of ${totalPages}`}
        </div>

        {/* Table - FIXED: Removed unsupported props */}
        <AdminTable
          columns={columns}
          rows={logs}
          onViewDetails={handleViewDetails}
          onEdit={(row) =>
            row.status === "failed" && handleRetryTransaction(row)
          }
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
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
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
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
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
