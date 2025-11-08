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
  FileChartColumnIncreasing,
  Headphones,
  Bell,
  Key,
  Wallet,
  CreditCard,
  RefreshCw,
  History,
} from "lucide-react";
import Image from "next/image";

// Organized navigation links by categories
const navSections = [
  {
    title: "Overview",
    links: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    title: "User Management",
    links: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "KYC Users", href: "/admin/kyc", icon: Key },
    ]
  },
  {
    title: "Wallet Management",
    links: [
      { name: "Wallets", href: "/admin/wallets", icon: Wallet },
      { name: "Transactions", href: "/admin/transactions", icon: FileChartColumnIncreasing },
      { name: "Funding Logs", href: "/admin/funding-logs", icon: CreditCard },
      { name: "Reconciliation", href: "/admin/reconciliation", icon: RefreshCw },
    ]
  },
  {
    title: "Documents",
    links: [
      { name: "Receipts", href: "/admin/receipts", icon: Receipt },
      { name: "Invoices", href: "/admin/invoices", icon: FileSpreadsheet },
      { name: "Contracts", href: "/admin/contracts", icon: FileText },
      { name: "Tax Filings", href: "/admin/tax-filings", icon: ClipboardList },
    ]
  },
  {
    title: "Support & System",
    links: [
      { name: "Support & Disputes", href: "/admin/disputes-supports", icon: Headphones },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
    ]
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["Overview", "Wallet Management"]) // Default expanded sections
  );

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isMobileMenuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMobileMenuOpen]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

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
          ? "bg-[#C29307] text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-black"
      }`}
    >
      <Icon className="w-5 h-5" />
      {name}
    </Link>
  );

  const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <button
      onClick={() => toggleSection(title)}
      className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </div>
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${
          expandedSections.has(title) ? "rotate-180" : ""
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <>
      {/* 📱 Mobile Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black text-white rounded-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* 🧭 Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-68 bg-white border-r shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 h-full flex flex-col overflow-y-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 🔝 Logo */}
        <div className="p-5 border-b flex items-center gap-3 shrink-0">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded" />
          <Link href="/dashboard" className="text-lg font-bold">Admin Panel</Link>
        </div>

        {/* 📂 Navigation (scrollable) */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <SectionHeader 
                title={section.title} 
                icon={section.title === "Wallet Management" ? Wallet : 
                      section.title === "User Management" ? Users :
                      section.title === "Documents" ? FileText :
                      section.title === "Support & System" ? Headphones : LayoutDashboard}
              />
              
              {expandedSections.has(section.title) && (
                <div className="ml-2 space-y-1 border-l-2 border-gray-100 pl-2">
                  {section.links.map((link) => (
                    <NavItem key={link.href} {...link} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 🚪 Footer */}
        <div className="p-4 border-t shrink-0">
          <button className="w-full text-sm text-red-600 hover:underline text-left">
            Logout
          </button>
        </div>
      </div>

      {/* 📱 Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}