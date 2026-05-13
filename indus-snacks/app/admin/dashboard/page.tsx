import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, CreditCard, Package, Wallet, AlertTriangle, MessageSquare, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { MONTHS } from '@/lib/types'
import { format } from 'date-fns'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [
    profilesRes, paymentsRes, currentMonthPaymentsRes,
    inventoryRes, summaryRes, requestsRes, expensesRes, logsRes
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'staff'),
    supabase.from('payments').select('*').eq('year', currentYear),
    supabase.from('payments').select('*').eq('month', currentMonth).eq('year', currentYear),
    supabase.from('inventory').select('*'),
    supabase.from('financial_summary').select('*').single(),
    supabase.from('requests').select('*, profiles(full_name, department)').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('activity_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(6),
  ])

  const staff = profilesRes.data || []
  const allPayments = paymentsRes.data || []
  const currentMonthPayments = currentMonthPaymentsRes.data || []
  const inventory = inventoryRes.data || []
  const summary = summaryRes.data
  const pendingRequests = requestsRes.data || []
  const recentExpenses = expensesRes.data || []
  const recentLogs = logsRes.data || []

  const paidThisMonth = currentMonthPayments.filter(p => p.status === 'paid').length
  const dueThisMonth = staff.length - paidThisMonth
  const monthlyCollected = currentMonthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const lowStockItems = inventory.filter(i => i.availability_status === 'low' || i.availability_status === 'out_of_stock').length

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">{MONTHS[currentMonth - 1]} {currentYear} — real-time snapshot</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Staff" value={staff.length} icon={Users} color="blue" className="animate-fade-in stagger-1" />
        <StatCard label="Fund Balance" value={`PKR ${Number(summary?.remaining_balance || 0).toLocaleString()}`} icon={Wallet} color="green" className="animate-fade-in stagger-2" />
        <StatCard label="Pending Dues" value={dueThisMonth} icon={AlertTriangle} color="red" className="animate-fade-in stagger-3" />
        <StatCard label="Low Stock Items" value={lowStockItems} icon={Package} color="orange" className="animate-fade-in stagger-4" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Collected" value={`PKR ${Number(summary?.total_collected || 0).toLocaleString()}`} icon={TrendingUp} color="green" className="animate-fade-in stagger-1" />
        <StatCard label="Total Spent" value={`PKR ${Number(summary?.total_spent || 0).toLocaleString()}`} icon={TrendingDown} color="red" className="animate-fade-in stagger-2" />
        <StatCard label={`${MONTHS[currentMonth-1]} Collected`} value={`PKR ${monthlyCollected.toLocaleString()}`} icon={CreditCard} color="blue" className="animate-fade-in stagger-3" />
        <StatCard label="Pending Requests" value={pendingRequests.length} icon={MessageSquare} color="purple" className="animate-fade-in stagger-4" />
      </div>

      {/* This month payment progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-500" />
              {MONTHS[currentMonth - 1]} Payment Status
            </h3>
            <Link href="/admin/dashboard/payments" className="text-xs text-red-600 hover:text-red-700 font-medium">Manage →</Link>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{paidThisMonth}</p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{dueThisMonth}</p>
              <p className="text-xs text-gray-500">Due</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              <p className="text-xs text-gray-500">Total Staff</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
              style={{ width: staff.length > 0 ? `${(paidThisMonth / staff.length) * 100}%` : '0%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {staff.length > 0 ? Math.round((paidThisMonth / staff.length) * 100) : 0}% collection rate this month
          </p>
        </div>

        {/* Inventory alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-red-500" />
              Stock Alerts
            </h3>
            <Link href="/admin/dashboard/inventory" className="text-xs text-red-600 hover:text-red-700 font-medium">Manage →</Link>
          </div>
          {inventory.filter(i => i.availability_status !== 'available').length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">All items well stocked</p>
          ) : (
            <div className="space-y-2">
              {inventory.filter(i => i.availability_status !== 'available').slice(0, 4).map(item => (
                <div key={item.id} className="flex items-center justify-between py-1.5">
                  <p className="text-sm text-gray-900 truncate flex-1">{item.item_name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
                    <Badge variant={item.availability_status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-red-500" />
              Pending Requests
            </h3>
            <Link href="/admin/dashboard/requests" className="text-xs text-red-600 hover:text-red-700 font-medium">View all →</Link>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map(req => (
                <div key={req.id} className="p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                  <p className="text-xs font-medium text-gray-900 truncate">{(req as any).profiles?.full_name}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{req.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Recent Expenses
            </h3>
            <Link href="/admin/dashboard/expenses" className="text-xs text-red-600 hover:text-red-700 font-medium">View all →</Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No expenses yet</p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{exp.item_name}</p>
                    <p className="text-xs text-gray-400">{exp.category}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900 flex-shrink-0 ml-2">PKR {Number(exp.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              Recent Activity
            </h3>
            <Link href="/admin/dashboard/logs" className="text-xs text-red-600 hover:text-red-700 font-medium">View all →</Link>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map(log => (
                <div key={log.id} className="flex gap-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-400">{(log as any).profiles?.full_name} · {format(new Date(log.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
