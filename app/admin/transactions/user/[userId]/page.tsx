// app/admin/transactions/user/[userId]/page.tsx
"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminTable from "@/app/components/admin-components/AdminTable";
import AdminLayout from "@/app/components/admin-components/layout";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

// Dynamic imports for PDF (reduces bundle size)
const loadPDFLibrary = async () => {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  return jsPDF;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UserTransactionsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const userEmail = searchParams.get('email') || '';

  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 20;

  // Build API URL with user-specific filters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      range: dateRange,
      userId: userId,
    });

    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return `/api/admin-apis/transactions?${params.toString()}`;
  }, [currentPage, dateRange, typeFilter, statusFilter, startDate, endDate, itemsPerPage, userId]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher);

  // Stats for this specific user
  const statsApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      range: dateRange,
      limit: '10000',
      userId: userId,
    });

    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return `/api/admin-apis/transactions?${params.toString()}`;
  }, [dateRange, typeFilter, statusFilter, startDate, endDate, userId]);

  const { data: statsData } = useSWR(statsApiUrl, fetcher);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, dateRange, startDate, endDate]);

  // Memoize calculations
  const transactions = useMemo(() => data?.transactions || [], [data]);
  const totalTransactions = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(() => Math.ceil(totalTransactions / itemsPerPage), [totalTransactions, itemsPerPage]);

  // Use statsData for calculations
  const allUserTransactions = useMemo(() => statsData?.transactions || [], [statsData]);

  const totalAmount = useMemo(() => 
    allUserTransactions.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0), 
    [allUserTransactions]
  );

  const totalFee = useMemo(() => 
    allUserTransactions.reduce((sum: number, t: any) => sum + Number(t.fee || 0), 0), 
    [allUserTransactions]
  );

  const successfulTransactions = useMemo(() => 
    allUserTransactions.filter((t: any) => t.status === "success"), 
    [allUserTransactions]
  );

  const failedTransactions = useMemo(() => 
    allUserTransactions.filter((t: any) => t.status === "failed"), 
    [allUserTransactions]
  );

  const pendingTransactions = useMemo(() => 
    allUserTransactions.filter((t: any) => t.status === "pending"), 
    [allUserTransactions]
  );

  // ---------- Export User Transactions to CSV ----------
  const handleExportUserCSV = async (format: 'basic' | 'detailed' = 'detailed') => {
    setIsExporting(true);
    try {
      // Get all user transactions for export (without pagination)
      const exportParams = new URLSearchParams({
        range: dateRange,
        limit: '10000',
        userId: userId,
      });

      if (typeFilter !== 'all') exportParams.append('type', typeFilter);
      if (statusFilter !== 'all') exportParams.append('status', statusFilter);
      if (startDate) exportParams.append('startDate', startDate);
      if (endDate) exportParams.append('endDate', endDate);

      const exportResponse = await fetch(`/api/admin-apis/transactions?${exportParams.toString()}`);
      const exportData = await exportResponse.json();
      const exportTransactions = exportData.transactions || [];

      if (exportTransactions.length === 0) {
        Swal.fire("Info", "No transactions found to export", "info");
        return;
      }

      let headers, csvData;

      if (format === 'detailed') {
        // Detailed CSV with all fields
        headers = [
          "Transaction ID", 
          "User ID", 
          "User Email", 
          "User Name", 
          "Type", 
          "Amount (₦)", 
          "Fee (₦)", 
          "Total (₦)", 
          "Status", 
          "Reference", 
          "Description", 
          "Phone Number", 
          "Network", 
          "Channel", 
          "Created At",
          "Updated At"
        ];
        
        csvData = exportTransactions.map((t: any) => [
          t.id,
          t.user_id || "",
          t.user_email || "",
          t.user_name || "",
          t.type,
          Number(t.amount || 0).toLocaleString(),
          Number(t.fee || 0).toLocaleString(),
          Number(t.total_deduction || t.amount || 0).toLocaleString(),
          t.status,
          t.reference || "",
          t.description || "",
          t.phone_number || "",
          t.network || "",
          t.channel || "",
          isClient ? new Date(t.created_at).toLocaleString() : t.created_at,
          t.updated_at ? (isClient ? new Date(t.updated_at).toLocaleString() : t.updated_at) : ""
        ]);
      } else {
        // Basic CSV for quick analysis
        headers = [
          "Date",
          "Type", 
          "Amount (₦)", 
          "Fee (₦)", 
          "Status", 
          "Reference", 
          "Description"
        ];
        
        csvData = exportTransactions.map((t: any) => [
          isClient ? new Date(t.created_at).toLocaleDateString() : t.created_at.split('T')[0],
          t.type,
          Number(t.amount || 0).toLocaleString(),
          Number(t.fee || 0).toLocaleString(),
          t.status,
          t.reference || "",
          t.description || ""
        ]);
      }

      const csvContent = [
        `User Transactions Report - ${userEmail || userId}`,
        `Generated on: ${new Date().toLocaleString()}`,
        `Period: ${dateRange === 'total' ? 'All Time' : dateRange}`,
        `Total Records: ${exportTransactions.length}`,
        `Total Volume: ₦${totalAmount.toLocaleString()}`,
        '', // Empty line for separation
        headers.join(","),
        ...csvData.map((row: any[]) => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Create filename with user info and date
      const dateStr = new Date().toISOString().split('T')[0];
      const userStr = userEmail ? userEmail.split('@')[0] : userId.slice(0, 8);
      const formatStr = format === 'detailed' ? 'detailed' : 'basic';
      a.download = `transactions-${userStr}-${dateStr}-${formatStr}.csv`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Export Successful",
        text: `${exportTransactions.length} transactions exported as ${format} CSV`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Export error:", err);
      Swal.fire("Error", "Failed to export transactions", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // ---------- Export User Transactions to PDF ----------
  const handleExportUserPDF = async () => {
    setIsExporting(true);
    try {
      // Get all user transactions for export
      const exportParams = new URLSearchParams({
        range: dateRange,
        limit: '10000',
        userId: userId,
      });

      if (typeFilter !== 'all') exportParams.append('type', typeFilter);
      if (statusFilter !== 'all') exportParams.append('status', statusFilter);
      if (startDate) exportParams.append('startDate', startDate);
      if (endDate) exportParams.append('endDate', endDate);

      const exportResponse = await fetch(`/api/admin-apis/transactions?${exportParams.toString()}`);
      const exportData = await exportResponse.json();
      const exportTransactions = exportData.transactions || [];

      if (exportTransactions.length === 0) {
        Swal.fire("Info", "No transactions found to export", "info");
        return;
      }

      // Load PDF library dynamically
      const jsPDF = await loadPDFLibrary();
      const doc = new jsPDF();
      
      // Add title and header
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('USER TRANSACTIONS REPORT', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
      
      // User information
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(`User ID: ${userId}`, 14, 35);
      if (userEmail) {
        doc.text(`Email: ${userEmail}`, 14, 42);
      }
      doc.text(`Report Period: ${dateRange === 'total' ? 'All Time' : dateRange}`, 14, 49);
      if (startDate && endDate) {
        doc.text(`Custom Range: ${startDate} to ${endDate}`, 14, 56);
      }
      
      // Summary section
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text('SUMMARY', 14, 70);
      
      doc.setFontSize(10);
      const summaryData = [
        [`Total Transactions:`, `${exportTransactions.length}`],
        [`Successful:`, `${successfulTransactions.length}`],
        [`Failed:`, `${failedTransactions.length}`],
        [`Pending:`, `${pendingTransactions.length}`],
        [`Total Volume:`, `₦${totalAmount.toLocaleString()}`],
        [`Total Fees:`, `₦${totalFee.toLocaleString()}`]
      ];
      
      // @ts-ignore
      doc.autoTable({
        startY: 75,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      // Transactions table
      const finalY = (doc as any).lastAutoTable?.finalY || 75;
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text('TRANSACTION DETAILS', 14, finalY + 15);

      // Prepare table data
      const tableData = exportTransactions.map((t: any) => [
        t.id.slice(0, 8) + '...',
        t.type.toUpperCase(),
        `₦${Number(t.amount || 0).toLocaleString()}`,
        `₦${Number(t.fee || 0).toLocaleString()}`,
        t.status.toUpperCase(),
        t.reference || 'N/A',
        new Date(t.created_at).toLocaleDateString()
      ]);

      // @ts-ignore
      doc.autoTable({
        startY: finalY + 20,
        head: [['ID', 'Type', 'Amount', 'Fee', 'Status', 'Reference', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [51, 51, 51] },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        pageBreak: 'auto',
        didDrawPage: function (data: any) {
          // Add page number
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${doc.getNumberOfPages()}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });

      // Footer
      const lastY = (doc as any).lastAutoTable?.finalY + 10;
      if (lastY < 280) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Report generated by Admin Dashboard - Total records: ${exportTransactions.length}`, 105, lastY, { align: 'center' });
      }

      // Save the PDF
      const dateStr = new Date().toISOString().split('T')[0];
      const userStr = userEmail ? userEmail.split('@')[0] : userId.slice(0, 8);
      doc.save(`transactions-${userStr}-${dateStr}.pdf`);

      Swal.fire({
        icon: "success",
        title: "PDF Export Successful",
        text: `${exportTransactions.length} transactions exported to PDF`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("PDF export error:", err);
      Swal.fire("Error", "Failed to export transactions as PDF", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // ---------- Print User Transactions ----------
  const handlePrintUserTransactions = async () => {
    try {
      // Get all user transactions
      const exportParams = new URLSearchParams({
        range: dateRange,
        limit: '10000',
        userId: userId,
      });

      if (typeFilter !== 'all') exportParams.append('type', typeFilter);
      if (statusFilter !== 'all') exportParams.append('status', statusFilter);
      if (startDate) exportParams.append('startDate', startDate);
      if (endDate) exportParams.append('endDate', endDate);

      const exportResponse = await fetch(`/api/admin-apis/transactions?${exportParams.toString()}`);
      const exportData = await exportResponse.json();
      const exportTransactions = exportData.transactions || [];

      if (exportTransactions.length === 0) {
        Swal.fire("Info", "No transactions found to print", "info");
        return;
      }

      // Create print-friendly HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        Swal.fire("Error", "Please allow pop-ups for printing", "error");
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>User Transactions Report - ${userId}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .summary { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                .summary-item { text-align: center; padding: 10px; }
                .summary-value { font-size: 18px; font-weight: bold; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .positive { color: #28a745; }
                .negative { color: #dc3545; }
                .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>User Transactions Report</h1>
                <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="user-info">
                <h3>User Information</h3>
                <p><strong>User ID:</strong> ${userId}</p>
                ${userEmail ? `<p><strong>Email:</strong> ${userEmail}</p>` : ''}
                <p><strong>Report Period:</strong> ${dateRange === 'total' ? 'All Time' : dateRange}</p>
                ${startDate && endDate ? `<p><strong>Custom Range:</strong> ${startDate} to ${endDate}</p>` : ''}
            </div>
            
            <div class="summary">
                <h3>Summary</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div>Total Transactions</div>
                        <div class="summary-value">${exportTransactions.length}</div>
                    </div>
                    <div class="summary-item">
                        <div>Successful</div>
                        <div class="summary-value" style="color: #28a745;">${successfulTransactions.length}</div>
                    </div>
                    <div class="summary-item">
                        <div>Failed</div>
                        <div class="summary-value" style="color: #dc3545;">${failedTransactions.length}</div>
                    </div>
                    <div class="summary-item">
                        <div>Total Volume</div>
                        <div class="summary-value">₦${totalAmount.toLocaleString()}</div>
                    </div>
                    <div class="summary-item">
                        <div>Total Fees</div>
                        <div class="summary-value">₦${totalFee.toLocaleString()}</div>
                    </div>
                    <div class="summary-item">
                        <div>Pending</div>
                        <div class="summary-value" style="color: #ffc107;">${pendingTransactions.length}</div>
                    </div>
                </div>
            </div>
            
            <h3>Transaction Details (${exportTransactions.length} records)</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Fee</th>
                        <th>Status</th>
                        <th>Reference</th>
                        <th>Description</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${exportTransactions.map((t: any) => `
                        <tr>
                            <td>${t.id.slice(0, 8)}...</td>
                            <td>${t.type}</td>
                            <td class="${['deposit', 'credit', 'refund'].includes(t.type) ? 'positive' : 'negative'}">
                                ${['deposit', 'credit', 'refund'].includes(t.type) ? '+' : '-'}₦${Number(t.amount || 0).toLocaleString()}
                            </td>
                            <td>₦${Number(t.fee || 0).toLocaleString()}</td>
                            <td>${t.status}</td>
                            <td>${t.reference || 'N/A'}</td>
                            <td>${t.description || 'N/A'}</td>
                            <td>${new Date(t.created_at).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Report generated by Admin Dashboard</p>
                <p>Total records: ${exportTransactions.length}</p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => {
                        window.close();
                    }, 500);
                }
            </script>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (err) {
      console.error("Print error:", err);
      Swal.fire("Error", "Failed to generate print view", "error");
    }
  };

  // ---------- Quick Export Options ----------
  const handleQuickExport = async () => {
    const { value: format } = await Swal.fire({
      title: 'Export User Transactions',
      text: 'Choose export format',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Export',
      cancelButtonText: 'Cancel',
      input: 'select',
      inputOptions: {
        csv_detailed: '📊 Detailed CSV (All Fields)',
        csv_basic: '📋 Basic CSV (Essential Fields)',
        pdf: '📄 PDF Report',
        print: '🖨️ Print View'
      },
      inputPlaceholder: 'Select format',
      inputValue: 'csv_detailed'
    });

    if (format) {
      if (format === 'csv_detailed') {
        handleExportUserCSV('detailed');
      } else if (format === 'csv_basic') {
        handleExportUserCSV('basic');
      } else if (format === 'pdf') {
        handleExportUserPDF();
      } else if (format === 'print') {
        handlePrintUserTransactions();
      }
    }
  };

  // Custom cell renderers
  const renderAmountCell = (value: number, row: any) => {
    const amount = Number(value);
    const isPositive = ["deposit", "credit", "refund"].includes(row.type);
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    const symbol = isPositive ? "+" : "-";
    
    return (
      <span className={`font-semibold ${colorClass}`}>
        {symbol}₦{Math.abs(amount).toLocaleString()}
      </span>
    );
  };

  const renderStatusCell = (value: string) => {
    const statusConfig: any = {
      success: { color: "bg-green-100 text-green-800", text: "✓ Success" },
      failed: { color: "bg-red-100 text-red-800", text: "✗ Failed" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "⏳ Pending" },
      processing: { color: "bg-blue-100 text-blue-800", text: "🔄 Processing" }
    };

    const config = statusConfig[value] || { color: "bg-gray-100 text-gray-800", text: value };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderTypeCell = (value: string) => {
    const typeConfig: any = {
      deposit: { color: "bg-green-100 text-green-800", emoji: "📥" },
      withdrawal: { color: "bg-red-100 text-red-800", emoji: "📤" },
      transfer: { color: "bg-blue-100 text-blue-800", emoji: "🔄" },
      airtime: { color: "bg-purple-100 text-purple-800", emoji: "📞" },
      electricity: { color: "bg-orange-100 text-orange-800", emoji: "💡" },
      data: { color: "bg-indigo-100 text-indigo-800", emoji: "📶" },
      cable: { color: "bg-pink-100 text-pink-800", emoji: "📺" }
    };

    const config = typeConfig[value] || { color: "bg-gray-100 text-gray-800", emoji: "💳" };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.emoji} {value}
      </span>
    );
  };

  const renderDateCell = (value: string) => {
    if (!isClient) return value || "-";
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value || "-";
      
      return date.toLocaleString();
    } catch (error) {
      return value || "-";
    }
  };

  const renderReferenceCell = (value: string) => {
    if (!value) return <span className="text-gray-400 italic">No reference</span>;
    return <span className="font-mono text-sm">{value}</span>;
  };

  // View transaction details
  const handleViewTransactionDetails = async (transaction: any) => {
    let detailsHtml = `
      <div class="text-left space-y-3">
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Transaction ID:</strong></div>
          <div class="font-mono text-sm">${transaction.id}</div>
          
          <div><strong>Reference:</strong></div>
          <div>${transaction.reference || "N/A"}</div>
          
          <div><strong>User ID:</strong></div>
          <div class="font-mono text-sm">${transaction.user_id || "N/A"}</div>
          
          <div><strong>Type:</strong></div>
          <div>${transaction.type}</div>
          
          <div><strong>Amount:</strong></div>
          <div class="font-semibold">₦${Number(transaction.amount).toLocaleString()}</div>
          
          <div><strong>Fee:</strong></div>
          <div>₦${Number(transaction.fee || 0).toLocaleString()}</div>
          
          <div><strong>Total:</strong></div>
          <div class="font-semibold">₦${Number(transaction.total_deduction || transaction.amount).toLocaleString()}</div>
          
          <div><strong>Status:</strong></div>
          <div>${transaction.status}</div>
          
          <div><strong>Created:</strong></div>
          <div>${isClient ? new Date(transaction.created_at).toLocaleString() : transaction.created_at}</div>
        </div>
    `;

    if (transaction.description) {
      detailsHtml += `
        <div class="border-t pt-2">
          <div><strong>Description:</strong></div>
          <div>${transaction.description}</div>
        </div>
      `;
    }

    detailsHtml += `</div>`;

    await Swal.fire({
      title: `Transaction Details`,
      html: detailsHtml,
      width: 600,
      confirmButtonColor: "#3b82f6",
    });
  };

  // Export single transaction
  const handleExportSingleTransaction = async (transaction: any) => {
    const csvContent = [
      "Field,Value",
      `Transaction ID,${transaction.id}`,
      `User ID,${transaction.user_id || ""}`,
      `User Email,${transaction.user_email || ""}`,
      `User Name,${transaction.user_name || ""}`,
      `Type,${transaction.type}`,
      `Amount,₦${Number(transaction.amount || 0).toLocaleString()}`,
      `Fee,₦${Number(transaction.fee || 0).toLocaleString()}`,
      `Total,₦${Number(transaction.total_deduction || transaction.amount || 0).toLocaleString()}`,
      `Status,${transaction.status}`,
      `Reference,${transaction.reference || ""}`,
      `Description,${transaction.description || ""}`,
      `Phone Number,${transaction.phone_number || ""}`,
      `Network,${transaction.network || ""}`,
      `Channel,${transaction.channel || ""}`,
      `Created At,${isClient ? new Date(transaction.created_at).toLocaleString() : transaction.created_at}`,
      `Updated At,${transaction.updated_at ? (isClient ? new Date(transaction.updated_at).toLocaleString() : transaction.updated_at) : ""}`
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-${transaction.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Swal.fire({
      icon: "success",
      title: "Transaction Exported",
      text: "Transaction details exported to CSV",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Define columns with action buttons
  const columns = [
    { key: "reference", label: "Reference", render: renderReferenceCell },
    { key: "type", label: "Type", render: renderTypeCell },
    { key: "amount", label: "Amount", render: renderAmountCell },
    { key: "fee", label: "Fee" },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "description", label: "Description" },
    { key: "created_at", label: "Created", render: renderDateCell },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewTransactionDetails(row)}
            title="View Details"
          >
            👁️
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportSingleTransaction(row)}
            title="Export This Transaction"
          >
            📥
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }
  if (error) return <p className="p-6 text-red-600">Failed to load user transactions ❌</p>;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">User Transactions</h2>
            <p className="text-gray-600">
              User: <span className="font-mono">{userId}</span>
              {userEmail && ` | Email: ${userEmail}`}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/admin/transactions')}>
              ← Back to All Transactions
            </Button>
            <Button 
              variant="outline" 
              onClick={handleQuickExport}
              disabled={isExporting || transactions.length === 0}
            >
              {isExporting ? "⏳ Exporting..." : "📊 Export All"}
            </Button>
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* User Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Volume</h3>
            <p className="text-2xl font-semibold">₦{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Fees</h3>
            <p className="text-2xl font-semibold text-orange-600">
              ₦{totalFee.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Successful</h3>
            <p className="text-2xl font-semibold text-green-600">
              {successfulTransactions.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Failed</h3>
            <p className="text-2xl font-semibold text-red-600">
              {failedTransactions.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-2xl font-semibold text-yellow-600">
              {pendingTransactions.length}
            </p>
          </div>
        </div>

        {/* Export Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Export Options Available
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  • <strong>CSV Export:</strong> Download as Excel-compatible CSV (Detailed or Basic)
                </p>
                <p>
                  • <strong>PDF Report:</strong> Generate a formatted PDF with summary and details
                </p>
                <p>
                  • <strong>Print View:</strong> Open a print-friendly version in new window
                </p>
                <p>
                  • <strong>Single Transaction:</strong> Click the download icon (📥) next to any transaction
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Transfer</SelectItem>
                <SelectItem value="airtime">Airtime</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="cable">Cable TV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
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
                setTypeFilter("all");
                setStatusFilter("all");
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
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
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
          Showing {transactions.length} of {totalTransactions} transactions for this user
          {typeFilter !== 'all' && ` | Type: ${typeFilter}`}
          {statusFilter !== 'all' && ` | Status: ${statusFilter}`}
          {dateRange !== "total" && ` | Date: ${dateRange}`}
          {` - Page ${currentPage} of ${totalPages}`}
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          rows={transactions}
          onViewDetails={handleViewTransactionDetails}
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
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
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