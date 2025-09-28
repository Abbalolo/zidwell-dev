"use client";
import Swal from "sweetalert2";
import { LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "../context/userData";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function DashboardHeader() {
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();

  // ✅ Only run logout when user clicks the button
const handleLogout = async () => {
  try {
  
    await fetch("/api/logout", { method: "POST" });


    localStorage.removeItem("userData");
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
      text: error.message || "An error occurred during logout.",
    });
  }
};

  // ✅ Restore user from localStorage (optional)
  useEffect(() => {
    const stored = localStorage.getItem("userData");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserData(parsed);
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
      </div>
    </header>
  );
}
