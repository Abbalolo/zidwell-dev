"use client";
import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import RecieptManager from "@/app/components/ReceiptGen";
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
          <div className="md:max-w-5xl md:mx-auto">
            <div className="flex items-start space-x-4 mb-4">
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
                <h1 className="md:text-3xl text-xl font-bold mb-2 flex items-center gap-3">
                  Reciept Management{" "}
                  <button
                    disabled
                    className="pointer-events-none text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-md"
                  >
                    ₦100
                  </button>
                </h1>
                <p className=" text-muted-foreground">
                  Create, manage, and track your reciept
                </p>
              </div>
            </div>

            <RecieptManager />
          </div>
        </main>
      </div>
    </div>
  );
}
