import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'

const priorityConfig: Record<string, { border: string; bg: string; dot: string }> = {
  urgent: { border: 'border-l-red-500', bg: 'bg-red-50', dot: 'bg-red-500' },
  high: { border: 'border-l-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  normal: { border: 'border-l-blue-400', bg: 'bg-blue-50', dot: 'bg-blue-400' },
  low: { border: 'border-l-gray-300', bg: 'bg-gray-50', dot: 'bg-gray-300' },
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const list = announcements || []

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
  const sorted = [...list].sort((a, b) =>
    (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
  )

  const urgentCount = list.filter(a => a.priority === 'urgent').length
  const highCount = list.filter(a => a.priority === 'high').length

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Announcements" description="Latest updates and notices from administration" />

      {/* Quick counts */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{list.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-3 text-center">
          <p className="text-lg font-bold text-red-700">{urgentCount}</p>
          <p className="text-xs text-red-600">Urgent</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-3 text-center">
          <p className="text-lg font-bold text-orange-700">{highCount}</p>
          <p className="text-xs text-orange-600">High</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 text-center">
          <p className="text-lg font-bold text-blue-700">{list.filter(a => a.priority === 'normal').length}</p>
          <p className="text-xs text-blue-600">Normal</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={Bell} title="No announcements" description="Check back later for updates from admin." />
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((a, i) => {
            const config = priorityConfig[a.priority] || priorityConfig.normal
            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${config.border} shadow-sm p-5 hover:shadow-md transition-all animate-fade-in`}
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                    <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                  </div>
                  <Badge variant={a.priority === 'low' ? 'low_priority' : a.priority} />
                </div>
                {a.description && (
                  <p className="text-sm text-gray-600 ml-4.5 leading-relaxed">{a.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-3 ml-4.5">
                  {format(new Date(a.created_at), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
