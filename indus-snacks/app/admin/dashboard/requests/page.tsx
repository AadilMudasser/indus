'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { MessageSquare, CheckCircle, XCircle, Clock, X } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [responding, setResponding] = useState<any>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchRequests = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('requests')
      .select('*, profiles(full_name, department, email)')
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const filtered = statusFilter ? requests.filter(r => r.status === statusFilter) : requests

  async function handleStatusChange(req: any, newStatus: string) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('requests').update({
      status: newStatus,
      admin_response: adminResponse || null,
      updated_at: new Date().toISOString(),
    }).eq('id', req.id)
    if (!error) {
      await logActivity(`${newStatus === 'approved' ? 'Approved' : 'Rejected'} request from ${req.profiles?.full_name}`, 'requests', req.id, req.message.slice(0, 60))
      setMsg(`Request ${newStatus}!`)
      setResponding(null)
      setAdminResponse('')
      fetchRequests()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Staff Requests" description="Review and respond to staff snack requests" />

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{msg}</div>}

      {/* Counts */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <button onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
          className={`rounded-xl border p-4 text-center transition-all ${statusFilter === 'pending' ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-yellow-50 border-yellow-100 hover:border-yellow-300'}`}>
          <p className={`text-xl font-bold ${statusFilter === 'pending' ? 'text-white' : 'text-yellow-700'}`}>{counts.pending}</p>
          <p className={`text-xs ${statusFilter === 'pending' ? 'text-yellow-100' : 'text-yellow-600'}`}>Pending</p>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'approved' ? '' : 'approved')}
          className={`rounded-xl border p-4 text-center transition-all ${statusFilter === 'approved' ? 'bg-green-500 border-green-500 text-white' : 'bg-green-50 border-green-100 hover:border-green-300'}`}>
          <p className={`text-xl font-bold ${statusFilter === 'approved' ? 'text-white' : 'text-green-700'}`}>{counts.approved}</p>
          <p className={`text-xs ${statusFilter === 'approved' ? 'text-green-100' : 'text-green-600'}`}>Approved</p>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'rejected' ? '' : 'rejected')}
          className={`rounded-xl border p-4 text-center transition-all ${statusFilter === 'rejected' ? 'bg-red-500 border-red-500 text-white' : 'bg-red-50 border-red-100 hover:border-red-300'}`}>
          <p className={`text-xl font-bold ${statusFilter === 'rejected' ? 'text-white' : 'text-red-700'}`}>{counts.rejected}</p>
          <p className={`text-xs ${statusFilter === 'rejected' ? 'text-red-100' : 'text-red-600'}`}>Rejected</p>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={MessageSquare} title="No requests" description="Staff requests will appear here." />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => (
            <div key={req.id} className={`bg-white rounded-2xl border shadow-sm p-5 animate-fade-in ${req.status === 'pending' ? 'border-yellow-200' : 'border-gray-100'}`}
              style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-xs font-bold">{req.profiles?.full_name?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{req.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{req.profiles?.department || '—'} · {format(new Date(req.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <Badge variant={req.status} />
              </div>

              <p className="text-sm text-gray-700 leading-relaxed mb-3 bg-gray-50 rounded-xl p-3">{req.message}</p>

              {req.admin_response && (
                <div className="bg-blue-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-blue-600 mb-0.5">Admin Response</p>
                  <p className="text-xs text-blue-700">{req.admin_response}</p>
                </div>
              )}

              {req.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setResponding(req); setAdminResponse('') }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => handleStatusChange(req, 'rejected')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {responding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Approve Request</h3>
              <button onClick={() => setResponding(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-4">{responding.message}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Response (optional)</label>
              <textarea value={adminResponse} onChange={e => setAdminResponse(e.target.value)} rows={3}
                placeholder="e.g. Request approved! Will be added to next order."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setResponding(null)} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleStatusChange(responding, 'approved')} disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" />Approve</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
