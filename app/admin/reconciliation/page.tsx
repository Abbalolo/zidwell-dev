"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminLayout from "@/app/components/admin-components/layout";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function ReconciliationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [results, setResults] = useState<any>(null);

  // Run reconciliation
  async function handleRunReconciliation() {
    const result = await Swal.fire({
      title: "Run Reconciliation?",
      text: "This will compare system wallet balances with payment gateway records",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Run Reconciliation",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setIsRunning(true);

      try {
        const response = await fetch("/api/admin-apis/wallets/reconcile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key":
              process.env.NEXT_PUBLIC_ADMIN_KEY || "test-admin-key",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Reconciliation failed");
        }

        setResults(data);
        setLastRun(new Date());

        if (data.discrepanciesFound > 0) {
          let discrepanciesHtml = `
            <div class="text-left">
              <div class="mb-4 p-3 bg-yellow-50 rounded-lg">
                <strong class="text-yellow-800">Found ${data.discrepanciesFound} discrepancies</strong>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="text-left p-2 border-b">User</th>
                      <th class="text-left p-2 border-b">System Balance</th>
                      <th class="text-left p-2 border-b">Gateway Balance</th>
                      <th class="text-left p-2 border-b">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
          `;

          data.discrepancies.forEach((disc: any) => {
            const diffColor =
              disc.difference > 0 ? "text-green-600" : "text-red-600";
            const diffSign = disc.difference > 0 ? "+" : "";

            discrepanciesHtml += `
              <tr class="border-b hover:bg-gray-50">
                <td class="p-2">${disc.user_email}</td>
                <td class="p-2">₦${Number(
                  disc.system_balance || 0
                ).toLocaleString()}</td>
                <td class="p-2">₦${Number(
                  disc.gateway_balance || 0
                ).toLocaleString()}</td>
                <td class="p-2 font-semibold ${diffColor}">
                  ${diffSign}₦${Math.abs(disc.difference || 0).toLocaleString()}
                </td>
              </tr>
            `;
          });

          discrepanciesHtml += `</tbody></table></div></div>`;

          await Swal.fire({
            title: "Reconciliation Complete",
            html: discrepanciesHtml,
            width: 800,
            confirmButtonColor: "#3b82f6",
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Reconciliation Complete",
            text: "No discrepancies found! All balances are synchronized.",
            timer: 3000,
            showConfirmButton: false,
          });
        }
      } catch (err: any) {
        Swal.fire(
          "Error",
          err.message || "Failed to run reconciliation",
          "error"
        );
      } finally {
        setIsRunning(false);
      }
    }
  }

  // Export reconciliation report
  async function handleExportReport() {
    if (!results) {
      Swal.fire("Info", "No reconciliation data to export", "info");
      return;
    }

    // Create CSV content
    let csvContent =
      "User Email,System Balance,Gateway Balance,Difference,Status\n";

    results.discrepancies?.forEach((disc: any) => {
      csvContent += `"${disc.user_email}",${disc.system_balance},${disc.gateway_balance},${disc.difference},${disc.status}\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Swal.fire("Success", "Report exported successfully", "success");
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">🔄 Reconciliation</h2>
            <p className="text-gray-600 mt-1">
              Compare system wallet balances with payment gateway records
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleExportReport}
              disabled={!results}
            >
              📊 Export Report
            </Button>
            <Button
              onClick={handleRunReconciliation}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running...
                </>
              ) : (
                "🔄 Run Reconciliation"
              )}
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Last Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastRun ? lastRun.toLocaleString() : "Never"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Wallets Checked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {results?.checked || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Discrepancies Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  (results?.discrepanciesFound || 0) > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {results?.discrepanciesFound || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Summary</CardTitle>
              <CardDescription>
                Results from last reconciliation run
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total System Balance:</span>
                  <div className="text-lg font-semibold text-green-600">
                    ₦
                    {Number(
                      results.summary?.totalSystemBalance || 0
                    ).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Total Gateway Balance:</span>
                  <div className="text-lg font-semibold text-blue-600">
                    ₦
                    {Number(
                      results.summary?.totalGatewayBalance || 0
                    ).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Total Difference:</span>
                  <div
                    className={`text-lg font-semibold ${
                      (results.summary?.totalDifference || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {results.summary?.totalDifference >= 0 ? "+" : ""}₦
                    {Math.abs(
                      results.summary?.totalDifference || 0
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Discrepancies Table */}
              {results.discrepanciesFound > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-yellow-700">
                    ⚠️ {results.discrepanciesFound} Discrepancies Found
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 border-b font-medium">
                            User Email
                          </th>
                          <th className="text-left p-3 border-b font-medium">
                            System Balance
                          </th>
                          <th className="text-left p-3 border-b font-medium">
                            Gateway Balance
                          </th>
                          <th className="text-left p-3 border-b font-medium">
                            Difference
                          </th>
                          <th className="text-left p-3 border-b font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.discrepancies.map(
                          (disc: any, index: number) => (
                            <tr
                              key={index}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3">{disc.user_email}</td>
                              <td className="p-3">
                                ₦
                                {Number(
                                  disc.system_balance || 0
                                ).toLocaleString()}
                              </td>
                              <td className="p-3">
                                ₦
                                {Number(
                                  disc.gateway_balance || 0
                                ).toLocaleString()}
                              </td>
                              <td
                                className={`p-3 font-semibold ${
                                  disc.difference > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {disc.difference > 0 ? "+" : ""}₦
                                {Math.abs(
                                  disc.difference || 0
                                ).toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    disc.status === "DISCREPANCY"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {disc.status}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How Reconciliation Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full p-1 mt-0.5">
                1
              </div>
              <div>
                <strong>System Balance Check:</strong> Retrieves all wallet
                balances from your database
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full p-1 mt-0.5">
                2
              </div>
              <div>
                <strong>Gateway Balance Check:</strong> Queries payment gateway
                for current user balances
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full p-1 mt-0.5">
                3
              </div>
              <div>
                <strong>Comparison:</strong> Compares system balances with
                gateway balances
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full p-1 mt-0.5">
                4
              </div>
              <div>
                <strong>Discrepancy Report:</strong> Identifies and reports any
                differences found
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
