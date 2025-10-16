// app/invoice/[token]/page.tsx
// import supabase from "@/app/supabase/supabase";
import { notFound } from "next/navigation";

import SignReceiptForm from "@/app/components/SignReceiptForm";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateInvoiceHtml(receipt: any) {
  const formattedSignedAt = receipt.signed_at
    ? new Date(receipt.signed_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const signedSection =
    receipt.signee_name && receipt.signed_at
      ? `
      <div class="signatures">
        <p>Signee: ${receipt.signee_name}</p>
        <p>Date: ${formattedSignedAt}</p>
      </div>
    `
      : "";

  const formattedTotal = receipt.receipt_items
    ?.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0)
    .toLocaleString("en-NG", { style: "currency", currency: "NGN" });

  const formattedCreatedAt = receipt.created_at
    ? new Date(receipt.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return `
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f9fafb; padding: 20px; }
    .signatures { display: flex; gap: 20px; margin-top: 20px; }
  </style>
 
    <div class="bg-gray-200 px-8 py-6 flex justify-between items-center">
       <img src="" alt="Logo" class="h-10 w-10 mr-2" />
      <div>
        <h1 class="text-2xl font-bold">INVOICE</h1>
        <p class="text-sm mt-1">Billing Document</p>
      </div>
    </div>

    <div class="p-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div class="bg-gray-50 p-6 rounded-lg border">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <p>Invoice #: ${receipt.receipt_id || "0001"}</p>
          <p>Issue Date: ${receipt.issue_date || "N/A"}</p>
          <p>Payment For: ${receipt.payment_for || "N/A"}</p>
        </div>
        <div class="bg-gray-50 p-6 rounded-lg border">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">From</h2>
          <p class="whitespace-pre-line">${receipt.initiator_name || ""}</p>
        </div>
        <div class="bg-gray-50 p-6 rounded-lg border">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Bill To</h2>
          <p class="whitespace-pre-line">${receipt.bill_to || ""}</p>
        </div>
      </div>

      <h2 class="text-xl font-semibold mb-6">Invoice Items</h2>
      <table class="w-full border">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-4 text-left">Description</th>
            <th class="p-4 text-center">Qty</th>
            <th class="p-4 text-right">Rate</th>
            <th class="p-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${receipt.receipt_items
            ?.map(
              (item: any) => `
            <tr class="border-t">
              <td class="p-4">${item.item}</td>
              <td class="p-4 text-center">${item.quantity}</td>
              <td class="p-4 text-right">${item.price.toLocaleString("en-NG", {
                style: "currency",
                currency: "NGN",
              })}</td>
              <td class="p-4 text-right">${(
                item.quantity * item.price
              ).toLocaleString("en-NG", {
                style: "currency",
                currency: "NGN",
              })}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="flex justify-end mt-4">
        <div class="bg-gray-200 p-6 rounded-lg min-w-80">
          <strong>Total:</strong> ${formattedTotal}
        </div>
      </div>

      <div class="bg-gray-50 p-6 rounded-lg border my-8">
        <h3 class="font-semibold mb-3">Customer Notes</h3>
        <p>${receipt.customer_note || "Thank you for your business!"}</p>
      </div>

      <div class="signatures">
        <p>Initiator: ${receipt.initiator_name || ""}</p>
        <p>Date: ${formattedCreatedAt}</p>
      </div>
      ${signedSection}
    </div>

  `;
}

export default async function ReceiptSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const token = (await params).token;

  // Fetch invoice from Supabase
  const { data: receiptData, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !receiptData) return notFound();

  // Get base64 logo
  // const logoRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`);
  // const logoBlob = await logoRes.blob();
  // const base64Logo = await new Promise<string>((resolve, reject) => {
  //   const reader = new FileReader();
  //   reader.onloadend = () => resolve(reader.result as string);
  //   reader.onerror = reject;
  //   reader.readAsDataURL(logoBlob);
  // });

  const receiptHtml = generateInvoiceHtml(receiptData);

  return (
    <div className="p-4 max-w-5xl mx-auto">
        {receiptData.status === "signed" && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          ⚠️ Warning: This receipt has already been signed and cannot be
          modified.
        </div>
      )}
      <div
        className="border p-4 bg-white shadow rounded"
        dangerouslySetInnerHTML={{ __html: receiptHtml }}
      />
      {receiptData.status !== "signed" && (
        <div className="mt-6">
          <SignReceiptForm
            token={token}
            signeeEmail={receiptData.signee_email}
            signeeName={receiptData.signee_name}
          />
        </div>
      )}
    </div>
  );
}
