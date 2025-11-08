"use client";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  Search,
  X,
  Download,
  Eye,
} from "lucide-react";
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
import { useRouter } from "next/navigation";

const statusConfig: any = {
  success: { color: "text-green-600", dotColor: "bg-green-500" },
  pending: { color: "text-blue-600", dotColor: "bg-blue-500" },
  failed: { color: "text-red-600", dotColor: "bg-red-500" },
};

// Define transaction types that should show as positive amounts (incoming money)
const inflowTypes = [
  "deposit",
  "virtual_account_deposit",
  "card_deposit",
  "p2p_received",
  "referral",
  "referral_reward",
];

// Define transaction types that should show as negative amounts (outgoing money)
const outflowTypes = [
  "withdrawal",
  "debit",
  "airtime",
  "data",
  "electricity",
  "cable",
  "transfer",
  "p2p_transfer",
];

export default function TransactionHistory() {
  const [filter, setFilter] = useState("All transactions");
  const router = useRouter();

  const { userData, loading, transactions, searchTerm, setSearchTerm } =
    useUserContextData();

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter =
      filter === "All transactions" ||
      tx.status?.toLowerCase() === filter.toLowerCase();
    return matchesFilter;
  });

  // Function to determine if transaction amount should be negative
  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  // Function to handle viewing transaction details
  const handleViewTransaction = (transaction: any) => {
    router.push(`/dashboard/transactions/${transaction.id}`);
  };

  // Function to handle downloading receipt
  const handleDownloadReceipt = (transaction: any) => {
    const amountInfo = formatAmount(transaction);

    // Create receipt HTML content
    // Create receipt HTML content
    const receiptHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Transaction Receipt - ${
        transaction.reference || transaction.id
      }</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
        }
        .receipt-container {
          max-width: 500px;
          margin: 0 auto;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #111827;
          margin: 8px 0 4px 0;
          font-size: 24px;
        }
        .amount-section {
          text-align: center;
          margin: 20px 0;
        }
        .amount {
          font-size: 28px;
          font-weight: bold;
        }
        .section {
          margin: 20px 0;
        }
        .section-title {
          color: #374151;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .details-card {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .detail-label {
          color: #6b7280;
        }
        .detail-value {
          color: #111827;
          font-weight: 500;
        }
        .footer {
          text-align: center;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          margin-top: 20px;
          color: #6b7280;
          font-size: 12px;
        }
        @media (max-width: 640px) {
          body { padding: 10px; }
          .receipt-container { padding: 16px; }
          .amount { font-size: 24px; }
          .header h1 { font-size: 20px; }
          .detail-row { flex-direction: column; gap: 4px; }
          .detail-label, .detail-value { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="header">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <h1>Transaction Receipt</h1>
          </div>
          <p style="color:#6b7280;margin:4px 0;font-size:14px;">
            Reference: ${transaction.reference || transaction.id}
          </p>
          <p style="color:#9ca3af;margin:0;font-size:12px;">
            ${new Date(
              transaction.created_at
            ).toLocaleDateString()} • ${new Date(
      transaction.created_at
    ).toLocaleTimeString()}
          </p>
        </div>

        <!-- Amount -->
        <div class="amount-section">
          <div style="color:#6b7280;font-size:14px;margin-bottom:8px;">Transaction Amount</div>
          <div class="amount" style="color:${
            transaction.status?.toLowerCase() === "success"
              ? "#059669"
              : transaction.status?.toLowerCase() === "pending"
              ? "#2563eb"
              : "#dc2626"
          };">
            ${amountInfo.display}
          </div>
          <div style="color:#6b7280;font-size:12px;margin-top:4px;">
            ${
              transaction.status?.toLowerCase() === "success"
                ? "Transaction Successful"
                : transaction.status?.toLowerCase() === "pending"
                ? "Transaction Pending"
                : "Transaction Failed"
            }
          </div>
        </div>

        <!-- Transaction Details -->
        <div class="section">
          <div class="section-title">Transaction Details</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Type</span>
              <span class="detail-value">${transaction.type || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description</span>
              <span class="detail-value">${
                transaction.description || "N/A"
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value" style="color:${
                transaction.status?.toLowerCase() === "success"
                  ? "#059669"
                  : transaction.status?.toLowerCase() === "pending"
                  ? "#2563eb"
                  : "#dc2626"
              }">${transaction.status}</span>
            </div>
          </div>
        </div>

        <!-- Sender Information -->
        <div class="section">
          <div class="section-title">Sender Information</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${
                transaction?.sender?.name || "N/A"
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account Number</span>
              <span class="detail-value">${
                transaction?.sender?.accountNumber || "N/A"
              }</span>
            </div>
            ${
              transaction?.sender?.bankName
                ? `<div class="detail-row">
                    <span class="detail-label">Bank Name</span>
                    <span class="detail-value">${transaction.sender.bankName}</span>
                  </div>`
                : ""
            }
          </div>
        </div>

        <!-- Receiver Information -->
        <div class="section">
          <div class="section-title">Receiver Information</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${
                transaction?.receiver?.name || "N/A"
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account Number</span>
              <span class="detail-value">${
                transaction?.receiver?.accountNumber || "N/A"
              }</span>
            </div>
            ${
              transaction?.receiver?.bankName
                ? `<div class="detail-row">
                    <span class="detail-label">Bank Name</span>
                    <span class="detail-value">${transaction.receiver.bankName}</span>
                  </div>`
                : ""
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This is an automated receipt. Please keep it for your records.</p>
          <p style="margin-top:8px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </body>
  </html>
`;

    // Create a Blob and download the file directly
    const blob = new Blob([receiptHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-receipt-${
      transaction.reference || transaction.id
    }.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  // Function to format amount with proper sign
  const formatAmount = (transaction: any) => {
    const isOutflowTransaction = isOutflow(transaction.type);
    const amount = Number(transaction.amount);

    return {
      display: `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`,
      isOutflow: isOutflowTransaction,
      rawAmount: amount,
    };
  };

  // Check if transaction is eligible for receipt (successful transactions)
  const isEligibleForReceipt = (transaction: any) => {
    return transaction.status?.toLowerCase() === "success";
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction History
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent w-full sm:w-auto justify-between"
                >
                  <span className="truncate">{filter}</span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
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

      <CardContent className="p-2 sm:p-4">
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
          filteredTransactions.map((tx) => {
            const amountInfo = formatAmount(tx);
            return (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-150 mb-3 gap-3"
              >
                {/* Transaction Info - Left Side */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                        {tx.description || tx.type}

                        {tx?.fee > 0 && (
                          <span
                            className={`ml-2 text-sm font-medium ${
                              statusConfig[tx.status?.toLowerCase()]?.color ||
                              "text-gray-500"
                            }`}
                          >
                            • Fee: ₦
                            {Number(tx.fee).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        {new Date(tx.created_at).toLocaleDateString()} •{" "}
                        {new Date(tx.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {tx.reference && (
                        <p className="text-gray-400 text-xs mt-1 truncate">
                          Ref: {tx.reference}
                        </p>
                      )}
                    </div>

                    {/* Amount and Status - Mobile Layout */}
                    <div className="sm:hidden flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
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
                      <p
                        className={`font-bold text-base ${
                          amountInfo.isOutflow
                            ? "text-red-500"
                            : "text-green-600"
                        }`}
                      >
                        {amountInfo.isOutflow ? "-" : "+"}
                        {amountInfo.display}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side - Desktop Layout */}
                <div className="flex sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  {/* Status and Amount - Desktop */}
                  <div className="hidden sm:flex sm:items-center gap-4">
                    <div className="flex items-center gap-2">
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
                      <p
                        className={`font-bold text-lg ${
                          amountInfo.isOutflow
                            ? "text-red-500"
                            : "text-green-600"
                        }`}
                      >
                        {amountInfo.isOutflow ? "-" : "+"}
                        {amountInfo.display}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTransaction(tx)}
                      className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">View</span>
                    </Button>
                    {isEligibleForReceipt(tx) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(tx)}
                        className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Download</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
