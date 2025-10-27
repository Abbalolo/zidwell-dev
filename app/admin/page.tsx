"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

import AdminLayout from "../components/admin-components/layout";
import KPICard from "../components/admin-components/KPICard";
import { Skeleton } from "../components/ui/skeleton";

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(text || `Request failed: ${r.status}`);
    }
    return r.json();
  });

type RangeOption = "total" | "today" | "week" | "month" | "year";

export default function AdminDashboard() {
  const [page, setPage] = useState<number>(1);
  const PAGE_LIMIT = 50;

  // persist range selection in localStorage
  const [range, setRange] = useState<RangeOption>(() => {
    if (typeof window === "undefined") return "total";
    return (
      (localStorage.getItem("admin_dashboard_range") as RangeOption) || "total"
    );
  });

  useEffect(() => {
    localStorage.setItem("admin_dashboard_range", range);
    setPage(1);
  }, [range]);

  // summary (new consolidated endpoint)
  const { data: summaryData, error: summaryError } = useSWR<any>(
    `/api/admin-apis/dashboard/summary?range=${range}`,
    fetcher
  );

  // paginated transactions (fallback / existing)
  const { data: paginatedData, error: paginatedError } = useSWR<any>(
    `/api/admin-apis/transactions?page=${page}&range=${range}`,
    fetcher
  );

  useEffect(() => {
    if (paginatedError)
      console.error("Paginated transactions error:", paginatedError);
    if (summaryError) console.error("Summary error:", summaryError);
  }, [paginatedError, summaryError]);

  // map summary fields (defaults to zero)
  const totalInflow = Number(summaryData?.totalInflow ?? 0);
  const totalOutflow = Number(summaryData?.totalOutflow ?? 0);
  const mainWalletBalance = Number(summaryData?.mainWalletBalance ?? 0);
  const nombaBalanceRaw = Number(summaryData?.nombaBalance ?? 0);

  const totalContracts = Number(summaryData?.totalContractsIssued ?? 0);
  const pendingContracts = Number(summaryData?.pendingContracts ?? 0);
  const signedContracts = Number(summaryData?.signedContracts ?? 0);

  const totalInvoices = Number(summaryData?.totalInvoices ?? 0);
  const paidInvoices = Number(summaryData?.paidInvoices ?? 0);
  const unpaidInvoices = Number(summaryData?.unpaidInvoices ?? 0);

  const monthlyTransactions = summaryData?.monthlyTransactions ?? [];
  const monthlyInvoices = summaryData?.monthlyInvoices ?? [];
  const monthlyContracts = summaryData?.monthlyContracts ?? [];

  // recent activity: prefer latestTransactions from summary, fallback to paginated list
  const latestFromSummary = summaryData?.latestTransactions ?? null;
  const paginatedTransactions = paginatedData?.transactions ?? [];
  const recentActivity =
    latestFromSummary && latestFromSummary.length > 0
      ? latestFromSummary
      : paginatedTransactions.slice(0, 5);

  const hasNextPage = paginatedTransactions.length === PAGE_LIMIT;
  const hasPrevPage = page > 1;

  const goNext = () => {
    if (!hasNextPage) return;
    setPage((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    if (!hasPrevPage) return;
    setPage((p) => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = async () => {
    await mutate(`/api/admin-apis/dashboard/summary?range=${range}`);
    await mutate(`/api/admin-apis/transactions?page=${page}&range=${range}`);
  };

  const loading = !summaryData || !paginatedData;

  const formatCurrency = (value: number | string) => {
    const n = Number(value || 0);
    return n.toLocaleString("en-NG", { style: "currency", currency: "NGN" });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 space-y-8">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <Skeleton className="h-6 w-56 mb-4" />
            <div className="space-y-3">
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            <div className="mt-1 text-sm text-gray-500">
              Range: {range === "total" ? "All time" : range}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 mb-1">Filter Range</label>
            <Select
              value={range}
              onValueChange={(val: RangeOption) => setRange(val)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Total</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={refresh}
              className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
            >
              Refresh
            </button>

            <div className="text-sm text-gray-500">Page: {page}</div>
          </div>
        </div>

        {/* KPI Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Total Inflow" value={formatCurrency(totalInflow)} />
          <KPICard title="Total Outflow" value={formatCurrency(totalOutflow)} />
          <KPICard
            title="Main Wallet Balance"
            value={formatCurrency(mainWalletBalance)}
          />
          <KPICard
            title="Admin Wallet (Nomba)"
            value={formatCurrency(nombaBalanceRaw)}
          />
        </div>

        {/* KPI Row 2 – Contracts & Invoices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Total Contracts" value={totalContracts} />
          <KPICard title="Pending Contracts" value={pendingContracts} />
          <KPICard title="Signed Contracts" value={signedContracts} />
          <KPICard title="Total Invoices" value={totalInvoices} />
        </div>

        {/* KPI Row 3 – Invoice statuses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Paid Invoices" value={paidInvoices} />
          <KPICard title="Unpaid Invoices" value={unpaidInvoices} />
          <div /> {/* empty slots to keep layout even */}
          <div />
        </div>

        {/* Inflow/Outflow Row (big) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-1">Total Inflow</h3>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInflow)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-1">Total Outflow</h3>
            <div className="text-2xl font-bold">
              {formatCurrency(totalOutflow)}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">📈 Transactions Trend</h3>
              <div className="text-sm text-gray-500">Filtered: {range}</div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyTransactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => {
                    const v = Array.isArray(value) ? value[0] : value;

                    if (typeof v === "number") {
                      return formatCurrency(v);
                    }

                    return v;
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">🧾 Invoices (monthly)</h3>
              <div className="text-sm text-gray-500">Filtered: {range}</div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyInvoices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => {
                    const v = Array.isArray(value) ? value[0] : value;

                    if (typeof v === "number") {
                      return formatCurrency(v);
                    }

                    return v;
                  }}
                />

                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">📄 Contracts (monthly)</h3>
              <div className="text-sm text-gray-500">Filtered: {range}</div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyContracts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions (paginated / latest) */}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">🕒 Recent Transactions</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={!hasPrevPage}
                className={`px-3 py-1 rounded-md text-sm ${
                  !hasPrevPage
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                Prev
              </button>
              <button
                onClick={goNext}
                disabled={!hasNextPage}
                className={`px-3 py-1 rounded-md text-sm ${
                  !hasNextPage
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                Next
              </button>
            </div>
          </div>

          <ul className="divide-y divide-gray-200">
            {recentActivity.length > 0 ? (
              recentActivity.map((tx: any) => (
                <li key={tx.id} className="py-3 flex justify-between text-sm">
                  <div>
                    <div className="font-medium text-gray-800">
                      {formatCurrency(tx.amount)}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {tx.type ?? "—"}{" "}
                      {tx.description ? `— ${tx.description}` : ""}
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(tx.created_at).toLocaleString()}
                  </div>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-gray-500">
                No transactions on this page
              </li>
            )}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
