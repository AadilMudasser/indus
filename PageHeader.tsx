'use client'

import { Profile } from '@/lib/types'
import { ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminTopBar({ profile }: { profile: Profile | null }) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shadow-sm z-20">
      <div className="pl-10 lg:pl-0">
        <p className="text-xs text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          Admin Panel — {profile?.full_name?.split(' ')[0] || 'Admin'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          Administrator
        </div>
      </div>
    </header>
  )
}
