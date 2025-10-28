"use client";

import Swal from "sweetalert2";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "../context/userData";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

export default function DashboardHeader() {
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();
  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });

         if (userData) {
        await fetch("/api/activity/last-logout", {
          method: "POST",
          body: JSON.stringify({
            user_id: userData.id,
            email: userData.email,
            login_history_id: userData.currentLoginSession 
          }),
        });
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        localStorage.clear();
      }

      setUserData(null);

      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: "You have been signed out successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/auth/login");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: error?.message || "An error occurred during logout.",
      });
    }
  };

  // ✅ Restore user from localStorage (only runs on client)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userData");
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    }
  }, [setUserData]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {userData?.firstName && (
          <h1 className="md:text-xl text-center lg:text-start w-full font-bold text-gray-900">
            Hello {userData.firstName}
          </h1>
        )}

        <div className="flex items-center space-x-2">
         

          <Button
            onClick={handleLogout}
            variant="outline"
            className="cursor-pointer flex items-center space-x-2 bg-transparent"
          >
            <LogOut className="w-4 h-4 hidden md:block" />
            <span>Logout</span>
          </Button>

        </div>
             {/* <NotificationBell /> */}
      </div>
    </header>
  );
}
