'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'
import PageHeader from '@/components/ui/PageHeader'
import { Settings, Save, Lock, DollarSign, Package, Bell, Building2 } from 'lucide-react'
import { DEPARTMENTS } from '@/lib/types'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState({ full_name: '', username: '', department: '' })
  const [passwords, setPasswords] = useState({ new: '', confirm: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Record<string, string>>({})

  function showMsg(key: string, msg: string) {
    setMsgs(prev => ({ ...prev, [key]: msg }))
    setTimeout(() => setMsgs(prev => { const n = { ...prev }; delete n[key]; return n }), 3000)
  }

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [settingsRes, profileRes] = await Promise.all([
      supabase.from('app_settings').select('*'),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    const map: Record<string, string> = {}
    ;(settingsRes.data || []).forEach((s: any) => { map[s.key] = s.value })
    setSettings(map)
    if (profileRes.data) setProfile({ full_name: profileRes.data.full_name || '', username: profileRes.data.username || '', department: profileRes.data.department || '' })
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveSetting(key: string, label: string) {
    setSaving(key)
    const supabase = createClient()
    await supabase.from('app_settings').update({ value: settings[key], updated_at: new Date().toISOString() }).eq('key', key)
    await logActivity(`Updated setting: ${label} → ${settings[key]}`, 'app_settings')
    showMsg(key, `${label} updated!`)
    setSaving(null)
  }

  async function saveProfile() {
    setSaving('profile')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ full_name: profile.full_name, username: profile.username, department: profile.department, updated_at: new Date().toISOString() }).eq('id', user.id)
    await logActivity('Updated admin profile', 'profiles', user.id)
    showMsg('profile', 'Profile updated!')
    setSaving(null)
  }

  async function changePassword() {
    if (passwords.new !== passwords.confirm) { showMsg('password', 'Passwords do not match'); return }
    if (passwords.new.length < 6) { showMsg('password', 'Min 6 characters required'); return }
    setSaving('password')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    if (error) showMsg('password', 'Error: ' + error.message)
    else { showMsg('password', 'Password changed!'); setPasswords({ new: '', confirm: '' }) }
    setSaving(null)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-red-500" /> {title}
      </h3>
      {children}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Admin Settings" description="Configure the system and your admin account" />

      {/* App settings */}
      <Section icon={Settings} title="System Settings">
        <div className="space-y-4">
          {/* Monthly contribution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Contribution Amount (PKR)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" value={settings['monthly_contribution'] || ''} min="0"
                  onChange={e => setSettings(s => ({ ...s, monthly_contribution: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <button onClick={() => saveSetting('monthly_contribution', 'Monthly contribution')} disabled={saving === 'monthly_contribution'}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-60">
                {saving === 'monthly_contribution' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
            {msgs['monthly_contribution'] && <p className="text-xs text-green-600 mt-1">{msgs['monthly_contribution']}</p>}
            <p className="text-xs text-gray-400 mt-1">This is shown to staff as the expected contribution per month</p>
          </div>

          {/* Low stock threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Low Stock Threshold (units)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" value={settings['low_stock_threshold'] || ''} min="1"
                  onChange={e => setSettings(s => ({ ...s, low_stock_threshold: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <button onClick={() => saveSetting('low_stock_threshold', 'Low stock threshold')} disabled={saving === 'low_stock_threshold'}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-60">
                {saving === 'low_stock_threshold' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
            {msgs['low_stock_threshold'] && <p className="text-xs text-green-600 mt-1">{msgs['low_stock_threshold']}</p>}
          </div>

          {/* App name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">App Display Name</label>
            <div className="flex gap-2">
              <input value={settings['app_name'] || ''} onChange={e => setSettings(s => ({ ...s, app_name: e.target.value }))}
                placeholder="Indus Snacks Management System"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              <button onClick={() => saveSetting('app_name', 'App name')} disabled={saving === 'app_name'}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-60">
                {saving === 'app_name' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
            {msgs['app_name'] && <p className="text-xs text-green-600 mt-1">{msgs['app_name']}</p>}
          </div>
        </div>
      </Section>

      {/* Admin Profile */}
      <Section icon={Building2} title="Admin Profile">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
            <select value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
              <option value="">No department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {msgs['profile'] && <p className="text-xs text-green-600">{msgs['profile']}</p>}
          <div className="flex justify-end">
            <button onClick={saveProfile} disabled={saving === 'profile'}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-60">
              {saving === 'profile' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </div>
      </Section>

      {/* Password change */}
      <Section icon={Lock} title="Change Password">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
              placeholder="Min. 6 characters"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-400" />
          </div>
          {msgs['password'] && (
            <p className={`text-xs ${msgs['password'].startsWith('Error') || msgs['password'].includes('match') || msgs['password'].includes('Min') ? 'text-red-600' : 'text-green-600'}`}>
              {msgs['password']}
            </p>
          )}
          <div className="flex justify-end">
            <button onClick={changePassword} disabled={saving === 'password'}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-60">
              {saving === 'password' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </div>
      </Section>

      {/* Info */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" /> System Information
        </h3>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex justify-between"><span>Database</span><span className="font-medium text-gray-700">Supabase (PostgreSQL)</span></div>
          <div className="flex justify-between"><span>Auth Provider</span><span className="font-medium text-gray-700">Supabase Auth</span></div>
          <div className="flex justify-between"><span>Realtime</span><span className="font-medium text-green-600">● Active</span></div>
          <div className="flex justify-between"><span>Version</span><span className="font-medium text-gray-700">v1.0 — Admin Panel</span></div>
          <div className="flex justify-between"><span>Project</span><span className="font-medium text-gray-700">lhngrtyvqiifnqqjoekb</span></div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">© 2025 Indus Hospital · Admin Portal v1.0</p>
    </div>
  )
}
