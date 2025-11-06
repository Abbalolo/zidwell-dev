"use client";

import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceItem {
  item: string;
  quantity: string | number;
  price: string | number;
}

interface InvoiceSummaryProps {
  invoiceData: {
    name: string;
    email: string;
    invoice_id: string;
    bill_to: string;
    from: string;
    issue_date: string;
    due_date: string;
    customer_note: string;
    message: string;
    invoice_items: InvoiceItem[];
    payment_type: "single" | "multiple";
    fee_option: "absorbed" | "customer";
    unit: number;
  };
  totals: {
    subtotal: number;
    feeAmount: number;
    totalAmount: number;
  };
  initiatorName: string;
  initiatorEmail: string;
  amount: number;
  confirmInvoice: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export default function InvoiceSummary({
  invoiceData,
  totals,
  initiatorName,
  initiatorEmail,
  amount,
  confirmInvoice,
  onBack,
  onConfirm,
}: InvoiceSummaryProps) {
  return (
    <AnimatePresence>
      {confirmInvoice && (
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
                <div className="text-gray-500 text-sm">Invoice Generation Fee</div>
                <div className="text-3xl font-bold text-gray-900">
                  ₦{typeof amount === 'number' ? amount.toLocaleString() : amount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {invoiceData.payment_type === "multiple" ? "Multiple Buyers Invoice" : "Single Buyer Invoice"}
                </div>
              </div>

              {/* INVOICE DETAILS Section */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-3">
                  Invoice Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Number</span>
                    <span className="text-gray-900 font-medium">{invoiceData.invoice_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issue Date</span>
                    <span className="text-gray-900">{invoiceData.issue_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date</span>
                    <span className="text-gray-900">{invoiceData.due_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee Option</span>
                    <span className="text-gray-900 capitalize">
                      {invoiceData.fee_option === "customer" ? "Customer pays 3.5% fee" : "3.5% absorbed by you"}
                    </span>
                  </div>
                  {invoiceData.payment_type === "multiple" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Units</span>
                      <span className="text-gray-900">{invoiceData.unit}</span>
                    </div>
                  )}
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
                      <span className="text-gray-900 font-medium">{invoiceData.from}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Email</span>
                      <span className="text-gray-900">{initiatorEmail}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Bill To</span>
                      <span className="text-gray-900">{invoiceData.bill_to}</span>
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
                      <span className="text-gray-500 block text-xs">Client Name</span>
                      <span className="text-gray-900 font-medium">{invoiceData.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Email</span>
                      <span className="text-gray-900">{invoiceData.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMS & TOTALS */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-2">
                  Items & Amount
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 mb-3">
                    {invoiceData.invoice_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.item} (Qty: {item.quantity})
                        </span>
                        <span className="text-gray-900">
                          ₦{(Number(item.quantity) * Number(item.price)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">₦{totals.subtotal.toLocaleString()}</span>
                    </div>
                    {invoiceData.fee_option === "customer" && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Fee (3.5%)</span>
                        <span className="text-gray-900">₦{totals.feeAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span className="text-gray-700">Total Amount</span>
                      <span className="text-gray-900">₦{totals.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MESSAGE & NOTES */}
              {(invoiceData.message || invoiceData.customer_note) && (
                <div className="space-y-3">
                  {invoiceData.message && (
                    <div>
                      <h3 className="text-gray-700 text-sm font-semibold mb-2">
                        Message
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-700">{invoiceData.message}</p>
                      </div>
                    </div>
                  )}
                  {invoiceData.customer_note && (
                    <div>
                      <h3 className="text-gray-700 text-sm font-semibold mb-2">
                        Customer Note
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-700">{invoiceData.customer_note}</p>
                      </div>
                    </div>
                  )}
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
                    <li>This invoice will be sent to the client's email</li>
                    <li>Client can pay via multiple payment methods</li>
                    <li>The ₦{amount} fee covers invoice generation and payment processing</li>
                    <li>You will receive notifications when payment is made</li>
                    {invoiceData.fee_option === "customer" && (
                      <li>3.5% processing fee will be added to the client's total</li>
                    )}
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
                  Generate Invoice
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}