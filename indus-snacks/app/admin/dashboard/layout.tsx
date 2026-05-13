import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopBar from '@/components/admin/AdminTopBar'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8fafc' }}>
      <AdminSidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <AdminTopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
