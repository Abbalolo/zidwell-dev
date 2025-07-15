"use client"

import { Bell, LogOut } from "lucide-react"
import { Button } from "./ui/button"
import { useUserContextData } from "../context/userData";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseAuth";
import { useRouter } from "next/navigation";

export default function DashboardHeader() {
  const router = useRouter();

   const {userData} = useUserContextData();
 
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
const handleLogOut = () => {
   
    signOut(auth)
      .then(() => {
        router.push("/auth/login");
        // Cookies.remove("isAdmin")
      })
      .catch((error) => {
        console.error("Sign out error:", error);
      })
    
  };
  

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
     
        {userData && (userData.firstName || userData.lastName) ? (
  <h1 className="text-xl text-center md:text-start w-full font-bold text-gray-900">
    Hello {`${userData.firstName} ${userData.lastName}`}
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

          <Button onClick={handleLogOut} variant="outline" className="cursor-pointer flex items-center space-x-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
