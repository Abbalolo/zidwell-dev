'use client'
import React from 'react'
import AdminSidebar from '@/app/components/admin-components/AdminSideBar'
import AdminTopbar from '@/app/components/admin-components/AdminHeader'

 
  

export default function AdminLayout({ children }: { children: React.ReactNode }) {
return (
  <div className="min-h-screen bg-gray-50">
     <AdminSidebar />

      <div className="lg:ml-64">
        <AdminTopbar />

        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
)
}