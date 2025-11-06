"use client";

import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ReceiptItem {
  item: string;
  quantity: string | number;
  price: string | number;
}

interface ReceiptSummaryProps {
  receiptData: {
    name: string;
    email: string;
    receiptId: string;
    bill_to: string;
    from: string;
    issue_date: string;
    customer_note: string;
    payment_for: string;
    receipt_items: ReceiptItem[];
  };
  totalAmount: number;
  initiatorName: string;
  initiatorEmail: string;
  amount: number;
  confirmReceipt: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export default function ReceiptSummary({
  receiptData,
  totalAmount,
  initiatorName,
  initiatorEmail,
  amount,
  confirmReceipt,
  onBack,
  onConfirm,
}: ReceiptSummaryProps) {
  return (
    <AnimatePresence>
      {confirmReceipt && (
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
                <div className="text-gray-500 text-sm">Receipt Generation Fee</div>
                <div className="text-3xl font-bold text-gray-900">
                  ₦{typeof amount === 'number' ? amount.toLocaleString() : amount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Professional Receipt
                </div>
              </div>

              {/* RECEIPT DETAILS Section */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-3">
                  Receipt Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receipt Number</span>
                    <span className="text-gray-900 font-medium">{receiptData.receiptId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issue Date</span>
                    <span className="text-gray-900">{receiptData.issue_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment For</span>
                    <span className="text-gray-900 text-right">{receiptData.payment_for}</span>
                  </div>
                </div>
              </div>

              {/* PARTIES INVOLVED Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FROM Section */}
                <div>
                  <h3 className="text-gray-700 text-sm font-semibold mb-2">
                    From
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Name</span>
                      <span className="text-gray-900 font-medium">{receiptData.from}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Email</span>
                      <span className="text-gray-900">{initiatorEmail}</span>
                    </div>
                  </div>
                </div>

                {/* TO Section */}
                <div>
                  <h3 className="text-gray-700 text-sm font-semibold mb-2">
                    To
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Customer Name</span>
                      <span className="text-gray-900 font-medium">{receiptData.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Email</span>
                      <span className="text-gray-900">{receiptData.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Bill To</span>
                      <span className="text-gray-900">{receiptData.bill_to}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMS SUMMARY */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-2">
                  Items Summary
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {receiptData.receipt_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.item} (Qty: {item.quantity})
                        </span>
                        <span className="text-gray-900 font-medium">
                          ₦{(Number(item.quantity) * Number(item.price)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                    <span className="text-gray-700">Total Amount</span>
                    <span className="text-gray-900">₦{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER NOTE */}
              {receiptData.customer_note && (
                <div>
                  <h3 className="text-gray-700 text-sm font-semibold mb-2">
                    Customer Note
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-700">{receiptData.customer_note}</p>
                  </div>
                </div>
              )}

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
                    <li>This receipt will be sent to the customer's email</li>
                    <li>Once sent, the receipt cannot be edited</li>
                    <li>The ₦{amount} fee covers receipt generation and delivery</li>
                    <li>Customer will receive a professional PDF receipt</li>
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
                  Generate Receipt
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}