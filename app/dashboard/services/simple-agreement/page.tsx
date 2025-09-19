"use client"
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";
import ContractGen from "@/app/components/ContractGen";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function page() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className=" md:max-w-5xl md:mx-auto">
            <div className="flex items-start  space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden md:block">Back</span>
              </Button>

              <div className="mb-4">
                <h1 className="md:text-3xl text-xl font-bold mb-2">
                  Simple Agreement
                </h1>
                <p className=" text-muted-foreground">
                  Manage your contracts, agreements, and legal documents
                </p>
              </div>
            </div>

            <ContractGen />
          </div>
        </main>
      </div>
    </div>
  );
}
