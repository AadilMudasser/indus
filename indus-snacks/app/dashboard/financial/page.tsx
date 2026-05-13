import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import EmptyState from '@/components/ui/EmptyState'
import { Wallet, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'

export default async function FinancialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [summaryRes, expensesRes] = await Promise.all([
    supabase.from('financial_summary').select('*').single(),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }),
  ])

  const summary = summaryRes.data
  const expenses = expensesRes.data || []

  // Group expenses by category
  const byCategory: Record<string, number> = {}
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
  })

  const totalExpenses = Object.values(byCategory).reduce((s, v) => s + v, 0)

  const categoryColors: Record<string, string> = {
    snacks: 'bg-red-500',
    beverages: 'bg-blue-500',
    food: 'bg-orange-500',
    other: 'bg-gray-400',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Financial Summary" description="Transparent overview of the snack fund" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Collected"
          value={`PKR ${Number(summary?.total_collected || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="green"
          className="animate-fade-in stagger-1"
        />
        <StatCard
          label="Total Spent"
          value={`PKR ${Number(summary?.total_spent || 0).toLocaleString()}`}
          icon={TrendingDown}
          color="red"
          className="animate-fade-in stagger-2"
        />
        <StatCard
          label="Remaining Balance"
          value={`PKR ${Number(summary?.remaining_balance || 0).toLocaleString()}`}
          icon={Wallet}
          color="blue"
          className="animate-fade-in stagger-3"
        />
      </div>

      {/* Balance meter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 animate-fade-in stagger-2">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Fund Utilization</h3>
        {summary && Number(summary.total_collected) > 0 ? (
          <>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Spent: PKR {Number(summary.total_spent).toLocaleString()}</span>
              <span>Total: PKR {Number(summary.total_collected).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all"
                style={{ width: `${Math.min((Number(summary.total_spent) / Number(summary.total_collected)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">
              {Math.round((Number(summary.total_spent) / Number(summary.total_collected)) * 100)}% utilized
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">No data available</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-3">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-red-500" />
            Expense Breakdown
          </h3>
          {Object.keys(byCategory).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No expenses recorded</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => {
                  const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                  return (
                    <div key={cat}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm capitalize font-medium text-gray-700">{cat}</span>
                        <span className="text-sm text-gray-900 font-semibold">PKR {amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${categoryColors[cat] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 text-right">{pct.toFixed(1)}%</p>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in stagger-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Expenses</h3>
          </div>
          {expenses.length === 0 ? (
            <EmptyState icon={Wallet} title="No expenses recorded" />
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {expenses.slice(0, 10).map(expense => (
                <div key={expense.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{expense.item_name}</p>
                    <p className="text-xs text-gray-400">{expense.category} · {format(new Date(expense.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    PKR {Number(expense.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
