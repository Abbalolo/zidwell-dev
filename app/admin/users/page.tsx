"use client";

import useSWR from "swr";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminTable from "@/app/components/admin-components/AdminTable";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UsersPage() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin-apis/users",
    fetcher
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }
  if (error) return <p className="p-6 text-red-600">Failed to load users ❌</p>;
  if (!data) return <p className="p-6">No data available.</p>;

  const users = (data.users ?? data).map((user: any) => ({
    ...user,
    full_name: `${user.first_name} ${user.last_name}`,
    balance: user.wallet_balance,
    created_at: new Date(user.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  }));

  // ---------- Delete (uses SweetAlert) ----------
  const handleDelete = async (user: any) => {
    const res = await Swal.fire({
      title: "Delete user?",
      text: `This will permanently delete ${user.email}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });

    if (!res.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/users/${user.id}`, {
        method: "DELETE",
      });

      if (!r.ok) throw new Error("Delete failed");

      Swal.fire("Deleted", `${user.email} has been deleted.`, "success");
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  // ---------- Block / Unblock (toggle status) ----------
  const handleBlockToggle = async (user: any) => {
    const willBlock = user.status !== "blocked";
    const actionText = willBlock ? "Block" : "Unblock";
    const confirm = await Swal.fire({
      title: `${actionText} user?`,
      text: willBlock
        ? `Blocked users will not be able to log in. Block ${user.email}?`
        : `Unblock ${user.email}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: actionText,
      confirmButtonColor: willBlock ? "#d33" : "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      const body = { status: willBlock ? "blocked" : "active" };
      const r = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error("Failed to update status");

      Swal.fire(
        `${actionText}ed`,
        `${user.email} is now ${body.status}`,
        "success"
      );
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", `Failed to ${actionText.toLowerCase()} user`, "error");
    }
  };

  // ---------- Edit modal (SweetAlert form) ----------
  const handleEdit = async (user: any) => {
    // Build a small form using html inside SweetAlert:
    const { value: formValues } = await Swal.fire({
      title: `Edit ${user.email}`,
      html:
        `<input id="swal-full_name" class="swal2-input" placeholder="Full name" value="${escapeHtml(
          user.full_name ?? ""
        )}">` +
        `<input id="swal-email" class="swal2-input" placeholder="Email" value="${escapeHtml(
          user.email ?? ""
        )}">` +
        `<input id="swal-phone" class="swal2-input" placeholder="Phone" value="${escapeHtml(
          user.phone ?? ""
        )}">` +
        `<select id="swal-role" class="swal2-select">
           <option value="user" ${
             user.role === "user" ? "selected" : ""
           }>user</option>
           <option value="admin" ${
             user.role === "admin" ? "selected" : ""
           }>admin</option>
         </select>` +
        `<select id="swal-status" class="swal2-select">
           <option value="active" ${
             user.status === "active" ? "selected" : ""
           }>active</option>
           <option value="blocked" ${
             user.status === "blocked" ? "selected" : ""
           }>blocked</option>
         </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: () => {
        const full_name = (
          document.getElementById("swal-full_name") as HTMLInputElement
        )?.value?.trim();
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        )?.value?.trim();
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        )?.value?.trim();
        const role = (document.getElementById("swal-role") as HTMLSelectElement)
          ?.value;
        const status = (
          document.getElementById("swal-status") as HTMLSelectElement
        )?.value;

        if (!full_name) {
          Swal.showValidationMessage("Full name is required");
          return null;
        }
        if (!email) {
          Swal.showValidationMessage("Email is required");
          return null;
        }

        return { full_name, email, phone, role, status };
      },
    });

    if (!formValues) return; // cancelled or validation failed

    // Patch the user
    try {
      const r = await fetch(`/api/admin-apis/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        throw new Error(errText || "Failed to update user");
      }

      Swal.fire("Saved", `${user.email} updated successfully.`, "success");
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update user", "error");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Users Management</h2>
        <AdminTable
          columns={[
            { key: "email", label: "Email" },
            { key: "full_name", label: "Name" },
            { key: "balance", label: "Balance" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Created" },
          ]}
          rows={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBlockToggle={handleBlockToggle}
        />
      </div>
    </AdminLayout>
  );
}

/**
 * Small helper to escape input values used inside html template string
 * to avoid breaking the SweetAlert HTML.
 */
function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
