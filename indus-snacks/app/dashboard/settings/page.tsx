'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { Settings, User, Lock, Save } from 'lucide-react'
import { DEPARTMENTS } from '@/lib/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState({ full_name: '', username: '', department: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile({ full_name: data.full_name || '', username: data.username || '', department: data.department || '', email: data.email || user.email || '' })
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, username: profile.username, department: profile.department, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) setError(error.message)
    else { setSuccess('Profile updated successfully!'); setTimeout(() => setSuccess(''), 3000) }
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) { setPwError('Passwords do not match'); return }
    if (passwords.new.length < 6) { setPwError('Password must be at least 6 characters'); return }
    setPwSaving(true)
    setPwError('')
    setPwSuccess('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    if (error) setPwError(error.message)
    else { setPwSuccess('Password changed successfully!'); setPasswords({ current: '', new: '', confirm: '' }); setTimeout(() => setPwSuccess(''), 3000) }
    setPwSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Manage your account and preferences" />

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 animate-fade-in">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-red-500" />
          Profile Information
        </h3>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{success}</div>}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={profile.full_name}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
            <select
              value={profile.department}
              onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="">No department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in stagger-1">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <Lock className="w-4 h-4 text-red-500" />
          Change Password
        </h3>

        {pwError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{pwError}</div>}
        {pwSuccess && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{pwSuccess}</div>}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              minLength={6}
              value={passwords.new}
              onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
              placeholder="Min. 6 characters"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Re-enter new password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwSaving}
              className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm"
            >
              {pwSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* App info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">Indus Snacks Management System · v1.0</p>
        <p className="text-xs text-gray-300 mt-0.5">Built for Indus Hospital Staff</p>
      </div>
    </div>
  )
}
