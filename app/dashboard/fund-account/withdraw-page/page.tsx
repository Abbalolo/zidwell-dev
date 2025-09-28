"use client";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";
import FundAccountMethods from "@/app/components/FundAccount";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import Withdraw from "@/app/components/Withdraw";

export default function page() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-5">
          <div className="md:max-w-4xl md:mx-auto">
            <div className="flex items-start  space-x-4 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 md:mr-2" />
                <span className="hidden md:block">Back</span>
              </Button>

              <div>
                <h1 className="md:text-3xl text-2xl font-bold mb-2 text-gray-900">
                  Withdraw Balance 
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Transfer money from your wallet directly into your bank
                  account in just a few steps. Fill in the details below to
                  complete your withdrawal securely.
                </p>
              </div>
            </div>

            <Withdraw />
          </div>
        </main>
      </div>
    </div>
  );
}
