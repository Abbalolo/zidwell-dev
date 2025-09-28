"use client";
import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import TaxFiling from "@/app/components/TaxFiling";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

function page() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="md:max-w-5xl md:mx-auto md:p-6">

            <div className="mb-6 md:p-0 p-6">
              <div className="flex items-start space-x-4">
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
                  <h1 className="md:text-3xl text-xl font-bold mb-2">
                    Tax Filing Services
                  </h1>
                  <p className=" text-muted-foreground">
                    Choose your filing option based on your tax history with us
                  </p>
                </div>
              </div>
            </div>

     
            <TaxFiling />
        </main>
      </div>
    </div>
  );
}

export default page;
