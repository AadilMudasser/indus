'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import PageHeader from '@/components/ui/PageHeader'
import { CalendarDays, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_ICONS = ['🥪', '🍕', '🍜', '🌮', '🥗', '🍱', '☕']

export default function AdminMenuPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [menu, setMenu] = useState<Record<number, { id?: string; items: string; notes: string }>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const weekKey = format(weekStart, 'yyyy-MM-dd')

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('weekly_menu')
      .select('*')
      .eq('week_start', weekKey)
    const mapped: typeof menu = {}
    ;(data || []).forEach((row: any) => {
      mapped[row.day_of_week] = { id: row.id, items: row.items, notes: row.notes || '' }
    })
    // Fill in missing days with empty
    for (let i = 0; i < 7; i++) {
      if (!mapped[i]) mapped[i] = { items: '', notes: '' }
    }
    setMenu(mapped)
    setLoading(false)
  }, [weekKey])

  useEffect(() => { fetchMenu() }, [fetchMenu])

  async function handleSaveDay(dayIndex: number) {
    setSaving(dayIndex)
    const supabase = createClient()
    const entry = menu[dayIndex]
    const payload = {
      week_start: weekKey,
      day_of_week: dayIndex,
      items: entry.items,
      notes: entry.notes || null,
    }
    let error
    if (entry.id) {
      const res = await supabase.from('weekly_menu').update(payload).eq('id', entry.id)
      error = res.error
    } else {
      const res = await supabase.from('weekly_menu').insert(payload)
      error = res.error
    }
    if (!error) {
      await logActivity(`Updated weekly menu: ${DAYS[dayIndex]}`, 'weekly_menu', undefined, `Week of ${weekKey}`)
      setMsg(`${DAYS[dayIndex]} menu saved!`)
      fetchMenu()
      setTimeout(() => setMsg(''), 2500)
    }
    setSaving(null)
  }

  async function handleSaveAll() {
    setSaving(-1)
    const supabase = createClient()
    for (let i = 0; i < 7; i++) {
      const entry = menu[i]
      if (!entry?.items.trim()) continue
      const payload = { week_start: weekKey, day_of_week: i, items: entry.items, notes: entry.notes || null }
      if (entry.id) {
        await supabase.from('weekly_menu').update(payload).eq('id', entry.id)
      } else {
        await supabase.from('weekly_menu').insert(payload)
      }
    }
    await logActivity(`Saved full weekly menu`, 'weekly_menu', undefined, `Week of ${weekKey}`)
    setMsg('Full week menu saved! Staff can see it now.')
    fetchMenu()
    setTimeout(() => setMsg(''), 3000)
    setSaving(null)
  }

  function updateDay(dayIndex: number, field: 'items' | 'notes', value: string) {
    setMenu(prev => ({ ...prev, [dayIndex]: { ...prev[dayIndex], [field]: value } }))
  }

  const days = Array.from({ length: 7 }, (_, i) => ({
    name: DAYS[i],
    date: addDays(weekStart, i),
    icon: DAY_ICONS[i],
    index: i,
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Weekly Snack Menu"
        description="Plan what's available each day — staff see this in announcements"
        action={
          <button onClick={handleSaveAll} disabled={saving !== null}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60">
            {saving === -1
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            Save Entire Week
          </button>
        }
      />

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{msg}</div>}

      {/* Week navigator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex items-center justify-between">
        <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-red-500" />
            Week of {format(weekStart, 'MMMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>
        <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Today indicator banner */}
      {format(weekStart, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <p className="text-sm text-red-700 font-medium">Current week — changes are live for staff</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {days.map(({ name, date, icon, index }) => {
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            const entry = menu[index] || { items: '', notes: '' }
            const isSaving = saving === index
            return (
              <div key={index}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${isToday ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{name}</p>
                      {isToday && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Today</span>}
                    </div>
                    <p className="text-xs text-gray-400">{format(date, 'MMMM d, yyyy')}</p>
                  </div>
                  <button onClick={() => handleSaveDay(index)} disabled={saving !== null}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50">
                    {isSaving
                      ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Save className="w-3 h-3" />}
                    Save
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Menu items</label>
                    <input
                      value={entry.items}
                      onChange={e => updateDay(index, 'items', e.target.value)}
                      placeholder="e.g. Sandwiches, Juice, Chips, Cold Coffee"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
                    <input
                      value={entry.notes}
                      onChange={e => updateDay(index, 'notes', e.target.value)}
                      placeholder="e.g. Available from 1pm in the break room"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
