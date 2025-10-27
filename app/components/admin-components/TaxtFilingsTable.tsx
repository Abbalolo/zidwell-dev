"use client";

import React from "react";
import { Button } from "../ui/button";
import AdminTable from "./AdminTable";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

type TaxFiling = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  status: string;
  created_at: string;
};

type TaxFilingsTableProps = {
  filings: TaxFiling[];
};

export default function TaxFilingsTable({ filings }: TaxFilingsTableProps) {
  // ✅ Download one filing directly from API
  const handleDownloadSingle = async (filing: TaxFiling) => {
    try {
      const res = await fetch(`/api/admin-apis/tax-filings/download?id=${filing.id}`);
      if (!res.ok) throw new Error("Failed to download file");
      const blob = await res.blob(); 
      saveAs(blob, `${filing.company_name || filing.first_name}_TaxDocs.zip`);
    } catch (error) {
      console.error("Download failed:", error);
       Swal.fire("error", "Could not download file.");
  
    }
  };



  return (
    <div>
      <AdminTable
        columns={[
          { key: "first_name", label: "First Name" },
          { key: "last_name", label: "Last Name" },
          { key: "company_name", label: "Company" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Date" },
        ]}
        rows={filings}
        emptyMessage="No tax filings found"
        onDownload={handleDownloadSingle}
      />
    </div>
  );
}
