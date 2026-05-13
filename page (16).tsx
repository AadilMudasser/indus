'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { Receipt, Plus, Trash2, X, Save, Edit2 } from 'lucide-react'
import { Expense } from '@/lib/types'
import { format } from 'date-fns'

const CATEGORIES = ['snacks', 'beverages', 'food', 'frozen', 'healthy', 'other']
const empty = { item_name: '', amount: '', quantity: '', vendor: '', category: 'snacks', description: '', purchase_date: format(new Date(), 'yyyy-MM-dd') }

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [summary, setSummary] = useState<any>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [eRes, sRes] = await Promise.all([
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('financial_summary').select('*').single()
    ])
    setExpenses(eRes.data || [])
    setSummary(sRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('expenses').insert({
      item_name: form.item_name, amount: Number(form.amount),
      quantity: form.quantity ? Number(form.quantity) : null,
      vendor: form.vendor || null, category: form.category,
      description: form.description || null,
      purchase_date: form.purchase_date,
      created_at: form.purchase_date,
    })
    if (!error) {
      await logActivity(`Added expense: ${form.item_name} — PKR ${form.amount}`, 'expenses', undefined, form.category)
      setMsg('Expense recorded! Financial summary auto-updated.')
      setShowAdd(false)
      setForm({ ...empty })
      fetchData()
      setTimeout(() => setMsg(''), 3000)
    } else { setMsg('Error: ' + error.message) }
    setSaving(false)
  }

  async function handleUpdate() {
    if (!editing) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('expenses').update({
      item_name: editing.item_name, amount: Number(editing.amount),
      quantity: editing.quantity ? Number(editing.quantity) : null,
      vendor: editing.vendor || null, category: editing.category,
      description: editing.description || null,
    }).eq('id', editing.id)
    if (!error) {
      await logActivity(`Updated expense: ${editing.item_name}`, 'expenses', editing.id)
      setMsg('Expense updated!')
      setEditing(null)
      fetchData()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  async function handleDelete(exp: any) {
    if (!confirm(`Delete expense "${exp.item_name}"?`)) return
    const supabase = createClient()
    await supabase.from('expenses').delete().eq('id', exp.id)
    await logActivity(`Deleted expense: ${exp.item_name}`, 'expenses', exp.id)
    fetchData()
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const byCategory = expenses.reduce((acc: any, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc }, {})

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Expense Management" description="Record and track all snack fund spending"
        action={
          <button onClick={() => setShowAdd(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        }
      />

      {msg && <div className={`rounded-xl px-4 py-3 mb-4 text-sm border ${msg.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>{msg}</div>}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-lg font-bold text-gray-900">PKR {totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Expenses</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-lg font-bold text-green-700">PKR {Number(summary?.total_collected || 0).toLocaleString()}</p>
          <p className="text-xs text-green-600">Total Collected</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
          <p className="text-lg font-bold text-blue-700">PKR {Number(summary?.remaining_balance || 0).toLocaleString()}</p>
          <p className="text-xs text-blue-600">Remaining Balance</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-lg font-bold text-gray-700">{expenses.length}</p>
          <p className="text-xs text-gray-500">Total Transactions</p>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Spending by Category</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(byCategory).sort(([, a]: any, [, b]: any) => b - a).map(([cat, amt]: any) => (
              <div key={cat} className="bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                <p className="text-xs text-gray-500 capitalize">{cat}</p>
                <p className="text-sm font-bold text-gray-900">PKR {amt.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-gray-900 text-sm">All Expenses</span>
          <span className="ml-auto text-xs text-gray-400">{expenses.length} records</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses recorded" description="Add your first expense to start tracking spending." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Item', 'Amount', 'Qty', 'Vendor', 'Category', 'Date', 'Notes', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{exp.item_name}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">PKR {Number(exp.amount).toLocaleString()}</td>
                    <td className="px-4 py-4 text-gray-500">{exp.quantity || '—'}</td>
                    <td className="px-4 py-4 text-gray-500">{exp.vendor || '—'}</td>
                    <td className="px-4 py-4 text-gray-500 capitalize">{exp.category}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs">{exp.purchase_date ? format(new Date(exp.purchase_date), 'MMM d, yyyy') : format(new Date(exp.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs max-w-28 truncate">{exp.description || '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditing(exp)} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(exp)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{editing ? 'Edit Expense' : 'Record New Expense'}</h3>
              <button onClick={() => { setEditing(null); setShowAdd(false) }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Item Name', field: 'item_name', type: 'text', placeholder: 'e.g. Green Tea Restock' },
                { label: 'Amount (PKR)', field: 'amount', type: 'number', placeholder: '0' },
                { label: 'Quantity', field: 'quantity', type: 'number', placeholder: 'Optional' },
                { label: 'Vendor', field: 'vendor', type: 'text', placeholder: 'Optional' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder}
                    value={editing ? (editing[field] || '') : (form as any)[field]}
                    onChange={e => editing ? setEditing({ ...editing, [field]: e.target.value }) : setForm({ ...form, [field]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select value={editing ? editing.category : form.category}
                    onChange={e => editing ? setEditing({ ...editing, category: e.target.value }) : setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Date</label>
                    <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea rows={2} placeholder="Optional description..."
                  value={editing ? (editing.description || '') : form.description}
                  onChange={e => editing ? setEditing({ ...editing, description: e.target.value }) : setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditing(null); setShowAdd(false) }} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={editing ? handleUpdate : (e: any) => handleAdd(e)} disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{editing ? 'Update' : 'Record'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
