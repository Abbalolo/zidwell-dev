'use client'
import React from 'react'
import NotificationBell from '../NotificationBell'


export default function AdminTopbar() {
return (
<header className="w-full border-b p-4 flex items-center justify-between">
<div className="flex items-center gap-4">
<h1 className="text-lg font-medium">Admin Dashboard</h1>
</div>
<div className="flex items-center gap-3">
<input placeholder="Search..." className="border rounded px-3 py-1" />
<div className="rounded-full bg-gray-200 w-8 h-8 flex items-center justify-center">AL</div>
</div>

   <NotificationBell />
</header>
)
}