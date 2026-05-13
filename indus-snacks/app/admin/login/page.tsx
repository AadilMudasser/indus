'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ShieldCheck, LogIn } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr || !data.user) {
      setError(authErr?.message || 'Login failed')
      setLoading(false)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('Access denied. Admin accounts only.')
      setLoading(false)
      return
    }
    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #450a0a 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Indus Snacks</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Control Panel</p>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl border border-gray-700" style={{ background: 'rgba(31,41,55,0.9)' }}>
          <h2 className="text-lg font-semibold text-white mb-1">Administrator Login</h2>
          <p className="text-gray-400 text-sm mb-6">Restricted access — admins only</p>

          {error && (
            <div className="border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3 mb-5" style={{ background: 'rgba(127,29,29,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@indushospital.com"
                className="w-full border border-gray-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-500"
                style={{ background: '#374151' }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-500 pr-12"
                  style={{ background: '#374151' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><LogIn className="w-4 h-4" />Sign In as Admin</>}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">© 2025 Indus Hospital · Admin Portal</p>
      </div>
    </div>
  )
}
