// components/InvoicePreview.tsx
import { X } from "lucide-react";
import Image from "next/image";
import React from "react";
import logo from "/public/logo.png";
interface InvoiceItem {
  item: string;
  quantity: number;
  price: number;
}

interface InvoiceForm {
  name: string;
  email: string;
  message: string;
  invoiceId: string;
  billTo: string;
  from: string;
  issueDate: string;
  dueDate: string;
  deliveryDue: string;
  deliveryIssue: string;
  deliveryTime: string;
  customerNote: string;
  invoiceItems: InvoiceItem[];
}

type Props = {
  form: InvoiceForm;
  onClose: () => void;
  isPdf?: boolean;
};

const InvoicePreview = ({ form, onClose, isPdf = false }: Props) => {
  const calculateTotal = () => {
    return form.invoiceItems.reduce(
      (total, item) => total + item.quantity * item.price,
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

  return (
    <div
      id="pdf-container"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-background w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-invoice-header px-8 py-6 flex justify-between items-center">
          <Image
            src={logo}
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

          {isPdf && (
            <button
              onClick={onClose}
              className="text-invoice-header-foreground/80 hover:text-invoice-header-foreground p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          )}

          <button
            onClick={onClose}
            className="text-invoice-header-foreground/80 hover:text-invoice-header-foreground p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
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
                      #{form.invoiceId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-invoice-subtle font-medium">
                      Issue Date:
                    </span>
                    <span className="text-foreground">{form.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-invoice-subtle font-medium">
                      Due Date:
                    </span>
                    <span className="text-foreground font-medium">
                      {form.dueDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-invoice-subtle font-medium">
                      Delivery:
                    </span>
                    <span className="text-foreground">{form.deliveryTime}</span>
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
                  {form.from}
                </div>
              </div>

              <div className="bg-invoice-section p-6 rounded-lg border border-invoice-table-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Bill To
                </h2>
                <div className="text-foreground leading-relaxed whitespace-pre-line">
                  {form.billTo}
                </div>
              </div>
            </div>
          </div>

          {/* Message Section */}
          {form.message && (
            <div className="mb-8">
              <div className="bg-accent/20 border-l-4 border-invoice-accent p-6 rounded-r-lg">
                <h3 className="font-semibold text-foreground mb-2">Message</h3>
                <p className="text-foreground leading-relaxed">
                  {form.message}
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
                  {form.invoiceItems.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-invoice-table-border last:border-b-0 hover:bg-invoice-section/50 transition-colors"
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

          {/* Total Section */}
          <div className="flex justify-end mb-8">
            <div className="bg-invoice-header p-6 rounded-lg text-invoice-header-foreground min-w-80">
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>₦{formatNumber(calculateTotal())}</span>
                </div>
                <div className="border-t border-invoice-header-foreground/20 pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span>₦{formatNumber(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {form.customerNote && (
            <div className="bg-invoice-section p-6 rounded-lg border border-invoice-table-border">
              <h3 className="font-semibold text-foreground mb-3">
                Customer Notes
              </h3>
              <p className="text-invoice-subtle leading-relaxed">
                {form.customerNote}
              </p>
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
