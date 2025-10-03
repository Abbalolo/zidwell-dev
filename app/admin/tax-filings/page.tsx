'use client'

import useSWR from "swr"
import { toast } from "sonner"
import { Button } from "@/app/components/ui/button"
import AdminTable from "@/app/components/admin-components/AdminTable"
import AdminLayout from "@/app/components/admin-components/layout"
import Loader from "@/app/components/Loader"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TaxFilingsPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin-apis/tax-filings", fetcher)

  // ✅ Edit tax filing status
  const handleEdit = async (row: any) => {
    const newStatus = prompt("Enter new status", row.status) || row.status
    try {
      const res = await fetch(`/api/admin-apis/tax-filings/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error("Failed to update tax filing")
      toast.success("Tax filing updated ✅")
      mutate() // Refresh table
    } catch (err) {
      toast.error("Failed to update filing ❌")
      console.error(err)
    }
  }

  // ✅ Delete a tax filing
  const handleDelete = async (row: any) => {
    if (!confirm("Are you sure you want to delete this tax filing?")) return

    try {
      const res = await fetch(`/api/admin-apis/tax-filings/${row.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete tax filing")

      toast.success("Tax filing deleted 🗑️")
      mutate()
    } catch (err) {
      toast.error("Failed to delete filing ❌")
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }
  if (error) return <p className="p-6 text-red-600">Failed to load data ❌</p>

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Tax Filings Management</h2>
          <Button variant="outline" onClick={() => mutate()}>🔄 Refresh</Button>
        </div>

        <AdminTable
          columns={[
            { key: "first_name", label: "First Name" },
            { key: "last_name", label: "Last Name" },
            { key: "company_name", label: "Company" },
            { key: "filing_type", label: "Filing Type" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Created At" },
          ]}
          rows={data || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </AdminLayout>
  )
}
