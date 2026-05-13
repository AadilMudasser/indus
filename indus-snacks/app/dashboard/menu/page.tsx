import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { CalendarDays } from 'lucide-react'
import { startOfWeek, addDays, format } from 'date-fns'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_ICONS = ['🥪', '🍕', '🍜', '🌮', '🥗', '🍱', '☕']

export default async function StaffMenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekKey = format(weekStart, 'yyyy-MM-dd')

  const { data: menuItems } = await supabase
    .from('weekly_menu')
    .select('*')
    .eq('week_start', weekKey)

  const menuMap: Record<number, any> = {}
  ;(menuItems || []).forEach((row: any) => { menuMap[row.day_of_week] = row })

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="This Week's Menu"
        description={`Week of ${format(weekStart, 'MMMM d')} – ${format(addDays(weekStart, 6), 'MMMM d, yyyy')}`}
      />

      {!menuItems || menuItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-red-400" />
          </div>
          <p className="font-semibold text-gray-700">No menu planned for this week yet</p>
          <p className="text-sm text-gray-400 mt-1">Check back later — admin will update the weekly menu soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 7 }, (_, i) => {
            const date = addDays(weekStart, i)
            const dateKey = format(date, 'yyyy-MM-dd')
            const isToday = dateKey === today
            const entry = menuMap[i]

            return (
              <div key={i}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${isToday ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'} ${!entry ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{DAY_ICONS[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-900">{DAYS[i]}</p>
                      <p className="text-xs text-gray-400">{format(date, 'MMMM d')}</p>
                      {isToday && (
                        <span className="text-xs bg-red-600 text-white px-2.5 py-0.5 rounded-full font-medium">Today</span>
                      )}
                    </div>
                    {entry ? (
                      <>
                        <p className="text-sm text-gray-700 font-medium">{entry.items}</p>
                        {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not planned</p>
                    )}
                  </div>
                  {isToday && entry && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Available now
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-6">
        Menu is updated weekly by admin. Check back Monday mornings for updates.
      </p>
    </div>
  )
}
