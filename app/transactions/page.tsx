import DashboardSidebar from "../components/dashboard-sidebar"
import DashboardHeader from "../components/dashboard-hearder"
import TransactionHistory from "../components/transaction-history"

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
              <p className="text-gray-600">View and manage all your transactions</p>
            </div>

            <TransactionHistory />
          </div>
        </main>
      </div>
    </div>
  )
}
