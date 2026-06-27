'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function NewTradePage() {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])

  const [form, setForm] = useState({
    date: '',
    symbol: '',
    direction: 'long',
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    risk_amount: '',
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

  const rrColorClass =
    riskReward >= 2 ? 'text-zen-sage' : riskReward >= 1 ? 'text-amber-400' : 'text-red-400'
  const rrBorderClass =
    riskReward >= 2 ? 'border-zen-sage' : riskReward >= 1 ? 'border-amber-400' : 'border-red-400'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const next = files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setImages((prev) => [...prev, ...next])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const portfolioId = getPortfolioId()
    const image_urls: string[] = []

    for (const img of images) {
      const fileExt = img.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trade-images')
        .upload(fileName, img.file)

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('trade-images').getPublicUrl(fileName)
        image_urls.push(urlData.publicUrl)
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
      notes: form.notes || null,
      result: form.result ? parseFloat(form.result) : null,
      image_urls,
    }])

    setLoading(false)
    if (error) {
      alert('שגיאה בשמירה: ' + error.message)
      return
    }
    window.location.href = portfolioId ? `/dashboard?portfolio=${portfolioId}` : '/dashboard'
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* לבנה 1: פרטים יבשים + אוטומטים */}
          <section className="flex flex-col gap-4">
            <p className="text-xs text-zen-cream/40 uppercase tracking-wide">פרטי עסקה</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-blue-300 mb-1">תאריך</label>
                <input type="date" name="date" required value={form.date} onChange={handleChange}
                  className="w-full bg-zen-cream text-zen-charcoal rounded-lg px-4 py-2.5 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-blue-300 mb-1">סימול</label>
                <input type="text" name="symbol" required placeholder="AAPL" value={form.symbol} onChange={handleChange}
                  className="w-full bg-zen-cream text-zen-charcoal rounded-lg px-4 py-2.5 placeholder-zen-charcoal/40 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-blue-300 mb-1">כיוון</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm({ ...form, direction: 'long' })}
                  className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${form.direction === 'long' ? 'border-zen-sage bg-white/5 text-zen-sage' : 'border-white/10 text-zen-cream/40'}`}>
                  לונג
                </button>
                <button type="button" onClick={() => setForm({ ...form, direction: 'short' })}
                  className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${form.direction === 'short' ? 'border-red-400 bg-white/5 text-red-400' : 'border-white/10 text-zen-cream/40'}`}>
                  שורט
                </button>
              </div>
            </div>

            <p className="text-xs text-zen-cream/40 uppercase tracking-wide mt-2">מחירים וסיכון</p>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-blue-300 mb-1">כניסה</label>
                <input type="number" name="entry_price" required step="0.01" value={form.entry_price} onChange={handleChange}
                  className="w-full bg-zen-cream text-zen-charcoal rounded-lg px-3 py-2.5 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-red-400 mb-1">S.L</label>
                <input type="number" name="stop_loss" step="0.01" value={form.stop_loss} onChange={handleChange}
                  className="w-full bg-zen-cream text-zen-charcoal rounded-lg px-3 py-2.5 border-2 border-red-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zen-sage mb-1">T.P</label>
                <input type="number" name="take_profit" step="0.01" value={form.take_profit} onChange={handleChange}
                  className="w-full bg-zen-cream text-zen-charcoal rounded-lg px-3 py-2.5 border-2 border-zen-sage focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zen-sage mb-1">נקודת שינה ($)</label>
                <input type="number" name="risk_amount" step="0.01" value={form.risk_amount} onChange={handleChange}
                  className="w-full bg-zen-cream text-zen-charcoal rounded-lg px-3 py-2.5 border-2 border-zen-sage focus:outline-none" />
              </div>
            </div>

            {(shares > 0 || riskReward > 0) && (
              <div className="grid grid-cols-3 gap-3 mt-1">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-zen-cream/40 mb-1">כמות</p>
                  <p className="text-base font-semibold">{shares.toFixed(0)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-zen-cream/40 mb-1">שווי עסקה</p>
                  <p className="text-base font-semibold">${positionSize.toFixed(0)}</p>
                </div>
                <div className={`bg-white/5 rounded-lg p-3 text-center border ${rrBorderClass}`}>
                  <p className="text-xs text-zen-cream/40 mb-1">R:R</p>
                  <p className={`text-base font-semibold ${rrColorClass}`}>1:{riskReward.toFixed(1)}</p>
                </div>
              </div>
            )}
          </section>

          {/* לבנה 2: תיעוד */}
          <section className="bg-white/5 rounded-xl p-5 flex flex-col gap-4">
            <p className="text-xs text-zen-cream/40 uppercase tracking-wide">תיעוד</p>
            <div>
              <label className="block text-sm text-blue-300 mb-2">תמונות מהפלטפורמה</label>
              <div className="grid grid-cols-3 gap-3">
                <label className="bg-zen-cream rounded-lg h-24 flex items-center justify-center text-zen-charcoal/40 text-2xl cursor-pointer">
                  +
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
                {images.map((img, i) => (
                  <div key={i} className="relative bg-zen-cream rounded-lg h-24 overflow-hidden">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-zen-charcoal/70 text-zen-cream rounded-full w-5 h-5 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-blue-300 mb-1">הערות</label>
              <textarea name="notes" rows={3} placeholder="תחושות, סיבות, תיאור הטרייד..." value={form.notes} onChange={handleChange}
                className="w-full bg-zen-cream text-zen-charcoal rounded-lg px-4 py-2.5 placeholder-zen-charcoal/40 resize-none focus:outline-none" />
            </div>
          </section>

          <div>
            <label className="block text-sm text-zen-cream/50 mb-1">תוצאה ($) — השאר ריק אם פתוח</label>
            <input type="number" name="result" step="0.01" value={form.result} onChange={handleChange}
              className="w-full bg-zen-cream text-zen-charcoal rounded-lg px-4 py-2.5 focus:outline-none" />
          </div>

          {/* לבנה 3 */}
          <button type="submit" disabled={loading}
            className="w-full bg-zen-sage hover:opacity-90 disabled:opacity-40 text-zen-charcoal font-semibold py-3.5 rounded-2xl transition-opacity">
            {loading ? 'שומר...' : 'שמור טרייד'}
          </button>

        </form>
      </main>
    </div>
  )
}