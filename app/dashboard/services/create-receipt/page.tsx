import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import RecieptManager from "@/app/components/ReceiptGen";

export default function page() {

  return (
    

    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reciept Management</h1>
              <p className="text-gray-600">Create, manage, and track your reciept</p>
            </div>

            <RecieptManager />
          </div>
        </main>
      </div>
    </div>


  )
}
