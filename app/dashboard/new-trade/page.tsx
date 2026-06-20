'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function NewTradePage() {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    date: '',
    symbol: '',
    direction: 'long',
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    risk_amount: '',
    setup: '',
    notes: '',
    result: '',
  })

  const getPortfolioId = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('portfolio')
  }

  const entryPrice = parseFloat(form.entry_price) || 0
  const stopLoss = parseFloat(form.stop_loss) || 0
  const takeProfit = parseFloat(form.take_profit) || 0
  const riskAmount = parseFloat(form.risk_amount) || 0

  const stopSize = entryPrice - stopLoss
  const shares = stopSize > 0 && riskAmount > 0 ? riskAmount / stopSize : 0
  const positionSize = shares * entryPrice
  const rewardSize = takeProfit - entryPrice
  const riskReward = stopSize > 0 && rewardSize > 0 ? rewardSize / stopSize : 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const portfolioId = getPortfolioId()
    let image_url = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trade-images')
        .upload(fileName, imageFile)

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('trade-images')
          .getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('trades').insert([{
      user_id: user?.id,
      portfolio_id: portfolioId || null,
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      entry_price: entryPrice || null,
      stop_loss: stopLoss || null,
      take_profit: takeProfit || null,
      risk_amount: riskAmount || null,
      shares: shares || null,
      position_size: positionSize || null,
      risk_reward: riskReward || null,
      setup: form.setup || null,
      notes: form.notes || null,
      result: form.result ? parseFloat(form.result) : null,
      image_url,
    }])

    setLoading(false)

    if (error) {
      alert('שגיאה בשמירה: ' + error.message)
    } else {
      window.location.href = portfolioId ? `/dashboard?portfolio=${portfolioId}` : '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-zen-charcoal text-zen-cream">
      <nav className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <img src="/logo.svg" alt="ZenStock" className="h-8 w-auto" />
        <button
          onClick={() => {
            const portfolioId = getPortfolioId()
            window.location.href = portfolioId ? `/dashboard?portfolio=${portfolioId}` : '/dashboard'
          }}
          className="text-sm text-zen-cream/50 hover:text-zen-cream transition-colors">
          ← חזרה לדשבורד
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="font-display text-2xl mb-8">טרייד חדש</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">תאריך *</label>
              <input type="date" name="date" required value={form.date} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream focus:outline-none focus:border-zen-sage" />
            </div>
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">סימול *</label>
              <input type="text" name="symbol" required placeholder="למשל: AAPL, TSLA" value={form.symbol} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <label className="block text-sm text-zen-cream/50 mb-3">כיוון העסקה *</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, direction: 'long' })}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-lg font-semibold transition-all ${form.direction === 'long' ? 'border-zen-sage bg-zen-sage/15 text-zen-sage' : 'border-white/10 text-zen-cream/50 hover:border-white/25'}`}>
                <span className="text-2xl">↑</span> לונג
              </button>
              <button type="button" onClick={() => setForm({ ...form, direction: 'short' })}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-lg font-semibold transition-all ${form.direction === 'short' ? 'border-red-500 bg-red-500/15 text-red-400' : 'border-white/10 text-zen-cream/50 hover:border-white/25'}`}>
                <span className="text-2xl">↓</span> שורט
              </button>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">מחיר כניסה *</label>
              <input type="number" name="entry_price" required step="0.01" placeholder="0.00" value={form.entry_price} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage" />
            </div>
            <div>
              <label className="block text-sm text-red-400 mb-1">מחיר S.L (Stop Loss)</label>
              <input type="number" name="stop_loss" step="0.01" placeholder="0.00" value={form.stop_loss} onChange={handleChange}
                className="w-full bg-white/5 border border-red-900/50 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-sm text-zen-sage mb-1">מחיר T.P (Take Profit)</label>
              <input type="number" name="take_profit" step="0.01" placeholder="0.00" value={form.take_profit} onChange={handleChange}
                className="w-full bg-white/5 border border-zen-sage/30 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage" />
            </div>
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">נקודת שינה ($) — כמה מוכן לסכן</label>
              <input type="number" name="risk_amount" step="0.01" placeholder="100" value={form.risk_amount} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage" />
            </div>
          </div>

          {(shares > 0 || riskReward > 0) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h3 className="text-sm text-zen-cream/50 mb-4 font-medium">חישובים אוטומטיים</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-zen-cream/40 mb-1">כמות מניות</p>
                  <p className="text-lg font-semibold text-zen-cream">{shares.toFixed(0)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-zen-cream/40 mb-1">שווי עסקה</p>
                  <p className="text-lg font-semibold text-zen-cream">${positionSize.toFixed(0)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-zen-cream/40 mb-1">יחס סיכון/סיכוי</p>
                  <p className={`text-lg font-semibold ${riskReward >= 2 ? 'text-zen-sage' : riskReward >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
                    1:{riskReward.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">Setup</label>
              <input type="text" name="setup" placeholder="למשל: breakout, pullback..." value={form.setup} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage" />
            </div>
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">הערות</label>
              <textarea name="notes" rows={4} placeholder="תחושות, סיבות, תיאור הטרייד..." value={form.notes} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage resize-none" />
            </div>
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">תמונה (צילום מסך)</label>
              <input type="file" accept="image/*" onChange={handleImage}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zen-sage file:text-zen-charcoal file:text-sm cursor-pointer" />
              {imagePreview && (
                <img src={imagePreview} alt="תצוגה מקדימה" className="mt-3 rounded-lg max-h-48 object-contain border border-white/10" />
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <label className="block text-sm text-zen-cream/50 mb-1">תוצאה ($) — רווח/הפסד סופי</label>
            <input type="number" name="result" step="0.01" placeholder="השאר ריק אם הטרייד עדיין פתוח" value={form.result} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-zen-sage hover:opacity-90 disabled:opacity-40 text-zen-charcoal font-semibold py-4 rounded-xl transition-opacity text-lg">
            {loading ? 'שומר...' : 'שמור טרייד'}
          </button>

        </form>
      </main>
    </div>
  )
}