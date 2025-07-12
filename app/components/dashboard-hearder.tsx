"use client"

import { Bell, LogOut } from "lucide-react"
import { Button } from "./ui/button"

export default function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-center md:text-start w-full font-bold text-gray-900">Hello Chukwuebuka</h1>
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

          <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
