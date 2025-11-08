"use client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  ArrowLeft,
  Download,
  Calendar,
  User,
  FileText,
  Building,
} from "lucide-react";
import { useUserContextData } from "../context/userData";
import { useEffect, useState } from "react";
import Loader from "./Loader";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-hearder";

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { transactions, userData, loading } = useUserContextData();
  const [transaction, setTransaction] = useState<any>(null);

  useEffect(() => {
    if (params.id && transactions.length > 0) {
      const foundTransaction = transactions.find((tx) => tx.id === params.id);
      setTransaction(foundTransaction);
    }
  }, [params.id, transactions]);

  const handleDownloadReceipt = () => {
    if (!transaction) return;

 
    const amountInfo = formatAmount(transaction);

    // Create receipt HTML content
   const receiptHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Transaction Receipt - ${transaction.reference || transaction.id}</title>
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
            ${new Date(transaction.created_at).toLocaleDateString()} • ${new Date(transaction.created_at).toLocaleTimeString()}
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
              <span class="detail-value">${transaction.description || "N/A"}</span>
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
              <span class="detail-value">${transaction?.sender?.name || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account Number</span>
              <span class="detail-value">${transaction?.sender?.accountNumber || "N/A"}</span>
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
              <span class="detail-value">${transaction?.receiver?.name || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account Number</span>
              <span class="detail-value">${transaction?.receiver?.accountNumber || "N/A"}</span>
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


    // Create a Blob and download the file
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
  const formatAmount = (tx: any) => {
    const outflowTypes = ["withdrawal", "debit", "transfer", "p2p_transfer"];
    const isOutflowTransaction = outflowTypes.includes(tx.type?.toLowerCase());
    const amount = Number(tx.amount);

    return {
      display: `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`,
      isOutflow: isOutflowTransaction,
      rawAmount: amount,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // console.log("transaction details", transaction);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="lg:ml-64">
          <DashboardHeader />
          <main className="p-4 sm:p-5">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                  Transaction Not Found
                </h2>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Transactions
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const amountInfo = formatAmount(transaction);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-4 sm:p-5">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden md:block">Back</span>
                </Button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    Transaction Details
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    View complete transaction information
                  </p>
                </div>
              </div>

              {transaction.status?.toLowerCase() === "success" && (
                <Button
                  onClick={handleDownloadReceipt}
                  className="flex items-center gap-2 bg-[#C29307] text-white hover:bg-[#a87e06] w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt</span>
                </Button>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column */}
              <div className="space-y-4 sm:space-y-6">
                {/* Amount Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Amount
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div
                        className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                          transaction.status?.toLowerCase() === "success"
                            ? "text-green-600"
                            : transaction.status?.toLowerCase() === "pending"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {amountInfo.display}
                      </div>

                      <p className="text-gray-600 mt-2 text-sm sm:text-base capitalize">
                        {transaction.status?.toLowerCase() === "success"
                          ? "Transaction Successful"
                          : transaction.status?.toLowerCase() === "pending"
                          ? "Transaction Pending"
                          : "Transaction Failed"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recipient Account Info */}

                {transaction?.receiver && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Recipient Account Info
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex  flex-row justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Account Name
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all">
                        {transaction?.receiver.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex  flex-row justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Account Number
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all">
                        {transaction?.receiver.accountNumber ||
                          userData?.account_number ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex  flex-row justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Bank name
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all">
                        {transaction?.receiver.bankName || "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
)}
                {/* Recipient Information (if available) */}
                {(transaction?.recipient_name ||
                  transaction?.recipient_account) && (
                  <Card>
                    <CardHeader className="flex flex-row items-center gap-2 pb-3">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Recipient Information
                      </h2>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {transaction.recipient_name && (
                        <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                          <span className="text-gray-600 text-sm sm:text-base">
                            Recipient Name
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all">
                            {transaction.recipient_name}
                          </span>
                        </div>
                      )}
                      {transaction.recipient_account && (
                        <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                          <span className="text-gray-600 text-sm sm:text-base">
                            Account Number
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all">
                            {transaction.recipient_account}
                          </span>
                        </div>
                      )}
                      {transaction.recipient_bank && (
                        <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                          <span className="text-gray-600 text-sm sm:text-base">
                            Bank Name
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left">
                            {transaction.recipient_bank}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4 sm:space-y-6">
                {/* Transaction Details */}
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Transaction Details
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Type
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left capitalize">
                        {transaction.type || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Description
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all">
                        {transaction.description || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Reference
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all">
                        {transaction.reference || transaction.id}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Status
                      </span>
                      <span
                        className={`font-medium text-sm sm:text-base text-right xs:text-left capitalize ${
                          transaction.status?.toLowerCase() === "success"
                            ? "text-green-600"
                            : transaction.status?.toLowerCase() === "pending"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>


                    {transaction.fee || transaction.fee === 0 && (
                      <div className="flex items-center justify-between gap-1 xs:gap-2">
                        <span className="text-gray-600 text-sm sm:text-base">
                          Transaction Fee
                        </span>
                        <span className="font-medium text-sm ">
                          ₦
                          {Number(transaction.fee).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Date & Time */}
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Date & Time
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Date
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Time
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Full Date
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left">
                        {new Date(transaction.created_at).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
