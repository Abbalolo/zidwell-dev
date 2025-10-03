"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import AdminTable from "@/app/components/admin-components/AdminTable";
import Loader from "@/app/components/Loader";
import AdminLayout from "@/app/components/admin-components/layout";

// ✅ SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ContractsAdminPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin-apis/contracts", fetcher);

  // ✅ Edit contract status
  const handleEdit = async (row: any) => {
    const newStatus = prompt("Enter new status", row.status) || row.status;
    try {
      const res = await fetch(`/api/admin-apis/contracts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      toast.success("✅ Contract updated successfully");
      mutate();
    } catch (err) {
      toast.error("❌ Failed to update contract");
      console.error(err);
    }
  };

  // ✅ Delete contract
  const handleDelete = async (row: any) => {
    if (!confirm("Are you sure you want to delete this contract?")) return;

    try {
      const res = await fetch(`/api/admin-apis/contracts/${row.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete contract");
      toast.success("🗑️ Contract deleted successfully");
      mutate();
    } catch (err) {
      toast.error("❌ Failed to delete contract");
      console.error(err);
    }
  };

  // ✅ Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 text-red-600 text-center">❌ Failed to load contracts</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">📜 Contracts Management</h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* Table */}
        <AdminTable
          columns={[
            { key: "contract_title", label: "Title" },
            { key: "initiator_email", label: "Initiator" },
            { key: "signee_email", label: "Signee" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Created At" },
          ]}
          rows={data || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </AdminLayout>
  );
}
