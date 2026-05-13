'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { CreditCard, Plus, Edit2, Search, X, Save, Filter } from 'lucide-react'
import { MONTHS } from '@/lib/types'
import { format } from 'date-fns'

interface PaymentWithProfile {
  id: string; user_id: string; month: number; year: number; amount: number;
  status: string; payment_date: string | null; notes: string | null; created_at: string;
  profiles: { full_name: string; department: string | null }
}

const now = new Date()

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithProfile[]>([])
  const [staff, setStaff] = useState<{ id: string; full_name: string; department: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1))
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()))
  const [editing, setEditing] = useState<PaymentWithProfile | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [contribution, setContribution] = useState(500)

  const [newPayment, setNewPayment] = useState({
    user_id: '', month: now.getMonth() + 1, year: now.getFullYear(),
    amount: 500, status: 'paid', payment_date: format(now, 'yyyy-MM-dd'), notes: ''
  })

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [pRes, sRes, settingsRes] = await Promise.all([
      supabase.from('payments').select('*, profiles(full_name, department)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, department').eq('role', 'staff').order('full_name'),
      supabase.from('app_settings').select('*').eq('key', 'monthly_contribution').single()
    ])
    setPayments((pRes.data || []) as unknown as PaymentWithProfile[])
    setStaff(sRes.data || [])
    if (settingsRes.data) setContribution(Number(settingsRes.data.value))
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = payments.filter(p => {
    const name = (p.profiles?.full_name || '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())
    const matchStatus = statusFilter ? p.status === statusFilter : true
    const matchMonth = monthFilter ? p.month === Number(monthFilter) : true
    const matchYear = yearFilter ? p.year === Number(yearFilter) : true
    return matchSearch && matchStatus && matchMonth && matchYear
  })

  const totalFiltered = filtered.reduce((s, p) => s + (p.status === 'paid' ? Number(p.amount) : 0), 0)

  async function handleSavePayment() {
    if (!editing) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('payments').update({
      amount: editing.amount, status: editing.status,
      payment_date: editing.payment_date, notes: editing.notes
    }).eq('id', editing.id)
    if (!error) {
      await logActivity(`Updated payment status to ${editing.status}`, 'payments', editing.id, `${editing.profiles?.full_name} — ${MONTHS[editing.month - 1]} ${editing.year}`)
      setMsg('Payment updated!')
      setEditing(null)
      fetchData()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('payments').upsert({
      user_id: newPayment.user_id,
      month: newPayment.month,
      year: newPayment.year,
      amount: newPayment.amount,
      status: newPayment.status,
      payment_date: newPayment.status === 'paid' ? newPayment.payment_date : null,
      notes: newPayment.notes || null,
    }, { onConflict: 'user_id,month,year' })

    if (!error) {
      const staffMember = staff.find(s => s.id === newPayment.user_id)
      await logActivity(`Recorded payment for ${MONTHS[newPayment.month - 1]} ${newPayment.year}`, 'payments', newPayment.user_id, staffMember?.full_name)
      setMsg('Payment recorded!')
      setShowAdd(false)
      fetchData()
      setTimeout(() => setMsg(''), 3000)
    } else {
      setMsg('Error: ' + error.message)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Payment Management" description="Track and manage all staff payments"
        action={
          <button onClick={() => setShowAdd(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        }
      />

      {msg && <div className={`rounded-xl px-4 py-3 mb-4 text-sm border ${msg.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>{msg}</div>}

      {/* Summary quick bar */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-lg font-bold text-green-600">{filtered.filter(p => p.status === 'paid').length}</p>
          <p className="text-xs text-gray-500">Paid (filtered)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-lg font-bold text-red-600">{filtered.filter(p => p.status === 'due').length}</p>
          <p className="text-xs text-gray-500">Due (filtered)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-lg font-bold text-gray-900">PKR {totalFiltered.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Collected (filtered)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
          <option value="">All Years</option>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-gray-900 text-sm">Payment Records</span>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} records</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records found" description="Try adjusting your filters or record a new payment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Month</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{p.profiles?.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{p.profiles?.department || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">PKR {Number(p.amount).toLocaleString()}</td>
                    <td className="px-5 py-4"><Badge variant={p.status} /></td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{p.payment_date ? format(new Date(p.payment_date), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs max-w-32 truncate">{p.notes || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setEditing(p)}
                        className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center ml-auto transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-gray-900">Edit Payment</h3>
                <p className="text-sm text-gray-500">{editing.profiles?.full_name} — {MONTHS[editing.month - 1]} {editing.year}</p>
              </div>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="paid">Paid</option>
                  <option value="due">Due</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (PKR)</label>
                <input type="number" value={editing.amount} onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date</label>
                <input type="date" value={editing.payment_date ? editing.payment_date.split('T')[0] : ''}
                  onChange={e => setEditing({ ...editing, payment_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSavePayment} disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Record Payment</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Staff Member</label>
                <select required value={newPayment.user_id} onChange={e => setNewPayment({ ...newPayment, user_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="">Select staff member...</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.department ? `(${s.department})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                  <select value={newPayment.month} onChange={e => setNewPayment({ ...newPayment, month: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
                  <select value={newPayment.year} onChange={e => setNewPayment({ ...newPayment, year: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (PKR)</label>
                  <input type="number" required value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select value={newPayment.status} onChange={e => setNewPayment({ ...newPayment, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    <option value="paid">Paid</option>
                    <option value="due">Due</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date</label>
                <input type="date" value={newPayment.payment_date} onChange={e => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <input type="text" value={newPayment.notes} onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })} placeholder="Optional notes..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Record</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
