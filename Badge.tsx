'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import {
  LayoutDashboard, Users, CreditCard, Package, Receipt,
  MessageSquare, Bell, BarChart3, CalendarDays, Settings,
  ClipboardList, LogOut, ShieldCheck, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/dashboard/staff', label: 'Staff', icon: Users },
  { href: '/admin/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/dashboard/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/dashboard/expenses', label: 'Expenses', icon: Receipt },
  { href: '/admin/dashboard/requests', label: 'Requests', icon: MessageSquare },
  { href: '/admin/dashboard/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/dashboard/financial', label: 'Financial', icon: BarChart3 },
  { href: '/admin/dashboard/menu', label: 'Weekly Menu', icon: CalendarDays },
  { href: '/admin/dashboard/logs', label: 'Activity Logs', icon: ClipboardList },
  { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const Content = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Indus Admin</p>
            <p className="text-xs text-gray-500">Control Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-red-900 rounded-full flex items-center justify-center">
            <span className="text-red-400 text-xs font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Admin'}</p>
            <p className="text-xs text-red-400">Administrator</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 shadow-md rounded-xl flex items-center justify-center border border-gray-700"
        style={{ background: '#1f2937' }}>
        <Menu className="w-4 h-4 text-white" />
      </button>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />}

      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: '#111827' }}>
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <Content />
      </div>

      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-gray-800 z-30" style={{ background: '#111827' }}>
        <Content />
      </aside>
    </>
  )
}
