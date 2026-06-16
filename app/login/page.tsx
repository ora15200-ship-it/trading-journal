'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const supabase = createClient()

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError('שגיאה בשליחת המייל')
      } else {
        setSuccess('נשלח אליך מייל לאיפוס סיסמה — בדוק את תיבת הדואר שלך')
      }
      setLoading(false)
      return
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = '/dashboard'
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('אימייל או סיסמה שגויים')
      } else {
        window.location.href = '/dashboard'
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">יומן מסחר</h1>
          <p className="text-gray-400">
            {isForgot ? 'איפוס סיסמה' : isSignUp ? 'צור חשבון חדש' : 'התחבר לחשבון שלך'}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1">אימייל</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {!isForgot && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">סיסמה</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'טוען...' : isForgot ? 'שלח מייל איפוס' : isSignUp ? 'הרשמה' : 'התחברות'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center">
            {!isForgot && (
              <button
                onClick={() => { setIsForgot(true); setError(''); setSuccess('') }}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                שכחת סיסמה?
              </button>
            )}
            {isForgot ? (
              <button
                onClick={() => { setIsForgot(false); setError(''); setSuccess('') }}
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                חזרה להתחברות
              </button>
            ) : (
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                {isSignUp ? 'כבר יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}