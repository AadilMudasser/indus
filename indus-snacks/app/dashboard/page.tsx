import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard, Package, Wallet, TrendingUp, Bell, AlertCircle } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { MONTHS } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [profileRes, currentPaymentRes, allPaymentsRes, inventoryRes, summaryRes, announcementsRes] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('payments').select('*').eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear).maybeSingle(),
      supabase.from('payments').select('*').eq('user_id', user.id),
      supabase.from('inventory').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('financial_summary').select('*').single(),
      supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(3),
    ])

  const profile = profileRes.data
  const currentPayment = currentPaymentRes.data
  const allPayments = allPaymentsRes.data || []
  const inventory = inventoryRes.data || []
  const summary = summaryRes.data
  const announcements = announcementsRes.data || []

  const totalPaid = allPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
  const totalDue = allPayments.filter(p => p.status === 'due').reduce((sum, p) => sum + Number(p.amount), 0)

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
  const sortedAnnouncements = [...announcements].sort((a, b) =>
    (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-red-200 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-200 text-sm font-medium">{format(now, 'EEEE, MMMM d')}</p>
            <h2 className="text-2xl font-bold mt-0.5">Welcome, {profile?.full_name?.split(' ')[0] || 'Staff'} 👋</h2>
            <p className="text-red-200 text-sm mt-1">{profile?.department || 'Indus Hospital'} · Staff Member</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-red-200 text-xs uppercase tracking-wide font-medium">{MONTHS[currentMonth - 1]} Status</p>
            <Badge variant={currentPayment?.status || 'due'} />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Paid"
          value={`PKR ${totalPaid.toLocaleString()}`}
          icon={CreditCard}
          color="green"
          className="animate-fade-in stagger-1"
        />
        <StatCard
          label="Pending Dues"
          value={`PKR ${totalDue.toLocaleString()}`}
          icon={AlertCircle}
          color="red"
          className="animate-fade-in stagger-2"
        />
        <StatCard
          label="Fund Balance"
          value={`PKR ${Number(summary?.remaining_balance || 0).toLocaleString()}`}
          icon={Wallet}
          color="blue"
          className="animate-fade-in stagger-3"
        />
        <StatCard
          label="Contributions"
          value={allPayments.filter(p => p.status === 'paid').length}
          icon={TrendingUp}
          color="purple"
          className="animate-fade-in stagger-4"
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Current Month Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-500" />
              {MONTHS[currentMonth - 1]} Payment
            </h3>
            <Link href="/dashboard/payments" className="text-xs text-red-600 hover:text-red-700 font-medium">View all →</Link>
          </div>
          {currentPayment ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={currentPayment.status} />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">PKR {Number(currentPayment.amount).toLocaleString()}</span>
              </div>
              {currentPayment.payment_date && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Paid on</span>
                  <span className="text-sm text-gray-900">{format(new Date(currentPayment.payment_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600 font-medium">No payment record for this month</p>
              <p className="text-xs text-gray-400 mt-1">Contact admin to record your payment</p>
            </div>
          )}
        </div>

        {/* Announcements Preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-500" />
              Latest Announcements
            </h3>
            <Link href="/dashboard/announcements" className="text-xs text-red-600 hover:text-red-700 font-medium">View all →</Link>
          </div>
          {sortedAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {sortedAnnouncements.map(a => (
                <div key={a.id} className="flex gap-3 p-3 rounded-xl bg-gray-50 hover:bg-red-50 transition-colors">
                  <div className={`w-1.5 rounded-full flex-shrink-0 ${
                    a.priority === 'urgent' ? 'bg-red-500' :
                    a.priority === 'high' ? 'bg-orange-500' :
                    a.priority === 'normal' ? 'bg-blue-400' : 'bg-gray-300'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-red-500" />
            Inventory Snapshot
          </h3>
          <Link href="/dashboard/inventory" className="text-xs text-red-600 hover:text-red-700 font-medium">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {inventory.map(item => (
            <div key={item.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center hover:border-red-200 transition-colors">
              <p className="text-xs font-medium text-gray-900 truncate">{item.item_name}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{item.quantity}</p>
              <p className="text-xs text-gray-400">{item.unit}</p>
              <div className="mt-2">
                <Badge variant={item.availability_status} />
              </div>
            </div>
          ))}
          {inventory.length === 0 && (
            <p className="col-span-5 text-sm text-center text-gray-400 py-4">No inventory items</p>
          )}
        </div>
      </div>
    </div>
  )
}
