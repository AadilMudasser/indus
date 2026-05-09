import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { CreditCard, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { MONTHS } from '@/lib/types'
import { format } from 'date-fns'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  const list = payments || []
  const totalPaid = list.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const totalDue = list.filter(p => p.status === 'due').reduce((s, p) => s + Number(p.amount), 0)
  const currentMonthPayment = list.find(p => p.month === currentMonth && p.year === currentYear)

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Payment History" description="Track your monthly snack fund contributions" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Paid" value={`PKR ${totalPaid.toLocaleString()}`} icon={CheckCircle} color="green" />
        <StatCard label="Pending Amount" value={`PKR ${totalDue.toLocaleString()}`} icon={AlertCircle} color="red" />
        <StatCard
          label={`${MONTHS[currentMonth - 1]} Status`}
          value={currentMonthPayment ? (currentMonthPayment.status === 'paid' ? 'Paid ✓' : 'Due') : 'No Record'}
          icon={Calendar}
          color={currentMonthPayment?.status === 'paid' ? 'green' : 'red'}
        />
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-gray-900 text-sm">All Payments</h3>
          <span className="ml-auto text-xs text-gray-400">{list.length} records</span>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment records yet"
            description="Your payment history will appear here once recorded by admin."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Month</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors animate-fade-in`} style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                    <td className="px-5 py-4 font-medium text-gray-900">{MONTHS[p.month - 1]}</td>
                    <td className="px-5 py-4 text-gray-600">{p.year}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">PKR {Number(p.amount).toLocaleString()}</td>
                    <td className="px-5 py-4"><Badge variant={p.status} /></td>
                    <td className="px-5 py-4 text-gray-500">
                      {p.payment_date ? format(new Date(p.payment_date), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-400 max-w-[160px] truncate">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
