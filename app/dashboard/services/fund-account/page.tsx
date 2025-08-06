import DashboardSidebar from "@/app/components/dashboard-sidebar" 
import DashboardHeader from "@/app/components/dashboard-hearder" 
import FundAccountMethods from "@/app/components/FundAccount" 
import ProtectedRoute from "@/app/components/ProtectedRoute"

export default function page() {
  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Fund Account</h1>
              <p className="text-gray-600">Add money to your Zidwell account instantly</p>
            </div>

            <FundAccountMethods />
          </div>
        </main>
      </div>
    </div>

    </ProtectedRoute>
  )
}
