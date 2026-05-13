'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { Bell, Plus, Edit2, Trash2, X, Save, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'

const PRIORITIES = ['low', 'normal', 'high', 'urgent']
const empty = { title: '', description: '', priority: 'normal', is_active: true }

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const filtered = items.filter(a => {
    if (filter === 'active') return a.is_active
    if (filter === 'inactive') return !a.is_active
    return true
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('announcements').insert({
      title: form.title, description: form.description || null,
      priority: form.priority, is_active: form.is_active,
    })
    if (!error) {
      await logActivity(`Created announcement: ${form.title}`, 'announcements', undefined, form.priority)
      setMsg('Announcement published! Staff can see it now.')
      setShowAdd(false)
      setForm({ ...empty })
      fetchItems()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  async function handleUpdate() {
    if (!editing) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('announcements').update({
      title: editing.title, description: editing.description,
      priority: editing.priority, is_active: editing.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', editing.id)
    if (!error) {
      await logActivity(`Updated announcement: ${editing.title}`, 'announcements', editing.id)
      setMsg('Announcement updated!')
      setEditing(null)
      fetchItems()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  async function handleDelete(item: any) {
    if (!confirm(`Delete announcement "${item.title}"?`)) return
    const supabase = createClient()
    await supabase.from('announcements').delete().eq('id', item.id)
    await logActivity(`Deleted announcement: ${item.title}`, 'announcements', item.id)
    fetchItems()
  }

  async function toggleActive(item: any) {
    const supabase = createClient()
    await supabase.from('announcements').update({ is_active: !item.is_active, updated_at: new Date().toISOString() }).eq('id', item.id)
    await logActivity(`${item.is_active ? 'Deactivated' : 'Activated'} announcement: ${item.title}`, 'announcements', item.id)
    fetchItems()
  }

  const priorityBorderMap: Record<string, string> = {
    urgent: 'border-l-red-500', high: 'border-l-orange-500', normal: 'border-l-blue-400', low: 'border-l-gray-300'
  }

  const Modal = ({ isEdit }: { isEdit: boolean }) => {
    const data = isEdit ? editing : form
    const set = (field: string, val: any) => isEdit
      ? setEditing({ ...editing, [field]: val })
      : setForm({ ...form, [field]: val })

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">{isEdit ? 'Edit Announcement' : 'New Announcement'}</h3>
            <button onClick={() => isEdit ? setEditing(null) : setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input value={data.title} onChange={e => set('title', e.target.value)} required
                placeholder="e.g. Sandwiches available Friday"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={data.description || ''} onChange={e => set('description', e.target.value)} rows={3}
                placeholder="Detailed message for staff..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select value={data.priority} onChange={e => set('priority', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white capitalize">
                  {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select value={data.is_active ? 'active' : 'inactive'} onChange={e => set('is_active', e.target.value === 'active')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="active">Active (visible)</option>
                  <option value="inactive">Inactive (hidden)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => isEdit ? setEditing(null) : setShowAdd(false)}
              className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={isEdit ? handleUpdate : (e: any) => handleAdd(e)} disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              {saving
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Save className="w-4 h-4" />{isEdit ? 'Update' : 'Publish'}</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Announcements"
        description="Publish notices and updates visible to all staff"
        action={
          <button onClick={() => setShowAdd(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        }
      />

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{msg}</div>
      )}

      {/* Stats + filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border capitalize ${
              filter === f ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
            }`}>
            {f} ({f === 'all' ? items.length : f === 'active' ? items.filter(a => a.is_active).length : items.filter(a => !a.is_active).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={Bell} title="No announcements" description="Create your first announcement to notify staff." />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <div key={item.id}
              className={`bg-white rounded-2xl border border-l-4 shadow-sm p-5 transition-all animate-fade-in ${priorityBorderMap[item.priority]} ${!item.is_active ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${i * 0.04}s`, opacity: item.is_active ? undefined : 0.6 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                    <Badge variant={item.priority === 'low' ? 'low_priority' : item.priority} />
                    {!item.is_active && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hidden from staff</span>
                    )}
                  </div>
                  {item.description && <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">{format(new Date(item.created_at), 'MMM d, yyyy · h:mm a')}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleActive(item)} title={item.is_active ? 'Hide from staff' : 'Show to staff'}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.is_active ? 'bg-green-50 hover:bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
                    {item.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setEditing(item)}
                    className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item)}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <Modal isEdit={false} />}
      {editing && <Modal isEdit={true} />}
    </div>
  )
}
