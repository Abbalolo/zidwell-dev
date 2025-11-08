"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Badge } from "@/app/components/ui/badge";

// Updated fetcher with admin authentication header
const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "test-admin-key",
    },
  }).then((r) => r.json());

// Helper function for authenticated POST requests
const authFetch = (url: string, options: any = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "test-admin-key",
      ...options.headers,
    },
  });
};

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

export default function WalletManagementPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cacheStatus, setCacheStatus] = useState<{
    [key: string]: { isCached: boolean; lastUpdated?: Date };
  }>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const itemsPerPage = 10;

  // Use debounced search term with 1s delay
  const debouncedSearch = useDebounce(searchTerm, 1000);

  // Update the actual search term used in API calls when debounced value changes
  useEffect(() => {
    setDebouncedSearchTerm(debouncedSearch);
  }, [debouncedSearch]);

  // Build API URL with all filters for server-side filtering
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      range: dateRange,
    });

    if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
    if (balanceFilter !== "all") params.append("balance", balanceFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return `/api/admin-apis/wallets?${params.toString()}`;
  }, [
    currentPage,
    dateRange,
    debouncedSearchTerm,
    balanceFilter,
    startDate,
    endDate,
    itemsPerPage,
  ]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Separate hook for stats (all filtered data without pagination)
  const statsApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      range: dateRange,
      limit: "10000",
    });

    if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
    if (balanceFilter !== "all") params.append("balance", balanceFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return `/api/admin-apis/wallets?${params.toString()}`;
  }, [dateRange, debouncedSearchTerm, balanceFilter, startDate, endDate]);

  const { data: statsData } = useSWR(statsApiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, balanceFilter, dateRange, startDate, endDate]);

  // Update cache status when data loads
  useEffect(() => {
    if (data) {
      setCacheStatus((prev) => ({
        ...prev,
        wallets: { isCached: true, lastUpdated: new Date() },
      }));
    }
  }, [data]);

  useEffect(() => {
    if (statsData) {
      setCacheStatus((prev) => ({
        ...prev,
        stats: { isCached: true, lastUpdated: new Date() },
      }));
    }
  }, [statsData]);

  // Memoize calculations
  const wallets = useMemo(() => data?.wallets || [], [data]);
  const totalWallets = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(
    () => Math.ceil(totalWallets / itemsPerPage),
    [totalWallets, itemsPerPage]
  );

  // Use statsData for calculations
  const allFilteredWallets = useMemo(
    () => statsData?.wallets || [],
    [statsData]
  );

  // Calculate stats
  const totalSystemBalance = useMemo(
    () =>
      allFilteredWallets.reduce(
        (sum: number, w: any) => sum + Number(w.balance || 0),
        0
      ),
    [allFilteredWallets]
  );

  const highBalanceWallets = useMemo(
    () =>
      allFilteredWallets.filter((w: any) => Number(w.balance || 0) >= 10000),
    [allFilteredWallets]
  );

  const lowBalanceWallets = useMemo(
    () => allFilteredWallets.filter((w: any) => Number(w.balance || 0) < 1000),
    [allFilteredWallets]
  );

  const zeroBalanceWallets = useMemo(
    () => allFilteredWallets.filter((w: any) => Number(w.balance || 0) === 0),
    [allFilteredWallets]
  );

  const activeWallets = useMemo(
    () =>
      allFilteredWallets.filter(
        (w: any) =>
          new Date(w.last_updated) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ),
    [allFilteredWallets]
  );

  // Enhanced refresh function that clears cache
  const handleRefresh = async () => {
    // Clear cache by making a POST request to clear cache endpoint
    try {
      await authFetch("/api/admin-apis/wallets", {
        method: "POST",
      });
    } catch (error) {
      console.log("Cache clearance not implemented or failed");
    }

    // Force revalidation
    mutate();
    setLastRefresh(new Date());
    setCacheStatus({});
  };

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  // ✅ Manual credit/debit operation
  async function handleCreditDebit(row: any, type: "credit" | "debit") {
    const { value: formValues } = await Swal.fire({
      title: `${type === "credit" ? "Credit" : "Debit"} Wallet`,
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">User</label>
            <input 
              id="swal-user" 
              class="swal2-input" 
              value="${row.email}" 
              disabled
              style="color: #6b7280; background-color: #f9fafb;"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              id="swal-name" 
              class="swal2-input" 
              value="${row.name || ""} ${row.last_name || ""}" 
              disabled
              style="color: #6b7280; background-color: #f9fafb;"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
            <input 
              id="swal-bank" 
              class="swal2-input" 
              value="${row.bank_account_name || "N/A"} - ${
        row.bank_account_number || "N/A"
      }" 
              disabled
              style="color: #6b7280; background-color: #f9fafb;"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
            <input 
              id="swal-balance" 
              class="swal2-input" 
              value="₦${Number(row.balance || 0).toLocaleString()}" 
              disabled
              style="color: #6b7280; background-color: #f9fafb;"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input 
              id="swal-amount" 
              class="swal2-input" 
              type="number" 
              min="0.01" 
              step="0.01" 
              placeholder="Enter amount"
              required
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea 
              id="swal-reason" 
              class="swal2-textarea" 
              placeholder="Enter reason for this transaction"
              required
              rows="3"
            ></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: `${type === "credit" ? "Credit" : "Debit"} Wallet`,
      confirmButtonColor: type === "credit" ? "#10b981" : "#ef4444",
      preConfirm: () => {
        const amount = (
          document.getElementById("swal-amount") as HTMLInputElement
        )?.value;
        const reason = (
          document.getElementById("swal-reason") as HTMLTextAreaElement
        )?.value;

        if (!amount || parseFloat(amount) <= 0) {
          Swal.showValidationMessage("Please enter a valid amount");
          return false;
        }

        if (!reason?.trim()) {
          Swal.showValidationMessage("Please enter a reason");
          return false;
        }

        if (type === "debit" && parseFloat(amount) > Number(row.balance || 0)) {
          Swal.showValidationMessage(
            "Debit amount cannot exceed current balance"
          );
          return false;
        }

        return { amount: parseFloat(amount), reason: reason.trim() };
      },
    });

    if (formValues) {
      try {
        const response = await authFetch(
          "/api/admin-apis/wallets/transaction",
          {
            method: "POST",
            body: JSON.stringify({
              userId: row.user_id,
              type: type,
              amount: formValues.amount,
              reason: formValues.reason,
              adminNote: `Manual ${type} by admin`,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Transaction failed");
        }

        const result = await response.json();

        Swal.fire({
          icon: "success",
          title: `${type === "credit" ? "Credited" : "Debited"} Successfully`,
          text: `₦${formValues.amount.toLocaleString()} ${
            type === "credit" ? "added to" : "deducted from"
          } ${row.email}'s wallet`,
          timer: 3000,
          showConfirmButton: false,
        });

        // Refresh data and clear cache after transaction
        handleRefresh();
      } catch (err: any) {
        Swal.fire(
          "Error",
          err.message || "Failed to process transaction",
          "error"
        );
      }
    }
  }

  // ✅ View transaction logs
  async function handleViewLogs(row: any) {
    try {
      const response = await authFetch(
        `/api/admin-apis/wallets/transactions?userId=${row.user_id}&limit=20`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const { transactions } = await response.json();

      let logsHtml = `
        <div class="text-left">
          <div class="mb-4 p-3 bg-blue-50 rounded-lg">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><strong>User:</strong> ${row.email}</div>
              <div><strong>Full Name:</strong> ${row.name || ""} ${
        row.last_name || ""
      }</div>
              <div><strong>Bank Account:</strong> ${
                row.bank_account_name || "N/A"
              }</div>
              <div><strong>Account Number:</strong> ${
                row.bank_account_number || "N/A"
              }</div>
              <div><strong>Current Balance:</strong></div>
              <div class="font-semibold">₦${Number(
                row.balance || 0
              ).toLocaleString()}</div>
            </div>
          </div>
          <div class="max-h-96 overflow-y-auto">
      `;

      if (transactions?.length > 0) {
        logsHtml += `
          <table class="w-full text-sm">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="text-left p-2 border-b">Date</th>
                <th class="text-left p-2 border-b">Type</th>
                <th class="text-left p-2 border-b">Amount</th>
                <th class="text-left p-2 border-b">Reason</th>
                <th class="text-left p-2 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
        `;

        transactions.forEach((tx: any) => {
          const typeColor =
            tx.type === "credit" ? "text-green-600" : "text-red-600";
          const statusColor =
            tx.status === "completed"
              ? "text-green-600"
              : tx.status === "failed"
              ? "text-red-600"
              : "text-yellow-600";

          logsHtml += `
            <tr class="border-b hover:bg-gray-50">
              <td class="p-2">${new Date(tx.created_at).toLocaleString()}</td>
              <td class="p-2 ${typeColor} font-medium">${tx.type.toUpperCase()}</td>
              <td class="p-2 font-semibold">₦${Number(
                tx.amount || 0
              ).toLocaleString()}</td>
              <td class="p-2 text-xs">${tx.reason || "N/A"}</td>
              <td class="p-2 ${statusColor} text-xs">${tx.status}</td>
            </tr>
          `;
        });

        logsHtml += `</tbody></table>`;
      } else {
        logsHtml += `<div class="text-center text-gray-500 py-8">No transactions found</div>`;
      }

      logsHtml += `</div></div>`;

      await Swal.fire({
        title: `Transaction History - ${row.email}`,
        html: logsHtml,
        width: 800,
        confirmButtonColor: "#3b82f6",
      });
    } catch (err) {
      Swal.fire("Error", "Failed to load transaction history", "error");
    }
  }

  // ✅ View user details
  async function handleViewUserDetails(row: any) {
    let detailsHtml = `
      <div class="text-left space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>User ID:</strong></div>
          <div class="font-mono text-xs">${row.user_id}</div>
          
          <div><strong>Email:</strong></div>
          <div>${row.email}</div>
          
          <div><strong>Full Name:</strong></div>
          <div>${row.name || ""} ${row.last_name || ""}</div>
          
          <div><strong>Bank Account Name:</strong></div>
          <div>${row.bank_account_name || "N/A"}</div>
          
          <div><strong>Bank Account Number:</strong></div>
          <div class="font-mono">${row.bank_account_number || "N/A"}</div>
          
          <div><strong>Current Balance:</strong></div>
          <div class="font-bold text-lg text-green-600">₦${Number(
            row.balance || 0
          ).toLocaleString()}</div>
          
          <div><strong>Last Updated:</strong></div>
          <div>${new Date(row.last_updated).toLocaleString()}</div>
          
          <div><strong>Account Created:</strong></div>
          <div>${new Date(row.created_at).toLocaleString()}</div>
        </div>
      </div>
    `;

    await Swal.fire({
      title: `User Details - ${row.email}`,
      html: detailsHtml,
      width: 600,
      confirmButtonColor: "#3b82f6",
    });
  }

  // ✅ View funding and withdrawal logs
  async function handleViewFundingLogs() {
    try {
      const response = await authFetch(
        "/api/admin-apis/wallets/funding-logs?limit=50"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch funding logs");
      }

      const { logs } = await response.json();

      let logsHtml = `
        <div class="text-left max-h-96 overflow-y-auto">
          <div class="mb-4 flex justify-between items-center">
            <h3 class="font-semibold">Recent Funding & Withdrawal Logs</h3>
            <span class="text-sm text-gray-500">Last 50 transactions</span>
          </div>
      `;

      if (logs?.length > 0) {
        logsHtml += `
          <table class="w-full text-sm">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="text-left p-2 border-b">User</th>
                <th class="text-left p-2 border-b">Type</th>
                <th class="text-left p-2 border-b">Amount</th>
                <th class="text-left p-2 border-b">Gateway</th>
                <th class="text-left p-2 border-b">Reference</th>
                <th class="text-left p-2 border-b">Status</th>
                <th class="text-left p-2 border-b">Date</th>
              </tr>
            </thead>
            <tbody>
        `;

        logs.forEach((log: any) => {
          const typeColor =
            log.type === "funding" ? "text-green-600" : "text-blue-600";
          const statusColor =
            log.status === "success"
              ? "text-green-600"
              : log.status === "failed"
              ? "text-red-600"
              : "text-yellow-600";

          logsHtml += `
            <tr class="border-b hover:bg-gray-50">
              <td class="p-2 text-xs">${log.user_email}</td>
              <td class="p-2 ${typeColor} font-medium">${log.type}</td>
              <td class="p-2 font-semibold">₦${Number(
                log.amount || 0
              ).toLocaleString()}</td>
              <td class="p-2 text-xs">${log.gateway || "N/A"}</td>
              <td class="p-2 text-xs font-mono">${
                log.reference_id || "N/A"
              }</td>
              <td class="p-2 ${statusColor} text-xs">${log.status}</td>
              <td class="p-2 text-xs">${new Date(
                log.created_at
              ).toLocaleString()}</td>
            </tr>
          `;
        });

        logsHtml += `</tbody></table>`;
      } else {
        logsHtml += `<div class="text-center text-gray-500 py-8">No funding logs found</div>`;
      }

      logsHtml += `</div>`;

      await Swal.fire({
        title: `Funding & Withdrawal Logs`,
        html: logsHtml,
        width: 1000,
        confirmButtonColor: "#3b82f6",
      });
    } catch (err) {
      Swal.fire("Error", "Failed to load funding logs", "error");
    }
  }

  // ✅ Run reconciliation
  async function handleReconcile() {
    const result = await Swal.fire({
      title: "Run Reconciliation?",
      text: "This will reconcile system wallet balances with payment gateway records",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Run Reconciliation",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await authFetch("/api/admin-apis/wallets/reconcile", {
          method: "POST",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Reconciliation failed");
        }

        const result = await response.json();

        if (result.discrepancies && result.discrepancies.length > 0) {
          let discrepanciesHtml = `
            <div class="text-left">
              <div class="mb-4 p-3 bg-yellow-50 rounded-lg">
                <strong>Found ${result.discrepanciesFound} discrepancies</strong>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="text-left p-2 border-b">User</th>
                      <th class="text-left p-2 border-b">System Balance</th>
                      <th class="text-left p-2 border-b">Gateway Balance</th>
                      <th class="text-left p-2 border-b">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
          `;

          result.discrepancies.forEach((disc: any) => {
            discrepanciesHtml += `
              <tr class="border-b">
                <td class="p-2">${disc.user_email}</td>
                <td class="p-2">₦${Number(
                  disc.system_balance || 0
                ).toLocaleString()}</td>
                <td class="p-2">₦${Number(
                  disc.gateway_balance || 0
                ).toLocaleString()}</td>
                <td class="p-2 font-semibold ${
                  disc.difference > 0 ? "text-green-600" : "text-red-600"
                }">
                  ₦${Math.abs(disc.difference).toLocaleString()}
                </td>
              </tr>
            `;
          });

          discrepanciesHtml += `</tbody></table></div></div>`;

          await Swal.fire({
            title: "Reconciliation Complete",
            html: discrepanciesHtml,
            width: 800,
            confirmButtonColor: "#3b82f6",
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Reconciliation Complete",
            text: "No discrepancies found! All balances are synchronized.",
            timer: 3000,
            showConfirmButton: false,
          });
        }

        // Refresh data after reconciliation
        handleRefresh();
      } catch (err: any) {
        Swal.fire(
          "Error",
          err.message || "Failed to run reconciliation",
          "error"
        );
      }
    }
  }

  // Custom cell renderers
  const renderBalanceCell = (value: number) => {
    const amount = Number(value || 0);
    let colorClass = "text-gray-600";

    if (amount >= 10000) colorClass = "text-green-600 font-bold";
    else if (amount >= 1000) colorClass = "text-blue-600 font-semibold";
    else if (amount > 0) colorClass = "text-orange-600";
    else colorClass = "text-gray-400";

    return <span className={colorClass}>₦{amount.toLocaleString()}</span>;
  };

  const renderDateCell = (value: string) => {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value || "-";

      const now = new Date();
      const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      const formattedDate = date.toLocaleDateString();

      if (daysDiff < 1) {
        return (
          <span className="text-green-600 font-medium">{formattedDate}</span>
        );
      } else if (daysDiff < 7) {
        return <span className="text-blue-600">{formattedDate}</span>;
      } else {
        return <span className="text-gray-500">{formattedDate}</span>;
      }
    } catch (error) {
      return value || "-";
    }
  };

  const renderUserCell = (value: string, row: any) => {
    const fullName = `${row.name || ""} ${row.last_name || ""}`.trim();
    return (
      <div className="space-y-1">
        <div className="font-medium">{value}</div>
        {fullName && <div className="text-xs text-gray-500">{fullName}</div>}
      </div>
    );
  };

  const renderBankCell = (value: string, row: any) => {
    return (
      <div className="space-y-1">
        <div className="text-sm">{row.bank_account_name || "N/A"}</div>
        <div className="text-xs font-mono text-gray-500">
          {row.bank_account_number || "N/A"}
        </div>
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
        <div className="text-center text-red-500 mt-10">
          Failed to load wallet data.
        </div>
      </AdminLayout>
    );
  }

  const columns = [
    { key: "email", label: "User Email", render: renderUserCell },
    { key: "bank_account_name", label: "Bank Details", render: renderBankCell },
    { key: "balance", label: "Balance", render: renderBalanceCell },
    { key: "last_updated", label: "Account Created", render: renderDateCell },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold">💰 Wallet Management</h2>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleViewFundingLogs}>
              📊 Funding Logs
            </Button>
            <Button variant="outline" onClick={handleReconcile}>
              🔄 Reconcile
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Last Refresh Time */}
        <div className="text-sm text-gray-500">
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Total System Balance
              </h3>
            </div>
            <p className="text-2xl font-semibold text-green-600">
              ₦{totalSystemBalance.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">
              High Balance (₦10k+)
            </h3>
            <p className="text-2xl font-semibold text-blue-600">
              {highBalanceWallets.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">
              Low Balance (&lt;₦1k)
            </h3>
            <p className="text-2xl font-semibold text-orange-600">
              {lowBalanceWallets.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Zero Balance</h3>
            <p className="text-2xl font-semibold text-gray-600">
              {zeroBalanceWallets.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">
              Active (30 days)
            </h3>
            <p className="text-2xl font-semibold text-green-600">
              {activeWallets.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by user email, name, or bank details..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div>
            <Select value={balanceFilter} onValueChange={setBalanceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Balances" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Balances</SelectItem>
                <SelectItem value="high">High (₦10k+)</SelectItem>
                <SelectItem value="medium">Medium (₦1k-10k)</SelectItem>
                <SelectItem value="low">Low (&lt;₦1k)</SelectItem>
                <SelectItem value="zero">Zero Balance</SelectItem>
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
                setBalanceFilter("all");
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
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
          Showing {wallets.length} of {totalWallets} wallets
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
          {balanceFilter !== "all" && ` | Balance: ${balanceFilter}`}
          {dateRange !== "total" && ` | Date: ${dateRange}`}
          {` - Page ${currentPage} of ${totalPages}`}
        </div>

        <AdminTable
          columns={columns}
          rows={wallets}
          onEdit={(row) => handleCreditDebit(row, "credit")}
          onDelete={(row) => handleCreditDebit(row, "debit")}
          onViewDetails={handleViewUserDetails}
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
