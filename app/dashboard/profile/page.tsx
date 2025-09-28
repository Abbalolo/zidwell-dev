"use client"
import DashboardSidebar from "../../components/dashboard-sidebar";
import DashboardHeader from "../../components/dashboard-hearder";
import ProfileSettings from "../../components/Profile-settings";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
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

              <div className="">
                <h1 className="md:text-3xl text-xl font-bold mb-2">
                  Profile Settings
                </h1>
                <p className=" text-muted-foreground">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>

            <ProfileSettings />
          </div>
        </main>
      </div>
    </div>
  );
}
