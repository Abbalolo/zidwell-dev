"use client";

import useSWR, { mutate } from "swr";
import React from "react";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import Loader from "@/app/components/Loader";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function InvoicesPage() {
  const { data, error } = useSWR("/api/admin-apis/invoices", fetcher);

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-500 mt-10">Failed to load invoices.</div>
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

  // ✅ Edit invoice status
  async function handleEdit(row: any) {
    const newStatus = prompt("Enter new status", row.status) || row.status;
    await fetch("/api/admin-apis/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, status: newStatus }),
    });
    mutate("/api/admin-apis/invoices");
  }

  // ✅ Delete invoice
  async function handleDelete(row: any) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    await fetch("/api/admin-apis/invoices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    mutate("/api/admin-apis/invoices");
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        <h2 className="text-3xl font-bold mb-6">📄 Invoices Management</h2>

        <AdminTable
          columns={[
            { key: "invoice_id", label: "Invoice #" },
            { key: "initiator_email", label: "Initiator" },
            { key: "signee_email", label: "Signee" },
            { key: "total_amount", label: "Total" },
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
