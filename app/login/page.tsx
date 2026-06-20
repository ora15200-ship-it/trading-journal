'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (isSignUp && !isForgot && !agreedToTerms) {
      setError('יש לאשר את התקנון לפני ההרשמה')
      return
    }

    setLoading(true)

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

  const submitDisabled = loading || (isSignUp && !isForgot && !agreedToTerms)

  return (
    <div className="min-h-screen bg-zen-charcoal text-zen-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="ZenStock" className="h-10 w-auto mx-auto mb-4" />
          <p className="text-zen-cream/60">
            {isForgot ? 'איפוס סיסמה' : isSignUp ? 'צור חשבון חדש' : 'התחבר לחשבון שלך'}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">אימייל</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage"
              />
            </div>

            {!isForgot && (
              <div>
                <label className="block text-sm text-zen-cream/50 mb-1">סיסמה</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage"
                />
              </div>
            )}

            {isSignUp && !isForgot && (
              <label className="flex items-start gap-2 text-sm text-zen-cream/70">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-1 accent-zen-sage h-4 w-4"
                />
                <span>
                  קראתי ואני מסכים/ה ל
                  <Link href="/terms" target="_blank" className="text-zen-sage underline mx-1">
                    תקנון ולהצהרת האחריות
                  </Link>
                  של ZenStock
                </span>
              </label>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-zen-sage/15 border border-zen-sage/40 rounded-lg px-4 py-3 text-zen-sage text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full bg-zen-sage hover:opacity-90 disabled:opacity-40 text-zen-charcoal font-semibold py-3 rounded-lg transition-opacity"
            >
              {loading ? 'טוען...' : isForgot ? 'שלח מייל איפוס' : isSignUp ? 'הרשמה' : 'התחברות'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center">
            {!isForgot && (
              <button
                onClick={() => { setIsForgot(true); setError(''); setSuccess('') }}
                className="text-sm text-zen-cream/40 hover:text-zen-cream/70 transition-colors"
              >
                שכחת סיסמה?
              </button>
            )}
            {isForgot ? (
              <button
                onClick={() => { setIsForgot(false); setError(''); setSuccess('') }}
                className="text-sm text-zen-cream/50 hover:text-zen-sage transition-colors"
              >
                חזרה להתחברות
              </button>
            ) : (
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
                className="text-sm text-zen-cream/50 hover:text-zen-sage transition-colors"
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