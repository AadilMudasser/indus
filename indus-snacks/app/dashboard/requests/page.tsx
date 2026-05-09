'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { MessageSquarePlus, Send } from 'lucide-react'
import { Request } from '@/lib/types'
import { format } from 'date-fns'

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchRequests = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('requests').insert({
      user_id: user.id,
      message: message.trim(),
      status: 'pending',
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Request submitted successfully!')
      setMessage('')
      fetchRequests()
      setTimeout(() => setSuccess(''), 3000)
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Requests & Suggestions" description="Submit snack requests or suggestions for the team" />

      {/* Submit form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 animate-fade-in">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-red-500" />
          New Request
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Please add cold coffee to the inventory. We love it during night shifts!"
            rows={3}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">{message.length}/500 characters</p>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm"
            >
              {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Requests history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in stagger-1">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-gray-900 text-sm">My Requests</h3>
          <span className="ml-auto text-xs text-gray-400">{requests.length} total</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            title="No requests yet"
            description="Submit your first snack request or suggestion above."
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {requests.map((req, i) => (
              <div key={req.id} className="p-5 hover:bg-gray-50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm text-gray-900 font-medium flex-1">{req.message}</p>
                  <Badge variant={req.status} />
                </div>
                {req.admin_response && (
                  <div className="bg-blue-50 rounded-lg px-3 py-2 mt-2 mb-2">
                    <p className="text-xs text-blue-600 font-medium">Admin response:</p>
                    <p className="text-xs text-blue-700 mt-0.5">{req.admin_response}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400">{format(new Date(req.created_at), 'MMM d, yyyy · h:mm a')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
