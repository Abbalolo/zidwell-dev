import DashboardSidebar from "../components/dashboard-sidebar"
import DashboardHeader from "../components/dashboard-hearder" 
import ProfileSettings from "../components/Profile-settings"

export default function ProfilePage() {
   
  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            <ProfileSettings />
          </div>
        </main>
      </div>
    </div>
  )
}
