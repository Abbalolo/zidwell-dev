"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  FileText,
  ClipboardList,
  Users,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

const navLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Receipts", href: "/admin/receipts", icon: Receipt },
  { name: "Invoices", href: "/admin/invoices", icon: FileSpreadsheet },
  { name: "Contracts", href: "/admin/contracts", icon: FileText },
  { name: "Tax Filings", href: "/admin/tax-filings", icon: ClipboardList },
  { name: "Users", href: "/admin/users", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  const NavItem = ({
    name,
    href,
    icon: Icon,
  }: {
    name: string;
    href: string;
    icon: any;
  }) => (
    <Link
      href={href}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        pathname === href
          ? "bg-black text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-black"
      }`}
    >
      <Icon className="w-5 h-5" />
      {name}
    </Link>
  );

  return (
    <>
      {/* 📱 Mobile toggle button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 bg-black text-white rounded-lg`}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* 🧭 Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 🔝 Logo */}
        <div className="p-5 border-b flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded" />
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>

        {/* 📂 Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => (
            <NavItem key={link.href} {...link} />
          ))}
        </nav>

        {/* 🚪 Footer actions */}
        <div className="p-4 border-t">
          <button className="w-full text-sm text-red-600 hover:underline text-left">
            Logout
          </button>
        </div>
      </div>

      {/* 📱 Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
