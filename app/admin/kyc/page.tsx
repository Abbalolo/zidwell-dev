"use client";

import useSWR from "swr";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminTable from "@/app/components/admin-components/AdminTable";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";
import { Badge } from "@/app/components/ui/badge";
import { Eye, Download, FileText } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function KycPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const itemsPerPage = 10;

  // Build API URL with filters
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (searchTerm) params.append('search', searchTerm);
    
    return `/api/admin-apis/kyc?${params.toString()}`;
  };

  const { data, error, isLoading, mutate } = useSWR(
    buildApiUrl(),
    fetcher
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Process KYC applications data
  const applications = React.useMemo(() => {
    if (!data) return [];
    return (data.applications ?? data).map((app: any) => ({
      ...app,
      user_name: app.user ? `${app.user.first_name} ${app.user.last_name}` : 'N/A',
      user_email: app.user?.email || 'N/A',
      user_phone: app.user?.phone || 'N/A',
      user_created: app.user?.created_at || app.created_at,
      // Store raw dates for formatting
      created_at_raw: app.created_at,
      reviewed_at_raw: app.reviewed_at,
    }));
  }, [data]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((app: any) => app.status === 'pending').length;
    const approved = applications.filter((app: any) => app.status === 'approved').length;
    const rejected = applications.filter((app: any) => app.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  }, [applications]);

  // Filter applications based on search
  const filteredApplications = applications.filter((app: any) => {
    const matchesSearch = 
      app.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ---------- Update KYC Status ----------
  const handleUpdateStatus = async (application: any, newStatus: string) => {
    const statusText = newStatus === 'approved' ? 'Approve' : 'Reject';
    
    const { value: adminNotes } = await Swal.fire({
      title: `${statusText} KYC Application?`,
      text: `This will ${newStatus} the KYC application for ${application.user_email}`,
      input: 'textarea',
      inputLabel: 'Admin Notes (Optional)',
      inputPlaceholder: 'Enter any notes or reasons for this decision...',
      showCancelButton: true,
      confirmButtonText: statusText,
      confirmButtonColor: newStatus === 'approved' ? '#10b981' : '#ef4444',
      inputValidator: (value) => {
        if (newStatus === 'rejected' && !value?.trim()) {
          return 'Please provide a reason for rejection';
        }
        return null;
      }
    });

    if (adminNotes === undefined) return; // User cancelled

    try {
      const r = await fetch(`/api/admin-apis/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kycId: application.id,
          status: newStatus,
          adminNotes: adminNotes || null
        }),
      });

      if (!r.ok) throw new Error("Failed to update KYC status");

      Swal.fire({
        icon: "success",
        title: `KYC ${newStatus}`,
        text: `Application for ${application.user_email} has been ${newStatus}.`,
        timer: 2000,
        showConfirmButton: false,
      });
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update KYC status", "error");
    }
  };

  // ---------- View Document in Modal ----------
  const handleViewDocument = async (documentUrl: string, documentType: string) => {
    if (!documentUrl) return;

    // Check if it's an image or PDF
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(documentUrl);
    const isPdf = /\.pdf$/i.test(documentUrl);

    let htmlContent = '';
    
    if (isImage) {
      htmlContent = `
        <div class="flex justify-center">
          <img src="${documentUrl}" alt="${documentType}" class="max-w-full max-h-96 object-contain" />
        </div>
        <div class="mt-4 text-center">
          <a href="${documentUrl}" download target="_blank" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <Download size={16} />
            Download ${documentType}
          </a>
        </div>
      `;
    } else if (isPdf) {
      htmlContent = `
        <div class="flex flex-col items-center">
          <FileText size={64} class="text-gray-400 mb-4" />
          <p class="text-gray-600 mb-4">PDF Document - ${documentType}</p>
          <a href="${documentUrl}" download target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} />
            Download ${documentType}
          </a>
        </div>
      `;
    } else {
      htmlContent = `
        <div class="flex flex-col items-center">
          <FileText size={64} class="text-gray-400 mb-4" />
          <p class="text-gray-600 mb-4">Document - ${documentType}</p>
          <a href="${documentUrl}" download target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} />
            Download ${documentType}
          </a>
        </div>
      `;
    }

    await Swal.fire({
      title: documentType,
      html: htmlContent,
      width: isImage ? 800 : 500,
      showCloseButton: true,
      showConfirmButton: false,
    });
  };

  // ---------- View KYC Details ----------
  const handleViewDetails = async (application: any) => {
    let detailsHtml = `
      <div class="text-left space-y-4 max-h-96 overflow-y-auto">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <strong class="block text-sm font-medium text-gray-700">User Name</strong>
            <p class="mt-1">${application.user_name}</p>
          </div>
          <div>
            <strong class="block text-sm font-medium text-gray-700">Email</strong>
            <p class="mt-1">${application.user_email}</p>
          </div>
          <div>
            <strong class="block text-sm font-medium text-gray-700">Phone</strong>
            <p class="mt-1">${application.user_phone || 'Not provided'}</p>
          </div>
          <div>
            <strong class="block text-sm font-medium text-gray-700">Status</strong>
            <p class="mt-1">${application.status}</p>
          </div>
        </div>
    `;

    if (application.nin) {
      detailsHtml += `
        <div>
          <strong class="block text-sm font-medium text-gray-700">NIN</strong>
          <p class="mt-1 font-mono">${application.nin}</p>
        </div>
      `;
    }

    // ID Card Section with preview
    if (application.signed_id_card_url) {
      detailsHtml += `
        <div>
          <strong class="block text-sm font-medium text-gray-700">ID Card</strong>
          <div class="mt-2 flex gap-2">
            <button 
              onclick="window.viewIdCard('${application.signed_id_card_url}')"
              class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
            >
              <Eye size={14} />
              Preview
            </button>
            <a 
              href="${application.signed_id_card_url}" 
              download 
              target="_blank"
              class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        </div>
      `;
    } else if (application.id_card_url) {
      detailsHtml += `
        <div>
          <strong class="block text-sm font-medium text-gray-700">ID Card</strong>
          <p class="mt-1 text-orange-600">File exists but cannot generate access URL</p>
        </div>
      `;
    }

    // Utility Bill Section with preview
    if (application.signed_utility_bill_url) {
      detailsHtml += `
        <div>
          <strong class="block text-sm font-medium text-gray-700">Utility Bill</strong>
          <div class="mt-2 flex gap-2">
            <button 
              onclick="window.viewUtilityBill('${application.signed_utility_bill_url}')"
              class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
            >
              <Eye size={14} />
              Preview
            </button>
            <a 
              href="${application.signed_utility_bill_url}" 
              download 
              target="_blank"
              class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        </div>
      `;
    } else if (application.utility_bill_url) {
      detailsHtml += `
        <div>
          <strong class="block text-sm font-medium text-gray-700">Utility Bill</strong>
          <p class="mt-1 text-orange-600">File exists but cannot generate access URL</p>
        </div>
      `;
    }

    if (application.admin_notes) {
      detailsHtml += `
        <div>
          <strong class="block text-sm font-medium text-gray-700">Admin Notes</strong>
          <p class="mt-1 p-2 bg-gray-100 rounded">${application.admin_notes}</p>
        </div>
      `;
    }

    detailsHtml += `
        <div class="grid grid-cols-2 gap-4">
          <div>
            <strong class="block text-sm font-medium text-gray-700">Submitted</strong>
            <p class="mt-1">${isClient ? new Date(application.created_at_raw).toLocaleString() : application.created_at_raw}</p>
          </div>
          <div>
            <strong class="block text-sm font-medium text-gray-700">Reviewed</strong>
            <p class="mt-1">${application.reviewed_at_raw ? (isClient ? new Date(application.reviewed_at_raw).toLocaleString() : application.reviewed_at_raw) : 'Not reviewed'}</p>
          </div>
        </div>
      </div>
    `;

    // Store the document URLs in window for the button click handlers
    if (typeof window !== 'undefined') {
      (window as any).viewIdCard = (url: string) => handleViewDocument(url, 'ID Card');
      (window as any).viewUtilityBill = (url: string) => handleViewDocument(url, 'Utility Bill');
    }

    await Swal.fire({
      title: `KYC Details - ${application.user_email}`,
      html: detailsHtml,
      width: 700,
      confirmButtonColor: "#3b82f6",
      didOpen: () => {
        // Add click handlers for the preview buttons
        const idCardBtn = document.querySelector('[onclick^="window.viewIdCard"]');
        const utilityBillBtn = document.querySelector('[onclick^="window.viewUtilityBill"]');
        
        if (idCardBtn) {
          idCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleViewDocument(application.signed_id_card_url, 'ID Card');
          });
        }
        
        if (utilityBillBtn) {
          utilityBillBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleViewDocument(application.signed_utility_bill_url, 'Utility Bill');
          });
        }
      }
    });
  };

  // ---------- Delete KYC Application ----------
  const handleDelete = async (application: any) => {
    const res = await Swal.fire({
      title: "Delete KYC Application?",
      text: `This will permanently delete the KYC application for ${application.user_email}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });

    if (!res.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/kyc/${application.id}`, {
        method: "DELETE",
      });

      if (!r.ok) throw new Error("Delete failed");

      Swal.fire("Deleted", `KYC application for ${application.user_email} has been deleted.`, "success");
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete KYC application", "error");
    }
  };

  // Custom cell renderers
  const renderStatusCell = (value: string) => {
    if (value === "approved") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          ✓ Approved
        </Badge>
      );
    } else if (value === "pending") {
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          ⏳ Pending
        </Badge>
      );
    } else if (value === "rejected") {
      return (
        <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-100">
          ✗ Rejected
        </Badge>
      );
    }
    return value;
  };

  const renderUserNameCell = (value: string, row: any) => {
    return (
      <div>
        <div className="font-medium text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{row.user_email}</div>
      </div>
    );
  };

  const renderDocumentCell = (value: string, row: any, field: string) => {
    const signedUrl = field === 'id_card_url' ? row.signed_id_card_url : row.signed_utility_bill_url;
    const documentType = field === 'id_card_url' ? 'ID Card' : 'Utility Bill';
    
    if (!signedUrl) {
      return <span className="text-gray-400 italic">Not provided</span>;
    }
    
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDocument(signedUrl, documentType)}
          className="h-8 px-2"
        >
          <Eye className="h-3 w-3" />
        </Button>
        <a 
          href={signedUrl} 
          download 
          target="_blank"
          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
        >
          <Download className="h-3 w-3" />
        </a>
      </div>
    );
  };

  const renderDateCell = (value: string, row: any, field: string) => {
    if (!row[`${field}_raw`]) {
      return <span className="text-gray-400 italic">Not set</span>;
    }
    
    if (!isClient) {
      return row[`${field}_raw`];
    }
    
    try {
      const date = new Date(row[`${field}_raw`]);
      if (isNaN(date.getTime())) return "Invalid date";
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderActionsCell = (value: any, row: any) => {
    return (
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetails(row)}
        >
          View
        </Button>
        {row.status === 'pending' && (
          <>
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleUpdateStatus(row, 'approved')}
            >
              Approve
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleUpdateStatus(row, 'rejected')}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    );
  };

  // Define columns with render functions
  const columns = [
    { key: "user_name", label: "User", render: renderUserNameCell },
    { key: "user_phone", label: "Phone" },
    { key: "nin", label: "NIN" },
    { key: "id_card_url", label: "ID Card", render: (value: string, row: any) => renderDocumentCell(value, row, 'id_card_url') },
    { key: "utility_bill_url", label: "Utility Bill", render: (value: string, row: any) => renderDocumentCell(value, row, 'utility_bill_url') },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "created_at", label: "Submitted", render: (value: string, row: any) => renderDateCell(value, row, 'created_at') },
    { key: "reviewed_at", label: "Reviewed", render: (value: string, row: any) => renderDateCell(value, row, 'reviewed_at') },
    { key: "actions", label: "Actions", render: renderActionsCell },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600">Failed to load KYC applications ❌</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">KYC Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and manage user KYC applications
            </p>
          </div>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Applications</h3>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
            <p className="text-2xl font-semibold text-yellow-600">
              {stats.pending}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Approved</h3>
            <p className="text-2xl font-semibold text-green-600">
              {stats.approved}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
            <p className="text-2xl font-semibold text-red-600">
              {stats.rejected}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-1/4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          Showing {paginatedApplications.length} of {filteredApplications.length} applications
          {searchTerm && ` matching "${searchTerm}"`}
          {statusFilter !== "all" && ` (${statusFilter})`}
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          rows={paginatedApplications}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}