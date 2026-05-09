'use client'

import { Profile } from '@/lib/types'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'

export default function TopBar({ profile }: { profile: Profile | null }) {
  const now = new Date()
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shadow-sm z-20">
      <div className="pl-10 lg:pl-0">
        <p className="text-xs text-gray-500">{format(now, 'EEEE, MMMM d, yyyy')}</p>
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          Hello, {profile?.full_name?.split(' ')[0] || 'Staff'} 👋
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          Staff
        </div>
        <button className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors relative">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
