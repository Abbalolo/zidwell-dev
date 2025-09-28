"use client";

import { useEffect, useState } from "react";

interface Transaction {
  amount: number | string;
  status: string;
}

interface Stats {
  totalAmount: number;
  successfulPayments: number;
  successRate: number;
}

export default function UserDashboardStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats>({
    totalAmount: 0,
    successfulPayments: 0,
    successRate: 0,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) return;

      try {
        const params = new URLSearchParams({ userId });
        const res = await fetch(`/api/bill-transactions?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch transactions");

        const data = await res.json();
        const transactions: Transaction[] = data.transactions || [];

        const calculatedStats = calculateTransactionStats(transactions);
        setStats(calculatedStats);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setStats({ totalAmount: 0, successfulPayments: 0, successRate: 0 });
      }
    };

    fetchTransactions();
  }, [userId]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="md:text-2xl text-lg font-bold text-gray-900">
          ₦{stats.totalAmount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">Total Transactions</p>
      </div>
      <div>
        <p className="md:text-2xl text-lg font-bold text-gray-900">
          {stats.successfulPayments}
        </p>
        <p className="text-sm text-gray-600">Successful Payments</p>
      </div>
      <div>
        <p className="md:text-2xl text-lg font-bold text-gray-900">
          {stats.successRate}%
        </p>
        <p className="text-sm text-gray-600">Success Rate</p>
      </div>
    </div>
  );
}

// Helper function
function calculateTransactionStats(transactions: Transaction[]): Stats {
  if (!transactions || transactions.length === 0) {
    return { totalAmount: 0, successfulPayments: 0, successRate: 0 };
  }

  const totalAmount = transactions.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  );
  const successfulPayments = transactions.filter(tx => tx.status === "success").length;
  const successRate = Number(((successfulPayments / transactions.length) * 100).toFixed(2));

  return { totalAmount, successfulPayments, successRate };
}
