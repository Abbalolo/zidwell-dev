import BalanceCard from "../components/Balance-card";
import DashboardHeader from "../components/dashboard-hearder";
import DashboardSidebar from "../components/dashboard-sidebar";
import ReferralSection from "../components/referral-section";
import ServiceCards from "../components/service-card";
import TransactionHistory from "../components/transaction-history";

export default function page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome Message */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the most reliable platform for your</h1>
              <p className="text-xl text-gray-600">Data Bundle, Airtime, Bill Payments...</p>
            </div>

            {/* Balance Section */}
            <BalanceCard />


            
            {/* Service Cards */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Services</h2>
              <ServiceCards />
            </div>

            {/* Transaction History */}
            <TransactionHistory />

            {/* Referral Section */}
            <ReferralSection />
          </div>
        </main>
      </div>
    </div>
  )
}
