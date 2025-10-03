"use client";
import { useEffect, useState } from "react";
import { Check, ChevronDown, Clock, Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { useUserContextData } from "../context/userData";
import Loader from "./Loader";

const statusConfig: any = {
  success: { color: "text-green-600", dotColor: "bg-green-500" },
  pending: { color: "text-blue-600", dotColor: "bg-blue-500" },
  failed: { color: "text-red-600", dotColor: "bg-red-500" },
};

export default function TransactionHistory() {
  const [filter, setFilter] = useState("All transactions");
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useUserContextData();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData?.id) return;

      setLoading(true);

      try {
        const params = new URLSearchParams({
          userId: userData.id,
          limit: "5",
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        const res = await fetch(`/api/bill-transactions?${params.toString()}`);
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userData?.id, searchTerm]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter =
      filter === "All transactions" ||
      tx.status?.toLowerCase() === filter.toLowerCase();
    return matchesFilter;
  });

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction History
          </h2>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 md:w-64 w-full"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  {filter}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("All transactions")}>
                  All transactions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("success")}>
                  Success
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("pending")}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("failed")}>
                  Failed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-4 p-3">
        {/* ✅ Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found.
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex justify-start gap-3">
                <div className="flex items-center gap-2 md:hidden">
                  {tx.status?.toLowerCase() === "success" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  ) : tx.status?.toLowerCase() === "pending" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600"
                    >
                      <Clock className="w-4 h-4 animate-pulse" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 md:text-lg">
                    {tx.description || tx.type}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {new Date(tx.created_at).toLocaleDateString()} •{" "}
                    {new Date(tx.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      statusConfig[tx.status?.toLowerCase()]?.dotColor ||
                      "bg-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      statusConfig[tx.status?.toLowerCase()]?.color ||
                      "text-gray-500"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900 md:text-lg">
                    ₦
                    {Number(tx.amount).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
