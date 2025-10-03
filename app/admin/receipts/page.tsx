"use client";

import useSWR, { mutate } from "swr";
import React from "react";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import Loader from "@/app/components/Loader";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReceiptsPage() {
  const { data, error } = useSWR("/api/admin-apis/receipts", fetcher);

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-500 mt-10">Failed to load receipts.</div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  // ✅ Edit receipt status
  async function handleEdit(row: any) {
    const newStatus = prompt("Enter new status", row.status) || row.status;
    await fetch("/api/admin-apis/receipts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, status: newStatus }),
    });
    mutate("/api/admin-apis/receipts");
  }

  // ✅ Delete receipt
  async function handleDelete(row: any) {
    if (!confirm("Are you sure you want to delete this receipt?")) return;
    await fetch("/api/admin-apis/receipts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    mutate("/api/admin-apis/receipts");
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        <h2 className="text-3xl font-bold mb-6">🧾 Receipts Management</h2>

        <AdminTable
          columns={[
            { key: "receipt_id", label: "Receipt #" },
            { key: "initiator_email", label: "Initiator" },
            { key: "signee_email", label: "Signee" },
            { key: "amount_balance", label: "Amount" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Created" },
          ]}
          rows={data}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </AdminLayout>
  );
}
