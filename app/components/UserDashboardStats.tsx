"use client";

import { useEffect, useState } from "react";

interface Transaction {
  amount: number | string;
  status: string;
  type: string; // ✅ Added transaction type
}

interface Stats {
  totalInflow: number;
  totalOutflow: number;
  successRate: number;
}

export default function UserDashboardStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats>({
    totalInflow: 0,
    totalOutflow: 0,
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
        setStats({ totalInflow: 0, totalOutflow: 0, successRate: 0 });
      }
    };

    fetchTransactions();
  }, [userId]);

  return (
    <div className="grid grid-cols-3 gap-5">
      <div>
        <p className="md:text-2xl text-lg font-bold text-gray-900">
          ₦{stats.totalInflow.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">Total Inflow</p>
      </div>
      <div>
        <p className="md:text-2xl text-lg font-bold text-gray-900">
          ₦{stats.totalOutflow.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">Total Outflow</p>
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

// ✅ Helper function for inflow/outflow
function calculateTransactionStats(transactions: Transaction[]): Stats {
  if (!transactions || transactions.length === 0) {
    return { totalInflow: 0, totalOutflow: 0, successRate: 0 };
  }

  const inflowTypes = ["deposit", "card deposit"];
  const outflowTypes = ["withdrawal", "airtime", "electricity", "cable", "data", ];

  const totalInflow = transactions
    .filter(tx => inflowTypes.includes(tx.type))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalOutflow = transactions
    .filter(tx => outflowTypes.includes(tx.type))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const successfulPayments = transactions.filter(tx => tx.status === "success").length;
  const successRate = Number(((successfulPayments / transactions.length) * 100).toFixed(2));

  return { totalInflow, totalOutflow, successRate };
}
