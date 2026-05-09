import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { Users } from 'lucide-react'
import { MONTHS } from '@/lib/types'

export default async function ContributorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'staff')
    .order('full_name')

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('month', currentMonth)
    .eq('year', currentYear)

  const profileList = profiles || []
  const paymentList = payments || []

  const paymentMap = new Map(paymentList.map(p => [p.user_id, p]))

  const paidCount = profileList.filter(p => paymentMap.get(p.id)?.status === 'paid').length

  // Group by department
  const byDept: Record<string, typeof profileList> = {}
  profileList.forEach(p => {
    const dept = p.department || 'Unassigned'
    if (!byDept[dept]) byDept[dept] = []
    byDept[dept].push(p)
  })

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Staff Contributors" description={`Payment status for ${MONTHS[currentMonth - 1]} ${currentYear}`} />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{profileList.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Staff</p>
        </div>
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{paidCount}</p>
          <p className="text-xs text-green-600 mt-0.5">Paid</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{profileList.length - paidCount}</p>
          <p className="text-xs text-red-600 mt-0.5">Due</p>
        </div>
      </div>

      {profileList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={Users} title="No staff members found" description="Staff will appear here once they register." />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDept).sort(([a], [b]) => a.localeCompare(b)).map(([dept, members]) => (
            <div key={dept} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm">{dept}</h3>
                <span className="text-xs text-gray-400">{members.length} member{members.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {members.map(member => {
                  const payment = paymentMap.get(member.id)
                  const status = payment?.status || 'due'
                  return (
                    <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 text-xs font-bold">{member.full_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {member.full_name}
                          {member.id === user.id && <span className="ml-1.5 text-xs text-red-500">(You)</span>}
                        </p>
                        <p className="text-xs text-gray-400">{member.username || member.email || '—'}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {payment && (
                          <span className="text-sm font-medium text-gray-700">
                            PKR {Number(payment.amount).toLocaleString()}
                          </span>
                        )}
                        <Badge variant={status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
