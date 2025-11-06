"use client";

import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ContractSummaryProps {
  contractTitle: string;
  contractContent: string;
  initiatorName: string;
  initiatorEmail: string;
  signeeName: string;
  signeeEmail: string;
  status: string;
  amount: number;
  confirmContract: boolean;
  onBack: () => void;
  onConfirm: () => void;
  contractType?: string;
  dateCreated?: string;
}

export default function ContractSummary({
  contractTitle,
  contractContent,
  initiatorName,
  initiatorEmail,
  signeeName,
  signeeEmail,
  status,
  amount,
  confirmContract,
  onBack,
  onConfirm,
  contractType = "Service Agreement",
  dateCreated = new Date().toLocaleDateString(),
}: ContractSummaryProps) {
  // Truncate contract content for preview
  const truncatedContent = contractContent.length > 200 
    ? contractContent.substring(0, 200) + "..."
    : contractContent;

  return (
    <AnimatePresence>
      {confirmContract && (
        <>
          {/* 🔲 Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onBack}
          />

          {/* 📄 Modal Container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
             
              {/* Header */}
              <div className="flex flex-col items-center border-b pb-4">
                <div className="text-gray-500 text-sm">Contract Generation Fee</div>
                <div className="text-3xl font-bold text-gray-900">
                  ₦{typeof amount === 'number' ? amount.toLocaleString() : amount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {contractType}
                </div>
              </div>

              {/* CONTRACT DETAILS Section */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-3">
                  Contract Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contract Title</span>
                    <span className="text-gray-900 font-medium text-right">{contractTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      status === 'draft' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date Created</span>
                    <span className="text-gray-900">{dateCreated}</span>
                  </div>
                </div>
              </div>

              {/* PARTIES INVOLVED Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* INITIATOR Section */}
                <div>
                  <h3 className="text-gray-700 text-sm font-semibold mb-2">
                    Initiator (You)
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Name</span>
                      <span className="text-gray-900 font-medium">{initiatorName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Email</span>
                      <span className="text-gray-900">{initiatorEmail}</span>
                    </div>
                  </div>
                </div>

                {/* SIGNEE Section */}
                <div>
                  <h3 className="text-gray-700 text-sm font-semibold mb-2">
                    Signee (Client)
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Name</span>
                      <span className="text-gray-900 font-medium">{signeeName || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Email</span>
                      <span className="text-gray-900">{signeeEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTRACT CONTENT PREVIEW */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-2">
                  Contract Content Preview
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {truncatedContent}
                  </pre>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  {contractContent.length > 200 ? "Content truncated - full contract will be sent" : "Full contract content"}
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="space-y-1">
                  <p className="font-medium">Important Information</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This contract will be sent to the signee for electronic signature</li>
                    <li>Once sent, the contract cannot be edited</li>
                    <li>You will be notified when the contract is signed</li>
                    <li>The ₦{amount} fee covers contract generation and management</li>
                  </ul>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={onConfirm}
                  className="bg-[#C29307] text-white hover:bg-[#b38606] px-8"
                >
                  Send for Signature
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}