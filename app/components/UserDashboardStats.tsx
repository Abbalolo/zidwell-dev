"use client";

import { useUserContextData } from "../context/userData";

export default function UserDashboardStats() {
  const {
    lifetimeBalance,
    totalOutflow,
    totalTransactions,
  } = useUserContextData();

  return (
    <div className="grid grid-cols-3 gap-5">
      <div>
        <p className="md:text-2xl text-lg font-bold text-gray-900">
          ₦{lifetimeBalance.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">Total Inflow</p>
      </div>
      <div>
        <p className="md:text-2xl text-lg font-bold text-gray-900">
          ₦{totalOutflow.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">Total Outflow</p>
      </div>
      <div>
        <p className="md:text-2xl text-lg font-bold text-gray-900">
          {totalTransactions}
        </p>
        <p className="text-sm text-gray-600">Total Transactions</p>
      </div>
    </div>
  );
}
