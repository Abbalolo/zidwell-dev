import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DataBundlePurchase from "@/app/components/DataBundle";
import ProtectedRoute from "@/app/components/ProtectedRoute";


export default function page() {
  return (
    <ProtectedRoute>
<div className="min-h-screen bg-gray-50">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <DataBundlePurchase />
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
    
  )
}
