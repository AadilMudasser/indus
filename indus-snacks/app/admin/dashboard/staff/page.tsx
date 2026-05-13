'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { Users, Search, Edit2, Trash2, UserPlus, X, Save, ChevronDown } from 'lucide-react'
import { Profile, DEPARTMENTS } from '@/lib/types'

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [newStaff, setNewStaff] = useState({ full_name: '', username: '', email: '', department: '', password: '', role: 'staff' })

  const fetchStaff = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setStaff(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const filtered = staff.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter ? s.department === deptFilter : true
    return matchSearch && matchDept
  })

  async function handleUpdateStaff() {
    if (!editingStaff) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: editingStaff.full_name,
      username: editingStaff.username,
      department: editingStaff.department,
      role: editingStaff.role,
      updated_at: new Date().toISOString(),
    }).eq('id', editingStaff.id)
    if (!error) {
      await logActivity(`Updated staff profile`, 'profiles', editingStaff.id, editingStaff.full_name)
      setMsg('Staff updated!')
      setEditingStaff(null)
      fetchStaff()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  async function handleDeleteStaff(s: Profile) {
    if (!confirm(`Delete ${s.full_name}? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('profiles').delete().eq('id', s.id)
    await logActivity(`Deleted staff account`, 'profiles', s.id, s.full_name)
    fetchStaff()
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    // Create auth user via admin API is not available client-side; use signUp
    const { data, error } = await supabase.auth.signUp({
      email: newStaff.email,
      password: newStaff.password,
      options: { data: { full_name: newStaff.full_name, username: newStaff.username } }
    })
    if (error) { setMsg('Error: ' + error.message); setSaving(false); return }
    if (data.user) {
      await supabase.from('profiles').update({ department: newStaff.department, role: newStaff.role }).eq('id', data.user.id)
      await logActivity(`Created new staff account`, 'profiles', data.user.id, newStaff.full_name)
    }
    setMsg('Staff account created! They will receive a confirmation email.')
    setShowAddModal(false)
    setNewStaff({ full_name: '', username: '', email: '', department: '', password: '', role: 'staff' })
    fetchStaff()
    setTimeout(() => setMsg(''), 4000)
    setSaving(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Staff Management"
        description="Manage all hospital staff accounts"
        action={
          <button onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
            <UserPlus className="w-4 h-4" /> Add Staff
          </button>
        }
      />

      {msg && <div className={`rounded-xl px-4 py-3 mb-4 text-sm border ${msg.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>{msg}</div>}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, department..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <div className="relative">
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white pr-8 appearance-none">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-gray-900 text-sm">All Staff</span>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No staff found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs font-bold">{s.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.full_name}</p>
                          <p className="text-xs text-gray-400">@{s.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{s.email || '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{s.department || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingStaff(s)}
                          className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteStaff(s)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors">
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

      {/* Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Edit Staff Member</h3>
              <button onClick={() => setEditingStaff(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input value={editingStaff.full_name} onChange={e => setEditingStaff({ ...editingStaff, full_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input value={editingStaff.username || ''} onChange={e => setEditingStaff({ ...editingStaff, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <select value={editingStaff.department || ''} onChange={e => setEditingStaff({ ...editingStaff, department: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="">No department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select value={editingStaff.role} onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value as 'staff' | 'admin' })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingStaff(null)} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleUpdateStaff} disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Add New Staff Member</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-4">
              {['full_name', 'username', 'email', 'password'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">{field.replace('_', ' ')}</label>
                  <input
                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                    required value={(newStaff as any)[field]}
                    onChange={e => setNewStaff({ ...newStaff, [field]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <select value={newStaff.department} onChange={e => setNewStaff({ ...newStaff, department: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="">No department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" />Create</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
