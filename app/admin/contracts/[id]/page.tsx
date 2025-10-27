// app/admin/contracts/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Swal from "sweetalert2";

interface ContractDetail {
  contract: any;
  auditLogs: any[];
}

export default function ContractDetailPage() {
  const params = useParams();
  const [data, setData] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/admin-apis/contracts/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch contract");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to Load",
          text: "Could not load contract details. Please try again.",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [params.id]);

  const handleDownload = async () => {
    if (!data?.contract) return;

    if (!data.contract.contract_text?.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Empty Contract",
        text: "This contract has no text to download.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setDownloading(true);
    try {
      const res = await fetch("/api/generate-contract-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_title: data.contract.contract_title,
          contract_text: data.contract.contract_text,
          signee_name: data.contract.signee_name,
          signed_at: data.contract.signed_at,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${data.contract.token}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Success alert
      Swal.fire({
        icon: "success",
        title: "Download Successful",
        text: "Contract PDF has been downloaded successfully.",
        confirmButtonColor: "#10b981",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "An error occurred while generating the PDF.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleFraudFlag = async (flag: boolean) => {
    if (!data?.contract) return;
    
    setActionLoading(true);
    try {
      let reason: string | undefined;

      if (flag) {
        // Show SweetAlert input for fraud reason
        const { value: fraudReason } = await Swal.fire({
          title: 'Flag Contract as Fraud',
          input: 'text',
          inputLabel: 'Reason for flagging',
          inputPlaceholder: 'Enter the reason for flagging this contract as fraudulent...',
          showCancelButton: true,
          confirmButtonColor: "#ef4444",
          cancelButtonColor: "#6b7280",
          confirmButtonText: 'Flag as Fraud',
          cancelButtonText: 'Cancel',
          inputValidator: (value) => {
            if (!value) {
              return 'Please provide a reason for flagging this contract';
            }
          }
        });
        
        if (!fraudReason) {
          setActionLoading(false);
          return; // User cancelled
        }
        reason = fraudReason;
      } else {
        // Show confirmation for clearing fraud flag
        const result = await Swal.fire({
          title: 'Clear Fraud Flag?',
          text: 'Are you sure you want to remove the fraud flag from this contract?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#6b7280",
          confirmButtonText: 'Yes, clear flag',
          cancelButtonText: 'Cancel'
        });
        
        if (!result.isConfirmed) {
          setActionLoading(false);
          return; // User cancelled
        }
      }
      
      const response = await fetch("/api/admin-apis/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: data.contract.id, 
          fraud_flag: flag,
          fraud_reason: reason 
        })
      });

      if (!response.ok) throw new Error("Failed to update fraud flag");
      
      // Success alert
      Swal.fire({
        icon: "success",
        title: flag ? "Contract Flagged" : "Contract Cleared",
        text: flag 
          ? "Contract has been flagged for fraud review." 
          : "Contract fraud flag has been removed.",
        confirmButtonColor: "#10b981",
        timer: 2000,
        showConfirmButton: false,
      });
      
      // Refresh the data
      const updatedResponse = await fetch(`/api/admin-apis/contracts/${params.id}`);
      if (updatedResponse.ok) {
        const result = await updatedResponse.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error updating fraud flag:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update fraud status. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!data?.contract) return;
    
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin-apis/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: data.contract.id, 
          status: newStatus 
        })
      });

      if (!response.ok) throw new Error("Failed to update status");
      
      // Success alert
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Contract status has been updated to ${newStatus}.`,
        confirmButtonColor: "#10b981",
        timer: 2000,
        showConfirmButton: false,
      });
      
      // Refresh the data
      const updatedResponse = await fetch(`/api/admin-apis/contracts/${params.id}`);
      if (updatedResponse.ok) {
        const result = await updatedResponse.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update contract status. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Contract not found</div>;

  const { contract, auditLogs } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{contract.contract_title}</h1>
          <p className="text-gray-500">Contract ID: {contract.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Content */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold mb-4">Contract Content</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded border">
                {contract.contract_text}
              </pre>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold mb-4">Audit Logs</h2>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-start border-b pb-3">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-gray-500">By: {log.performed_by}</p>
                    {log.details && (
                      <p className="text-sm text-gray-600">
                        Details: {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-gray-500">No audit logs found</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="font-semibold mb-4">Contract Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <div className="flex items-center space-x-2">
                  <select
                    value={contract.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={actionLoading}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="issued">Issued</option>
                    <option value="signed">Signed</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                  </select>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                    contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contract.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(contract.created_at).toLocaleDateString()}</span>
              </div>
              {contract.signed_at && (
                <div className="flex justify-between">
                  <span>Signed:</span>
                  <span>{new Date(contract.signed_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Parties Card */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="font-semibold mb-4">Parties Involved</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Initiator</p>
                <p className="text-sm text-gray-600">{contract.initiator_email}</p>
              </div>
              <div>
                <p className="font-medium">Signee</p>
                <p className="text-sm text-gray-600">
                  {contract.signee_name && `${contract.signee_name} - `}
                  {contract.signee_email}
                </p>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={handleDownload}
                disabled={downloading || actionLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
              </button>
              
              {contract.fraud_flag ? (
                <button 
                  onClick={() => handleFraudFlag(false)}
                  disabled={actionLoading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{actionLoading ? 'Updating...' : 'Mark as Clean'}</span>
                </button>
              ) : (
                <button 
                  onClick={() => handleFraudFlag(true)}
                  disabled={actionLoading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{actionLoading ? 'Updating...' : 'Flag as Fraud'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Fraud Status */}
          {contract.fraud_flag && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Fraud Flagged</span>
              </div>
              {contract.fraud_reason && (
                <p className="text-sm text-red-700 mt-2">{contract.fraud_reason}</p>
              )}
              <p className="text-xs text-red-600 mt-2">
                Flagged on: {contract.fraud_flagged_at ? new Date(contract.fraud_flagged_at).toLocaleString() : 'Unknown'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}