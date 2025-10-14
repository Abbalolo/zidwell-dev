"use client";

import { useEffect, useMemo, useState } from "react";
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
import AdminLayout from "../components/admin-components/layout";
import KPICard from "../components/admin-components/KPICard";
import Loader from "../components/Loader";

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
    return (localStorage.getItem("admin_dashboard_range") as RangeOption) || "total";
  });

  useEffect(() => {
    localStorage.setItem("admin_dashboard_range", range);
    // reset to page 1 when range changes
    setPage(1);
  }, [range]);

  // data hooks
  const { data: paginatedData, error: paginatedError } = useSWR<any>(
    `/api/admin-apis/transactions?page=${page}&range=${range}`,
    fetcher
  );

  const { data: summaryData, error: summaryError } = useSWR<any>(
    `/api/admin-apis/transactions/summary?range=${range}`,
    fetcher
  );

  useEffect(() => {
    if (paginatedError) console.error("Paginated transactions error:", paginatedError);
    if (summaryError) console.error("Summary error:", summaryError);
  }, [paginatedError, summaryError]);

  const transactions = paginatedData?.transactions ?? [];

  const totalTransactions = summaryData?.totalTransactions ?? 0;
  const totalInflow = summaryData?.totalInflow ?? 0;
  const totalOutflow = summaryData?.totalOutflow ?? 0;
  const totalUsers = summaryData?.totalUsers ?? 0;
  const totalWalletBalance = summaryData?.walletBalance ?? 0;
  const adminNombaBalance = summaryData?.nombaBalance ?? 0;
  const monthlyTransactions = summaryData?.monthlyTransactions ?? [];
  const monthlyUsers = summaryData?.monthlyUsers ?? [];

  const recentActivity = transactions.slice(0, 5);

  const hasNextPage = transactions.length === PAGE_LIMIT;
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
    await mutate(`/api/admin-apis/transactions?page=${page}&range=${range}`);
    await mutate(`/api/admin-apis/transactions/summary?range=${range}`);
  };

  const loading = !paginatedData || !summaryData;

  const fmtCurrency = (n: number) =>
    `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold">📊 Admin Dashboard</h2>
            <div className="mt-1 text-sm text-gray-500">Range: {range === "total" ? "All time" : range}</div>
          </div>

          {/* Top-right controls: filter dropdown + refresh + page indicator */}
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="range-select">Filter range</label>
            <select
              id="range-select"
              value={range}
              onChange={(e) => setRange(e.target.value as RangeOption)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="total">Total</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <button
              onClick={refresh}
              className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
            >
              Refresh
            </button>

            <div className="text-sm text-gray-500">Page: {page}</div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Total Users" value={totalUsers} />
          <KPICard title="Total Transactions" value={totalTransactions} />
          <KPICard title="Total Wallet Balance" value={fmtCurrency(totalWalletBalance)} />
          <KPICard title="Admin Wallet (Nomba)" value={fmtCurrency(adminNombaBalance)} />
        </div>

        {/* Inflow/Outflow Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-1">Total Inflow</h3>
            <div className="text-2xl font-bold">{fmtCurrency(totalInflow)}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-1">Total Outflow</h3>
            <div className="text-2xl font-bold">{fmtCurrency(totalOutflow)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">📈 Transactions Trend</h3>
              <div className="text-sm text-gray-500">Filtered: {range}</div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTransactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">👥 New Users Growth</h3>
              <div className="text-sm text-gray-500">Filtered: {range}</div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyUsers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions (paginated) */}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">🕒 Recent Transactions (paginated)</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={!hasPrevPage}
                className={`px-3 py-1 rounded-md text-sm ${!hasPrevPage ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-50 hover:bg-gray-100"}`}
              >
                Prev
              </button>
              <button
                onClick={goNext}
                disabled={!hasNextPage}
                className={`px-3 py-1 rounded-md text-sm ${!hasNextPage ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-50 hover:bg-gray-100"}`}
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
                    <div className="font-medium text-gray-800">₦{Number(tx.amount).toLocaleString()}</div>
                    <div className="text-gray-500 text-xs">{tx.type ?? "—"}</div>
                  </div>
                  <div className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleString()}</div>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-gray-500">No transactions on this page</li>
            )}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
