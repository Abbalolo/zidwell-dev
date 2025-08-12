// components/ReceiptPreview.tsx
import { X } from "lucide-react";
import Image from "next/image";
import React from "react";

interface ReceiptItem {
  item: string;
  quantity: number;
  price: number;
}

interface ReceiptForm {
  name: string;
  email: string;
  receipt_id: string;
  bill_to: string;
  from: string;
  issue_date: string;
  customer_note: string;
  // amount_paid: string;
  amount_balance?: string;
  payment_for: string;
  receipt_items: ReceiptItem[];
}

type Props = {
  form: any;
  onClose: () => void;
  isPdf?: boolean;
};

const ReceiptPreview = ({ form, onClose, isPdf = false }: Props) => {
  const calculateTotal = () => {
    return form.receipt_items.reduce(
      (total:any, item:any) => total + item.quantity * item.price,
      0
    );
  };

  const formatNumber = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div
      id="pdf-container"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-background w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-receipt-header px-8 py-6 flex justify-between items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="mr-2"
          />
          <div>
            <h1 className="text-2xl font-bold text-receipt-header-foreground">
              Receipt
            </h1>
            <p className="text-receipt-header-foreground/80 text-sm mt-1">
              Professional Receipt Document
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-receipt-header-foreground/80 hover:text-receipt-header-foreground p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Receipt Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="bg-receipt-section p-6 rounded-lg border border-receipt-table-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Receipt Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-receipt-subtle font-medium">
                      Receipt #:
                    </span>
                    <span className="font-semibold text-receipt-accent">
                      #{form.receipt_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-receipt-subtle font-medium">
                      Issue Date:
                    </span>
                    <span className="text-foreground">{form.issue_date}</span>
                  </div>
                 
                  {form.payment_for && (
                    <div className="flex justify-between">
                      <span className="text-receipt-subtle font-medium">
                        Payment For:
                      </span>
                      <span className="text-foreground">
                        {form.payment_for}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-receipt-section p-6 rounded-lg border border-receipt-table-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  From
                </h2>
                <div className="text-foreground leading-relaxed whitespace-pre-line">
                  {form.initiator_name}
                </div>
              </div>

              <div className="bg-receipt-section p-6 rounded-lg border border-receipt-table-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Bill To
                </h2>
                <div className="text-foreground leading-relaxed whitespace-pre-line">
                  {form.bill_to}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Receipt Items
            </h2>
            <div className="overflow-x-auto border border-receipt-table-border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-receipt-table-header">
                    <th className="text-left p-4 font-semibold text-foreground border-b border-receipt-table-border">
                      Description
                    </th>
                    <th className="text-center p-4 font-semibold text-foreground border-b border-receipt-table-border w-24">
                      Qty
                    </th>
                    <th className="text-right p-4 font-semibold text-foreground border-b border-receipt-table-border w-32">
                      Rate
                    </th>
                    <th className="text-right p-4 font-semibold text-foreground border-b border-receipt-table-border w-32">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {form.receipt_items.map((item:any, i:any) => (
                    <tr
                      key={i}
                      className="border-b border-receipt-table-border last:border-b-0 hover:bg-receipt-section/50 transition-colors"
                    >
                      <td className="p-4 text-foreground">{item.item}</td>
                      <td className="p-4 text-center text-foreground">
                        {item.quantity}
                      </td>
                      <td className="p-4 text-right text-foreground">
                        {formatNumber(item.price)}
                      </td>
                      <td className="p-4 text-right font-semibold text-foreground">
                        {formatNumber(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="bg-receipt-header p-6 rounded-lg text-receipt-header-foreground min-w-80 space-y-3">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>₦{formatNumber(calculateTotal())}</span>
              </div>
             
              {form.amount_balance && (
                <div className="flex justify-between text-lg">
                  <span>Amount Balance:</span>
                  <span>₦{formatNumber(form.amount_balance)}</span>
                </div>
              )}
              <div className="border-t border-receipt-header-foreground/20 pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>₦{formatNumber(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {form.customer_note && (
            <div className="bg-receipt-section p-6 rounded-lg border border-receipt-table-border">
              <h3 className="font-semibold text-foreground mb-3">
                Customer Notes
              </h3>
              <p className="text-receipt-subtle leading-relaxed">
                {form.customer_note}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-receipt-subtle text-sm">
              Thank you for your business! Please remit payment by the due date
              specified above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;
