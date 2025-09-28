"use client"
import DashboardSidebar from "../../components/dashboard-sidebar"
import DashboardHeader from "../../components/dashboard-hearder"
import TransactionHistory from "../../components/transaction-history"
import { Button } from "@/app/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TransactionsPage() {
  const router = useRouter(); 
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-5">
          <div className=" md:max-w-5xl md:mx-auto">
            <div className="flex items-start  space-x-4 mb-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden md:block">Back</span>
              </Button>

              <div className="">
                <h1 className="md:text-3xl text-xl font-bold mb-4">
               Transaction History
                </h1>
                <p className=" text-muted-foreground">
                View and manage all your transactions
                </p>
              </div>
            </div>
            
          
            <TransactionHistory />
          </div>
        </main>
      </div>
    </div>
  )
}
