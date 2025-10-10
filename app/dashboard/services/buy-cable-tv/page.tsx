import CableBills from "@/app/components/CableBills";
import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";

export default function page() {
  return (
    
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />

        <div className="lg:ml-64">
          <DashboardHeader />

          <main className="p-6">
            <div className="max-w-6xl mx-auto">
              <CableBills />
            </div>
          </main>
        </div>
      </div>
  
  );
}
