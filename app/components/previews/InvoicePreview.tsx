// components/InvoicePreview.tsx
import { X } from "lucide-react";
import Image from "next/image";
import React from "react";

interface InvoiceItem {
  item: string;
  quantity: number;
  price: number;
}

interface InvoiceForm {
  signee_name: string;
  signee_email: string;
  message: string;
  invoice_id: string;
  bill_to: string;
  initiator_name: string;
  issue_date: string;
  due_date: string;
  delivery_due: string;
  delivery_issue: string;
  delivery_time: string;
  customer_note: string;
  account_number: string;
  account_name: string;
  signed_at: string;
  created_at: string;
  account_to_pay_name: string;
  invoice_items: InvoiceItem[];
}

type Props = {
  form: any;
  onClose: () => void;
  isPdf?: boolean;
};

const InvoicePreview = ({ form, onClose, isPdf = false }: Props) => {
  const safeForm = {
    ...form,
    signee_name: form.signee_name || "N/A",
    signee_email: form.signee_email || "N/A",
    message: form.message || "No message provided",
    invoice_id: form.invoice_id || "N/A",
    bill_to: form.bill_to || "N/A",
    from: form.initiator_name || "N/A",
    issue_date: form.issue_date || "N/A",
    due_date: form.due_date || "N/A",
    delivery_due: form.delivery_due || "N/A",
    delivery_issue: form.delivery_issue || "N/A",
    delivery_time: form.delivery_time || "N/A",
    customer_note: form.customer_note || "No customer notes",
    account_number: form.account_number || "N/A",
    account_name: form.account_name || "N/A",
    created_at: form.created_at || "N/A",
    signed_at: form.signed_at || "N/A",
    account_to_pay_name: form.account_to_pay_name || "N/A",
    invoice_items: Array.isArray(form.invoice_items) ? form.invoice_items : [],
  };

  console.log(safeForm)

  const calculateTotal = () => {
    return safeForm.invoice_items.reduce(
      (total:any, item:any) => total + item.quantity * item.price,
      0
    );
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
const formattedDate = (date:string) => {
const formattedCreatedAt = date
  ? new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  : "N/A";
  return formattedCreatedAt
}
  

  return (
    <div
      id="pdf-container"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-background w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-invoice-header px-8 py-6 flex justify-between items-center">
          <Image
            src="/logo.png"
            alt="Zidwell Logo"
            width={32}
            height={32}
            className="mr-2"
          />
          <div>
            <h1 className="text-2xl font-bold text-invoice-header-foreground">
              INVOICE
            </h1>
            <p className="text-invoice-header-foreground/80 text-sm mt-1">
              Professional Invoice Document
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-invoice-header-foreground/80 hover:text-invoice-header-foreground p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Invoice Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="bg-invoice-section p-6 rounded-lg border border-invoice-table-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Invoice Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-invoice-subtle font-medium">
                      Invoice #:
                    </span>
                    <span className="font-semibold text-invoice-accent">
                      #{safeForm.invoice_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-invoice-subtle font-medium">
                      Issue Date:
                    </span>
                    <span className="text-foreground">
                      {safeForm.issue_date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-invoice-subtle font-medium">
                      Due Date:
                    </span>
                    <span className="text-foreground font-medium">
                      {safeForm.due_date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-invoice-subtle font-medium">
                      Delivery:
                    </span>
                    <span className="text-foreground">
                      {safeForm.delivery_time}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-invoice-section p-6 rounded-lg border border-invoice-table-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  From
                </h2>
                <div className="text-foreground leading-relaxed whitespace-pre-line">
                  {safeForm.from}
                </div>
              </div>

              <div className="bg-invoice-section p-6 rounded-lg border border-invoice-table-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Bill To
                </h2>
                <div className="text-foreground leading-relaxed whitespace-pre-line">
                  {safeForm.bill_to}
                </div>
              </div>
            </div>
          </div>
          {/* Message Section */}
          {safeForm.message && (
            <div className="mb-8">
              <div className="bg-accent/20 border-l-4 border-invoice-accent p-6 rounded-r-lg">
                <h3 className="font-semibold text-foreground mb-2">Message</h3>
                <p className="text-foreground leading-relaxed">
                  {safeForm.message}
                </p>
              </div>
            </div>
          )}
          {/* Items Table */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Invoice Items
            </h2>
            <div className="overflow-x-auto border border-invoice-table-border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-invoice-table-header">
                    <th className="text-left p-4 font-semibold text-foreground border-b border-invoice-table-border">
                      Description
                    </th>
                    <th className="text-center p-4 font-semibold text-foreground border-b border-invoice-table-border w-24">
                      Qty
                    </th>
                    <th className="text-right p-4 font-semibold text-foreground border-b border-invoice-table-border w-32">
                      Rate
                    </th>
                    <th className="text-right p-4 font-semibold text-foreground border-b border-invoice-table-border w-32">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {safeForm.invoice_items.map((item:any, i:any) => (
                    <tr
                      key={i}
                      className="border-b border-invoice-table-border last:border-b-0 hover:bg-invoice-section/50 transition-colors"
                    >
                      <td className="p-4 text-foreground">
                        {item.item || "N/A"}
                      </td>
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
          {/* Total Section */}
          <div className="flex justify-end mb-8">
            <div className="bg-invoice-header p-6 rounded-lg text-invoice-header-foreground min-w-80">
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>₦{formatNumber(safeForm.total_amount)}</span>
                </div>
                <div className="border-t border-invoice-header-foreground/20 pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                   <span>₦{formatNumber(safeForm.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Customer Note */}
          {safeForm.customer_note && (
            <div className="bg-invoice-section p-6 rounded-lg border border-invoice-table-border">
              <h3 className="font-semibold text-foreground mb-3">
                Customer Notes
              </h3>
              <p className="text-invoice-subtle leading-relaxed">
                {safeForm.customer_note}
              </p>
            </div>
          )}
          {safeForm.initiator_name && safeForm.created_at && (
            <div className="flex gap-2 space-y-3 mt-5">
              <p>Initiator: {safeForm.initiator_name}</p>
              <p>Date:{formattedDate(safeForm.created_at)}</p>
            </div>
          )}

          {safeForm.signee_name && safeForm.signed_at && (
            <div className="flex gap-2 space-y-3">
              <p>Signee: {safeForm.signee_name}</p>
              <p>Date: {formattedDate(safeForm.signed_at)}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-invoice-subtle text-sm">
              Thank you for your business! Please remit payment by the due date
              specified above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
