"use client";

import FeeDisplay from "./FeeDisplay";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionSummaryProps {
  senderName: string;
  senderAccount: string;
  recipientName: any;
  recipientAccount: string;
  recipientBank: string;
  purpose: string;
  amount: number | string;
  fee: number;
  confirmTransaction: boolean;
  onBack: () => void;
  onConfirm: () => void;
  paymentMethod?: "checkout" | "virtual_account" | "bank_transfer";
}

export default function TransactionSummary({
  senderName,
  senderAccount,
  recipientName,
  recipientAccount,
  recipientBank,
  purpose,
  amount,
  fee,
  confirmTransaction,
  onBack,
  onConfirm,
  paymentMethod = "bank_transfer", // Default to bank transfer for withdrawals
}: TransactionSummaryProps) {
  return (
    <AnimatePresence>
      {confirmTransaction && (
        <>
          {/* 🔲 Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onBack}
          />

          {/* 📤 Modal Container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-3">
             
              <div className="flex flex-col items-center ">
                <div className="text-gray-500 text-sm">You're sending</div>
                <div className="text-3xl font-bold text-gray-900">
                  ₦{typeof amount === 'number' ? amount.toLocaleString() : amount}
                </div>
                <FeeDisplay
                  type="transfer"
                  amount={typeof amount === 'string' ? Number(amount) : amount}
                  paymentMethod={paymentMethod}
                />
              </div>

              {/* FROM Section */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-2">
                  From
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-500">Account Name</span>
                    <span className="text-gray-900">{senderName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Account Number</span>
                    <span className="text-gray-900">{senderAccount}</span>
                  </p>
                </div>
              </div>

              {/* TO Section */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-2">To</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-500">Account Name</span>
                    <span className="text-gray-900">{recipientName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Account Number</span>
                    <span className="text-gray-900">{recipientAccount}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Bank Name</span>
                    <span className="text-gray-900">{recipientBank}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Purpose</span>
                    <span className="text-gray-900">{purpose}</span>
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700 flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mt-0.5 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M5.07 19h13.86c1.14 0 1.72-1.37 1.05-2.24L13.05 4.76a1.25 1.25 0 00-2.1 0L4.02 16.76c-.67.87-.09 2.24 1.05 2.24z"
                  />
                </svg>
                <p>
                  Ensure you verify that the recipient is genuine as payments
                  cannot be reversed after approval.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Back
                </Button>
                <Button
                  onClick={onConfirm}
                  className="bg-[#C29307] text-white hover:bg-[#b38606]"
                >
                  Make Payment
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}