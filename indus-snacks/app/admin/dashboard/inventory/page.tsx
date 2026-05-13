'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { Package, Plus, Edit2, Trash2, X, Save, Search } from 'lucide-react'
import { InventoryItem } from '@/lib/types'

const CATEGORIES = ['snacks', 'beverages', 'food', 'frozen', 'healthy', 'other']
const UNITS = ['pcs', 'pkt', 'bags', 'bottles', 'cans', 'boxes', 'box', 'bars', 'kg', 'liters']

const emptyForm = { item_name: '', quantity: 0, price: '', unit: 'pcs', category: 'snacks', availability_status: 'available' as const }

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('inventory').select('*').order('category').order('item_name')
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function computeStatus(qty: number): 'available' | 'low' | 'out_of_stock' {
    if (qty <= 0) return 'out_of_stock'
    if (qty <= 10) return 'low'
    return 'available'
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const status = computeStatus(form.quantity)
    const { error } = await supabase.from('inventory').insert({
      item_name: form.item_name, quantity: form.quantity,
      price: form.price ? Number(form.price) : null,
      unit: form.unit, category: form.category,
      availability_status: status, updated_at: new Date().toISOString()
    })
    if (!error) {
      await logActivity(`Added inventory item: ${form.item_name}`, 'inventory', undefined, `${form.quantity} ${form.unit}`)
      setMsg('Item added!')
      setShowAdd(false)
      setForm({ ...emptyForm })
      fetchItems()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  async function handleUpdate() {
    if (!editing) return
    setSaving(true)
    const supabase = createClient()
    const status = computeStatus(editing.quantity)
    const { error } = await supabase.from('inventory').update({
      item_name: editing.item_name, quantity: editing.quantity,
      price: editing.price, unit: editing.unit, category: editing.category,
      availability_status: status, updated_at: new Date().toISOString()
    }).eq('id', editing.id)
    if (!error) {
      await logActivity(`Updated inventory: ${editing.item_name}`, 'inventory', editing.id, `Qty: ${editing.quantity}`)
      setMsg('Item updated!')
      setEditing(null)
      fetchItems()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`Delete "${item.item_name}"?`)) return
    const supabase = createClient()
    await supabase.from('inventory').delete().eq('id', item.id)
    await logActivity(`Deleted inventory item: ${item.item_name}`, 'inventory', item.id)
    fetchItems()
  }

  async function handleQuickUpdate(item: InventoryItem, delta: number) {
    const supabase = createClient()
    const newQty = Math.max(0, item.quantity + delta)
    const status = computeStatus(newQty)
    await supabase.from('inventory').update({ quantity: newQty, availability_status: status, updated_at: new Date().toISOString() }).eq('id', item.id)
    await logActivity(`${delta > 0 ? 'Increased' : 'Decreased'} stock: ${item.item_name}`, 'inventory', item.id, `New qty: ${newQty}`)
    fetchItems()
  }

  const filtered = items.filter(i => {
    const matchS = i.item_name.toLowerCase().includes(search.toLowerCase())
    const matchC = catFilter ? i.category === catFilter : true
    return matchS && matchC
  })

  const available = items.filter(i => i.availability_status === 'available').length
  const low = items.filter(i => i.availability_status === 'low').length
  const out = items.filter(i => i.availability_status === 'out_of_stock').length

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Inventory Management" description="Manage snack stock and pricing"
        action={
          <button onClick={() => setShowAdd(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        }
      />

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{msg}</div>}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-xl font-bold text-green-700">{available}</p><p className="text-xs text-green-600">Available</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 text-center">
          <p className="text-xl font-bold text-orange-700">{low}</p><p className="text-xs text-orange-600">Low Stock</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-xl font-bold text-red-700">{out}</p><p className="text-xs text-red-600">Out of Stock</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-gray-900 text-sm">Inventory Items</span>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} items</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="No items found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Item', 'Category', 'Quantity', 'Price', 'Status', 'Quick Update', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{item.item_name}</td>
                    <td className="px-5 py-4 text-gray-500 capitalize">{item.category}</td>
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${item.availability_status === 'out_of_stock' ? 'text-red-600' : item.availability_status === 'low' ? 'text-orange-600' : 'text-gray-900'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{item.price ? `PKR ${Number(item.price).toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-4"><Badge variant={item.availability_status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleQuickUpdate(item, -1)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold flex items-center justify-center transition-colors">−</button>
                        <button onClick={() => handleQuickUpdate(item, 1)} className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 text-sm font-bold flex items-center justify-center transition-colors">+</button>
                        <button onClick={() => handleQuickUpdate(item, 10)} className="px-2 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center transition-colors">+10</button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(item)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{editing ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => { setEditing(null); setShowAdd(false) }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Name</label>
                <input value={editing ? editing.item_name : form.item_name}
                  onChange={e => editing ? setEditing({ ...editing, item_name: e.target.value }) : setForm({ ...form, item_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="e.g. Green Tea" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                  <input type="number" min="0" value={editing ? editing.quantity : form.quantity}
                    onChange={e => editing ? setEditing({ ...editing, quantity: Number(e.target.value) }) : setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                  <select value={editing ? editing.unit : form.unit}
                    onChange={e => editing ? setEditing({ ...editing, unit: e.target.value }) : setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (PKR)</label>
                  <input type="number" value={editing ? (editing.price || '') : form.price}
                    onChange={e => editing ? setEditing({ ...editing, price: Number(e.target.value) }) : setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select value={editing ? editing.category : form.category}
                    onChange={e => editing ? setEditing({ ...editing, category: e.target.value }) : setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white capitalize">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditing(null); setShowAdd(false) }} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={editing ? handleUpdate : (e: any) => handleAdd(e)} disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{editing ? 'Update' : 'Add Item'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
