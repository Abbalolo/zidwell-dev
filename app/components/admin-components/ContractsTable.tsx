// app/components/admin-components/ContractsTable.tsx
"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import Swal from "sweetalert2";

interface Contract {
  id: string;
  token: string;
  contract_title: string;
  contract_text: string;
  initiator_email: string;
  signee_email: string;
  signee_name: string;
  status: string;
  verification_code: string;
  created_at: string;
  signed_at: string | null;
  signing_link: string | null;
  fraud_flag: boolean;
  fraud_reason: string | null;
}

interface ContractsTableProps {
  contracts: Contract[];
  onUpdate: () => void;
}

export default function ContractsTable({
  contracts,
  onUpdate,
}: ContractsTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});

  const handleDownload = async (contract: Contract) => {
    if (!contract.contract_text?.trim()) {
      Swal.fire(
        "Empty Contract",
        "This contract has no text to download.",
        "warning"
      );
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [contract.id]: true }));
    try {
      const res = await fetch("/api/generate-contract-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_title: contract.contract_title,
          contract_text: contract.contract_text,
          signee_name: contract.signee_name,
          signed_at: contract.signed_at,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${contract.token}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        "An error occurred while generating the PDF.",
        "error"
      );
    } finally {
      setLoadingMap((prev) => ({ ...prev, [contract.id]: false }));
    }
  };

  const handleStatusUpdate = async (contractId: string, newStatus: string) => {
    setActionLoading(contractId);
    try {
      const response = await fetch("/api/admin/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contractId, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      onUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFraudFlag = async (
    contractId: string,
    flag: boolean,
    reason?: string
  ) => {
    setActionLoading(contractId);
    try {
      const response = await fetch("/api/admin/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contractId,
          fraud_flag: flag,
          fraud_reason: reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to update fraud flag");
      onUpdate();
    } catch (error) {
      console.error("Error updating fraud flag:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "expired":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No contracts found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contract
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parties
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fraud Flag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.map((contract) => (
              <ContractRow
                key={contract.id}
                contract={contract}
                isExpanded={expandedContract === contract.id}
                onToggle={() =>
                  setExpandedContract(
                    expandedContract === contract.id ? null : contract.id
                  )
                }
                onStatusUpdate={handleStatusUpdate}
                onFraudFlag={handleFraudFlag}
                onDownload={handleDownload}
                actionLoading={actionLoading === contract.id}
                downloadLoading={loadingMap[contract.id] || false}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Contract Row Component
interface ContractRowProps {
  contract: Contract;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusUpdate: (contractId: string, newStatus: string) => void;
  onFraudFlag: (contractId: string, flag: boolean, reason?: string) => void;
  onDownload: (contract: Contract) => void;
  actionLoading: boolean;
  downloadLoading: boolean;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

function ContractRow({
  contract,
  isExpanded,
  onToggle,
  onStatusUpdate,
  onFraudFlag,
  onDownload,
  actionLoading,
  downloadLoading,
  getStatusIcon,
  getStatusColor,
}: ContractRowProps) {
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {contract.contract_title}
              </div>
              <div className="text-sm text-gray-500">
                Token: {contract.token}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {contract.initiator_email}
            </div>
            <div className="text-gray-500">
              → {contract.signee_name || contract.signee_email}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            {getStatusIcon(contract.status)}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                contract.status
              )}`}
            >
              {contract.status}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(contract.created_at).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {contract.fraud_flag ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Flagged
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/admin/contracts/${contract.id}`, "_blank");
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(contract);
              }}
              disabled={downloadLoading}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-6 py-4 bg-gray-50 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contract Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Contract Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong className="text-gray-700">ID:</strong> {contract.id}
                  </div>
                  <div>
                    <strong className="text-gray-700">
                      Verification Code:
                    </strong>{" "}
                    {contract.verification_code || "N/A"}
                  </div>
                  <div>
                    <strong className="text-gray-700">Signed At:</strong>{" "}
                    {contract.signed_at
                      ? new Date(contract.signed_at).toLocaleString()
                      : "Not signed"}
                  </div>
                  {contract.fraud_reason && (
                    <div>
                      <strong className="text-gray-700">Fraud Reason:</strong>{" "}
                      {contract.fraud_reason}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-4 space-y-2">
                  <h5 className="font-medium text-gray-900">Quick Actions</h5>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={contract.status}
                      onChange={(e) =>
                        onStatusUpdate(contract.id, e.target.value)
                      }
                      disabled={actionLoading}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="pending">Pending</option>
                      <option value="issued">Issued</option>
                      <option value="signed">Signed</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                    </select>

                    {contract.fraud_flag ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFraudFlag(contract.id, false);
                        }}
                        disabled={actionLoading}
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        Mark Clean
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          const reason = prompt("Enter fraud reason:");
                          if (reason) onFraudFlag(contract.id, true, reason);
                        }}
                        disabled={actionLoading}
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      >
                        Flag Fraud
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Contract Text Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Contract Content Preview
                </h4>
                <div className="text-sm bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                  {contract.contract_text.substring(0, 200)}...
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}