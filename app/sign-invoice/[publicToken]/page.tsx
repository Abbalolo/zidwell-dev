import { notFound } from "next/navigation";
import Image from "next/image";

import supabase from "@/app/supabase/supabase";

import Link from "next/link";

export default async function SignPage({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const publicToken = (await params).publicToken;

  console.log(publicToken);

  // Fetch invoice using the invoiceId
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("public_token", publicToken)
    .single();

  console.log(error);

  if (error || !invoice) return notFound();

  let items: any[] = [];

  try {
    if (Array.isArray(invoice?.invoice_items)) {
      items = invoice.invoice_items;
    } else if (typeof invoice?.invoice_items === "string") {
      items = JSON.parse(invoice.invoice_items);
    }
  } catch (err) {
    console.error(
      "Failed to parse invoice_items:",
      invoice?.invoice_items,
      err
    );
    items = [];
  }

  const formattedTotal = items
    .reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0)
    .toLocaleString();

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
        <div className="bg-gray-200 px-8 py-6 flex justify-between items-center">
          {/* {invoice.logo && (
            <Image src={invoice.logo} alt="Logo" width={40} height={40} />
          )} */}
          <div>
            <h1 className="text-2xl font-bold">INVOICE</h1>
            <p className="text-sm mt-1">Professional Invoice Document</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h2 className="text-lg font-semibold">Invoice Details</h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Invoice #:</strong> {invoice.invoice_id}
                  </p>
                  <p>
                    <strong>Issue Date:</strong> {invoice.issue_date}
                  </p>
                  <p>
                    <strong>Due Date:</strong> {invoice.due_date}
                  </p>
                  <p>
                    <strong>Delivery:</strong> {invoice.delivery_issue}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h2 className="text-lg font-semibold">From</h2>
                <p className="whitespace-pre-line">{invoice.signee_name}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h2 className="text-lg font-semibold">Bill To</h2>
                <p className="whitespace-pre-line">{invoice.bill_to}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="bg-gray-100 border-l-4 border-gray-300 p-6 rounded-r-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Message</h3>
            <p className="text-gray-700">
              {invoice.customer_note || "Thank you for your business."}
            </p>
          </div>

          {/* Items */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Invoice Items</h2>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">Description</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Rate</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let items: any[] = [];

                    try {
                      if (Array.isArray(invoice.invoice_items)) {
                        items = invoice.invoice_items;
                      } else if (typeof invoice.invoice_items === "string") {
                        items = JSON.parse(invoice.invoice_items);
                      }
                    } catch (err) {
                      console.error(
                        "Failed to parse invoice_items:",
                        invoice.invoice_items,
                        err
                      );
                      items = [];
                    }

                    return items.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-4">{item.item}</td>
                        <td className="p-4 text-center">{item.quantity}</td>
                        <td className="p-4 text-right">{item.price}</td>
                        <td className="p-4 text-right">
                          {(item.quantity * item.price).toLocaleString()}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-gray-200 p-6 rounded-lg min-w-80">
              <div className="text-lg flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>{formattedTotal}</span>
              </div>
              <div className="text-xl font-bold border-t pt-2 flex justify-between">
                <span>Total:</span>
                <span>{formattedTotal}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-10 pt-6 border-t">
            <p className="text-gray-500 text-sm">
              Thank you for your business! Please remit payment by the due date.
            </p>
          </div>

          {/* Signer info */}
          <div className="mt-6 flex justify-between text-sm text-gray-700">
            <p>Initiator: {invoice.initiator_name}</p>
            <p>Date: {invoice.created_at}</p>
          </div>

          {/* Sign form */}
          {invoice.signature_status !== "signed" && (
            <div className="mt-10">
              {invoice.payment_link && (
                <Link
                  href={invoice.payment_link}
                  className="inline-block bg-[#C29307] text-white px-4 py-2 rounded font-bold hover:bg-[#b28a06]"
                >
                  Pay now
                </Link>
              )}
            </div>
          )}

          {invoice.signature_status === "signed" && (
            <div className="p-4 mt-8 bg-yellow-100 text-yellow-800 border border-yellow-400 rounded">
              ⚠️ This invoice has already been signed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
