import DashboardSidebar from "@/app/components/dashboard-sidebar" 
import DashboardHeader from "@/app/components/dashboard-hearder"
import LegalContracts from "@/app/components/LegalGen" 

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Contracts</h1>
              <p className="text-gray-600">Manage your contracts, agreements, and legal documents</p>
            </div>

            <LegalContracts />
          </div>
        </main>
      </div>
    </div>
  )
}
