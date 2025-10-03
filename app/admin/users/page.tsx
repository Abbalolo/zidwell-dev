'use client'

import useSWR from 'swr'
import AdminTable from '@/app/components/admin-components/AdminTable'
import AdminLayout from '@/app/components/admin-components/layout'
import Loader from '@/app/components/Loader'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function UsersPage() {
  const { data, error, isLoading } = useSWR('/api/admin-apis/users', fetcher)

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    )
  }
  if (error) return <p className="p-6 text-red-600">Failed to load users ❌</p>
  if (!data) return <p className="p-6">No data available.</p>

  // ✅ Map API data to match AdminTable columns
  const users = (data.users ?? data).map((user: any) => ({
    ...user,
    full_name: `${user.first_name} ${user.last_name}`, // Combine first and last name
    balance: user.wallet_balance, // Map wallet_balance to balance
  }))

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Users Management</h2>
        <AdminTable
          columns={[
            { key: 'email', label: 'Email' },
            { key: 'full_name', label: 'Name' },
            { key: 'balance', label: 'Balance' },
            { key: 'role', label: 'Role' },
            { key: 'created_at', label: 'Created' },
          ]}
          rows={users}
        />
      </div>
    </AdminLayout>
  )
}


