"use client";

import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import KPICard from "../components/admin-components/KPICard";
import Loader from "../components/Loader";
import AdminLayout from "../components/admin-components/layout";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminHome() {
  const { data } = useSWR("/api/admin-apis/overview", fetcher);

  if (!data) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  // Example mock analytics data (replace with API data later)
  const transactionTrends = [
    { month: "Jan", transactions: 240 },
    { month: "Feb", transactions: 310 },
    { month: "Mar", transactions: 480 },
    { month: "Apr", transactions: 650 },
    { month: "May", transactions: 820 },
    { month: "Jun", transactions: 900 },
    { month: "Jul", transactions: 740 },
    { month: "Aug", transactions: 980 },
    { month: "Sep", transactions: 1200 },
  ];

  const newUsersData = [
    { month: "Jan", users: 40 },
    { month: "Feb", users: 70 },
    { month: "Mar", users: 100 },
    { month: "Apr", users: 130 },
    { month: "May", users: 190 },
    { month: "Jun", users: 210 },
    { month: "Jul", users: 170 },
    { month: "Aug", users: 220 },
    { month: "Sep", users: 310 },
  ];

  const recentActivity = [
    { id: 1, action: "New user registered", time: "2 mins ago" },
    { id: 2, action: "Invoice #3245 paid", time: "15 mins ago" },
    { id: 3, action: "New contract issued", time: "1 hour ago" },
    { id: 4, action: "Withdrawal request pending", time: "3 hours ago" },
  ];

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        {/* Title */}
        <h2 className="text-3xl font-bold mb-6">📊 Admin Dashboard</h2>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <KPICard title="Users" value={data.totalUsers ?? 0} />
          <KPICard title="Transactions" value={data.totalTransactions ?? 0} />
          <KPICard title="Total Balance" value={`₦${data.totalBalance?.toLocaleString() ?? 0}`} />
          <KPICard title="Pending Withdrawals" value={data.pendingWithdrawals ?? 0} />
        </div>

        {/* ANALYTICS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Transactions Line Chart */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">📈 Transactions Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* New Users Bar Chart */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">👥 New Users Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={newUsersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-4">🕒 Recent Activity</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivity.map((item) => (
              <li key={item.id} className="py-3 flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{item.action}</span>
                <span className="text-gray-500 dark:text-gray-400">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
