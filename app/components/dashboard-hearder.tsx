"use client";
import Swal from "sweetalert2";
import {LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "../context/userData";

export default function DashboardHeader() {
 

  const { logout, user } = useUserContextData();


  

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("invoiceDraft");
    } catch (error) {
      console.error("Logout error:", error);
      Swal.fire({
        title: "Error",
        text: "An error occurred while logging out.",
        icon: "error",
      });
    }
  };
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {user && (user.firstName || user.lastName) ? (
          <h1 className="text-xl text-center md:text-start w-full font-bold text-gray-900">
            Hello {`${user.firstName} ${user.lastName}`}
          </h1>
        ) : null}
        {/* <div className="flex items-center justify-center space-x-4">
          
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-lg">»</span>
            <span className="text-sm">{currentDate}</span>
          </div>
        </div> */}

        <div className="flex items-center space-x-2">
          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button> */}

          <Button
            onClick={handleLogout}
            variant="outline"
            className="cursor-pointer flex items-center space-x-2 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
