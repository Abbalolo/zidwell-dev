// app/components/admin-components/AdminTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

// 🧭 Helper to detect and format date-like values (client-side only)
function formatValue(key: string, value: any) {
  if (!value) return "-";

  // If key looks like a date field and value is valid date
  if (/(date|created_at|updated_at|timestamp)/i.test(key)) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    } catch (error) {
      console.error("Date formatting error:", error);
    }
  }

  // Default
  return String(value);
}

// Updated Column type with optional render function
type Column = { 
  key: string; 
  label: string; 
  render?: (value: any, row: any) => React.ReactNode;
};

type AdminTableProps = {
  columns: Column[];
  rows: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onDownload?: (row: any) => void;
  onBlockToggle?: (row: any) => void;
  onForceLogout?: (row: any) => void;
  onViewLoginHistory?: (row: any) => void;
  onViewDetails?: (row: any) => void;
  onRetryTransaction?: (row: any) => void;
  emptyMessage?: string;
  searchPlaceholder?: string;
};

export default function AdminTable({
  columns,
  rows,
  onEdit,
  onDelete,
  onDownload,
  onBlockToggle,
  onForceLogout,
  onViewLoginHistory,
  onViewDetails,
  onRetryTransaction,
  emptyMessage = "No records found",
}: AdminTableProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper function to render cell content
  const renderCellContent = (column: Column, row: any) => {
    const value = row[column.key];
    
    // Use custom render function if provided
    if (column.render) {
      return column.render(value, row);
    }
    
    // Otherwise use default formatting (only on client to avoid hydration mismatch)
    if (isClient) {
      return formatValue(column.key, value);
    }
    
    // Server-side fallback - return simple string without formatting
    return value || "-";
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            {(onEdit || onDelete || onDownload || onBlockToggle || onForceLogout || onViewLoginHistory || onViewDetails || onRetryTransaction) && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <TableRow key={row.id || index}>
                <TableCell className="text-center">{index + 1}</TableCell>

                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {renderCellContent(col, row)}
                  </TableCell>
                ))}

                {(onEdit || onDelete || onDownload || onBlockToggle || onForceLogout || onViewLoginHistory || onViewDetails || onRetryTransaction) && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Transaction Actions */}
                        {onViewDetails && (
                          <DropdownMenuItem onClick={() => onViewDetails(row)}>
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onRetryTransaction && (
                          <DropdownMenuItem 
                            onClick={() => onRetryTransaction(row)}
                            className={row.status === "failed" ? "text-orange-600" : "text-gray-400"}
                            disabled={row.status !== "failed"}
                          >
                            Retry Transaction
                          </DropdownMenuItem>
                        )}

                        {/* User Actions */}
                        {onDownload && (
                          <DropdownMenuItem onClick={() => onDownload(row)}>
                            Download Documents
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(row)}>
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onBlockToggle && (
                          <DropdownMenuItem
                            onClick={() => onBlockToggle(row)}
                            className={
                              row.status === "blocked"
                                ? "text-green-600"
                                : "text-yellow-600"
                            }
                          >
                            {row.status === "blocked"
                              ? "Unblock User"
                              : "Block User"}
                          </DropdownMenuItem>
                        )}
                        {onForceLogout && (
                          <DropdownMenuItem
                            onClick={() => onForceLogout(row)}
                            className="text-orange-600"
                          >
                            Force Logout
                          </DropdownMenuItem>
                        )}
                        {onViewLoginHistory && (
                          <DropdownMenuItem
                            onClick={() => onViewLoginHistory(row)}
                            className="text-blue-600"
                          >
                            View Login History
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(row)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + 2} className="text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}