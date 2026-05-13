'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { ClipboardList, Search, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const ENTITY_COLORS: Record<string, string> = {
  profiles: 'bg-purple-100 text-purple-700',
  payments: 'bg-green-100 text-green-700',
  inventory: 'bg-blue-100 text-blue-700',
  expenses: 'bg-red-100 text-red-700',
  announcements: 'bg-orange-100 text-orange-700',
  requests: 'bg-yellow-100 text-yellow-700',
  financial_summary: 'bg-teal-100 text-teal-700',
  weekly_menu: 'bg-pink-100 text-pink-700',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('activity_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(200)
    setLogs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = logs.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(search.toLowerCase())
    const matchEntity = entityFilter ? l.entity === entityFilter : true
    return matchSearch && matchEntity
  })

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const entities = [...new Set(logs.map(l => l.entity))].sort()

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Activity Logs"
        description="Full audit trail of all admin actions"
        action={
          <button onClick={fetchLogs}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search actions, admin, details..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(0) }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
          <option value="">All Sections</option>
          {entities.map(e => <option key={e} value={e} className="capitalize">{e.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {['profiles', 'payments', 'inventory', 'expenses'].map(entity => (
          <button key={entity} onClick={() => { setEntityFilter(entityFilter === entity ? '' : entity); setPage(0) }}
            className={`rounded-xl border p-3 text-center text-xs font-medium transition-all capitalize ${entityFilter === entity ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300 shadow-sm'}`}>
            <p className="text-sm font-bold mb-0.5">{logs.filter(l => l.entity === entity).length}</p>
            {entity}
          </button>
        ))}
      </div>

      {/* Logs list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-gray-900 text-sm">Audit Trail</span>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} entries</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : paginated.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No activity logs yet" description="Admin actions will be recorded here automatically." />
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {paginated.map((log, i) => (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}>
                  {/* Icon dot */}
                  <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ENTITY_COLORS[log.entity] || 'bg-gray-100 text-gray-600'}`}>
                        {log.entity?.replace('_', ' ')}
                      </span>
                    </div>
                    {log.details && <p className="text-xs text-gray-500 truncate">{log.details}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      By <span className="font-medium text-gray-600">{log.profiles?.full_name || 'System'}</span>
                      {' · '}
                      {format(new Date(log.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
