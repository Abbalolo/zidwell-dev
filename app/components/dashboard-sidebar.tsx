"use client";
import logo from "/public/zidwell-logo.png";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  Bot,
  User,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import { useUserContextData } from "../context/userData";

// const navigationItems = [
//   { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
//   { name: "Fund Account", href: "/services/fund-account", icon: Wallet },
//   { name: "My Transaction", href: "/transactions", icon: Receipt },
//   { name: "Recurring Payments", href: "/recurring", icon: RotateCcw },
//   { name: "Legal contract", href: "/services/legal-contract", icon: FileText },
//   {
//     name: "Create Invoice", 
//     href: "/services/create-invoice",
//     icon: FileSpreadsheet,
//   },
//   { name: "AI accountant", href: "/services/ai-accountant", icon: Bot },
// ];
const navigationItems = [
  { name: "Dashboard", 
    href: "/dashboard", icon: LayoutDashboard },
  { name: "Fund Account", href: "#", icon: Wallet },
  { name: "My Transaction", href: "#", icon: Receipt },
  { name: "Recurring Payments", href: "#", icon: RotateCcw },
  { name: "Legal contract", href: "#", icon: FileText },
  {
    name: "Create Invoice",
    href: "#",
    icon: FileSpreadsheet,
  },
  { name: "AI accountant", href: "#", icon: Bot },
];

const preferenceItems = [{ name: "My Profile", href: "#", icon: User }];

export default function DashboardSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { userData } = useUserContextData();

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

  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => (
    <Link
      href={item.href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-yellow-500/20 text-yellow-400 border-r-2 border-yellow-400"
          : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
      }`}
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.name}</span>
    </Link>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={
          isMobileMenuOpen
            ? "lg:hidden fixed top-4 right-3 z-50 p-2 bg-gray-800 text-white rounded-lg "
            : `lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg`
        }
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and welcome */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src={logo}
                  alt="Zidwell Logo"
                  width={32}
                  height={32}
                  className="mr-2"
                />
                <h1 className="font-bold text-lg text-white">Zidwell</h1>
              </Link>
            </div>
            {userData && userData.firstName ? (
              <p className="text-gray-400 text-sm">
                Welcome Back {`${userData.firstName}`}
              </p>
            ) : null}
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          {/* Preferences */}
          <div className="px-4 py-6 border-t border-gray-700">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
              Preferences
            </h3>
            <div className="space-y-2">
              {preferenceItems.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
