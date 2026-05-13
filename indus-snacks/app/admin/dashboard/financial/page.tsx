'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import PageHeader from '@/components/ui/PageHeader'
import { BarChart3, TrendingUp, TrendingDown, Wallet, Save, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { MONTHS } from '@/lib/types'

const PIE_COLORS = ['#dc2626', '#2563eb', '#d97706', '#16a34a', '#7c3aed', '#0891b2']

export default function AdminFinancialPage() {
  const [summary, setSummary] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editedCollected, setEditedCollected] = useState('')

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [sRes, eRes, pRes] = await Promise.all([
      supabase.from('financial_summary').select('*').single(),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('status', 'paid'),
    ])
    setSummary(sRes.data)
    setExpenses(eRes.data || [])
    setPayments(pRes.data || [])
    if (sRes.data) setEditedCollected(String(sRes.data.total_collected))
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSaveCollected() {
    setSaving(true)
    const supabase = createClient()
    const newCollected = Number(editedCollected)
    const totalSpent = Number(summary?.total_spent || 0)
    const { error } = await supabase.from('financial_summary').update({
      total_collected: newCollected,
      remaining_balance: newCollected - totalSpent,
      updated_at: new Date().toISOString(),
    }).eq('id', summary.id)
    if (!error) {
      await logActivity(`Updated total collected to PKR ${newCollected.toLocaleString()}`, 'financial_summary', summary.id)
      setMsg('Financial summary updated!')
      setEditMode(false)
      fetchData()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  // Monthly expenses chart data
  const now = new Date()
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { month: MONTHS[d.getMonth()].slice(0, 3), year: d.getFullYear(), monthNum: d.getMonth() + 1 }
  })

  const monthlyExpenseData = last6Months.map(({ month, year, monthNum }) => {
    const total = expenses
      .filter(e => {
        const d = new Date(e.purchase_date || e.created_at)
        return d.getMonth() + 1 === monthNum && d.getFullYear() === year
      })
      .reduce((s, e) => s + Number(e.amount), 0)
    const collected = payments
      .filter(p => p.month === monthNum && p.year === year)
      .reduce((s, p) => s + Number(p.amount), 0)
    return { month: `${month} ${year !== now.getFullYear() ? year : ''}`.trim(), expenses: total, collected }
  })

  // Category pie chart
  const byCategory: Record<string, number> = {}
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount) })
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const utilPct = summary?.total_collected > 0
    ? Math.round((Number(summary.total_spent) / Number(summary.total_collected)) * 100)
    : 0

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Financial Summary"
        description="Fund overview, analytics, and manual adjustments"
        action={
          <button onClick={fetchData} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{msg}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Collected — editable */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Collected</p>
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          {editMode ? (
            <div className="flex items-center gap-2 mt-1">
              <input type="number" value={editedCollected} onChange={e => setEditedCollected(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-bold" />
              <button onClick={handleSaveCollected} disabled={saving}
                className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center">
                {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setEditMode(false)} className="w-8 h-8 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center text-xs font-bold">✕</button>
            </div>
          ) : (
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">PKR {Number(summary?.total_collected || 0).toLocaleString()}</p>
              <button onClick={() => setEditMode(true)} className="text-xs text-red-600 hover:text-red-700 font-medium underline">Edit</button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">Auto-synced from paid payments</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spent</p>
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">PKR {Number(summary?.total_spent || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Auto-synced from expenses</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Remaining Balance</p>
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${Number(summary?.remaining_balance) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            PKR {Number(summary?.remaining_balance || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Updated automatically</p>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Fund Utilization</h3>
          <span className={`text-sm font-bold ${utilPct > 85 ? 'text-red-600' : utilPct > 60 ? 'text-orange-500' : 'text-green-600'}`}>{utilPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className={`h-4 rounded-full transition-all ${utilPct > 85 ? 'bg-gradient-to-r from-red-600 to-red-500' : utilPct > 60 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 'bg-gradient-to-r from-green-500 to-green-400'}`}
            style={{ width: `${Math.min(utilPct, 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Spent: PKR {Number(summary?.total_spent || 0).toLocaleString()}</span>
          <span>Total: PKR {Number(summary?.total_collected || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Monthly bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-500" />
            Last 6 Months Overview
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyExpenseData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip formatter={(val: any) => `PKR ${Number(val).toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="collected" name="Collected" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Expense Breakdown by Category</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-sm text-gray-400">No expense data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: any) => `PKR ${Number(val).toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent expenses table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">All Expense Transactions</h3>
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b border-gray-100">
                {['Item', 'Category', 'Amount', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{e.item_name}</td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{e.category}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">PKR {Number(e.amount).toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(e.purchase_date || e.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">No expense records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
