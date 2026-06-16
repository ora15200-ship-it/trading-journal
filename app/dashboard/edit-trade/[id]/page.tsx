'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function EditTradePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)

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

  const entryPrice = parseFloat(form.entry_price) || 0
  const stopLoss = parseFloat(form.stop_loss) || 0
  const takeProfit = parseFloat(form.take_profit) || 0
  const riskAmount = parseFloat(form.risk_amount) || 0

  const stopSize = entryPrice - stopLoss
  const shares = stopSize > 0 && riskAmount > 0 ? riskAmount / stopSize : 0
  const positionSize = shares * entryPrice
  const rewardSize = takeProfit - entryPrice
  const riskReward = stopSize > 0 && rewardSize > 0 ? rewardSize / stopSize : 0

  useEffect(() => {
    const fetchTrade = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('trades').select('*').eq('id', id).single()
      if (data) {
        setExistingImage(data.image_url || null)
        setForm({
          date: data.date || '',
          symbol: data.symbol || '',
          direction: data.direction || 'long',
          entry_price: data.entry_price?.toString() || '',
          stop_loss: data.stop_loss?.toString() || '',
          take_profit: data.take_profit?.toString() || '',
          risk_amount: data.risk_amount?.toString() || '',
          setup: data.setup || '',
          notes: data.notes || '',
          result: data.result?.toString() || '',
        })
      }
      setLoading(false)
    }
    fetchTrade()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    setSaving(true)

    const supabase = createClient()
    let image_url = existingImage

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

    const { error } = await supabase.from('trades').update({
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
    }).eq('id', id)

    setSaving(false)
    if (error) {
      alert('שגיאה בשמירה: ' + error.message)
    } else {
      window.location.href = '/dashboard'
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">טוען...</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">יומן מסחר</h1>
        <button onClick={() => window.location.href = '/dashboard'} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← חזרה לדשבורד
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">עריכת טרייד</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">תאריך *</label>
              <input type="date" name="date" required value={form.date} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">סימול *</label>
              <input type="text" name="symbol" required value={form.symbol} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <label className="block text-sm text-gray-400 mb-3">כיוון העסקה *</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, direction: 'long' })}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-lg font-bold transition-all ${form.direction === 'long' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                <span className="text-2xl">↑</span> לונג
              </button>
              <button type="button" onClick={() => setForm({ ...form, direction: 'short' })}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-lg font-bold transition-all ${form.direction === 'short' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                <span className="text-2xl">↓</span> שורט
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">מחיר כניסה *</label>
              <input type="number" name="entry_price" required step="0.01" value={form.entry_price} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-red-400 mb-1">מחיר S.L (Stop Loss)</label>
              <input type="number" name="stop_loss" step="0.01" value={form.stop_loss} onChange={handleChange}
                className="w-full bg-gray-800 border border-red-900 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-sm text-emerald-400 mb-1">מחיר T.P (Take Profit)</label>
              <input type="number" name="take_profit" step="0.01" value={form.take_profit} onChange={handleChange}
                className="w-full bg-gray-800 border border-emerald-900 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">נקודת שינה ($)</label>
              <input type="number" name="risk_amount" step="0.01" value={form.risk_amount} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          {(shares > 0 || riskReward > 0) && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm text-gray-400 mb-4 font-medium">חישובים אוטומטיים</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">כמות מניות</p>
                  <p className="text-lg font-bold text-white">{shares.toFixed(0)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">שווי עסקה</p>
                  <p className="text-lg font-bold text-white">${positionSize.toFixed(0)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">יחס סיכון/סיכוי</p>
                  <p className={`text-lg font-bold ${riskReward >= 2 ? 'text-emerald-400' : riskReward >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                    1:{riskReward.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">תמונה (צילום מסך)</label>
              {existingImage && !imagePreview && (
                <img src={existingImage} alt="תמונה קיימת" className="mb-3 rounded-lg max-h-48 object-contain border border-gray-700" />
              )}
              <input type="file" accept="image/*" onChange={handleImage}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-emerald-600 file:text-white file:text-sm cursor-pointer" />
              {imagePreview && (
                <img src={imagePreview} alt="תצוגה מקדימה" className="mt-3 rounded-lg max-h-48 object-contain border border-gray-700" />
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Setup</label>
              <input type="text" name="setup" value={form.setup} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">הערות</label>
              <textarea name="notes" rows={4} value={form.notes} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <label className="block text-sm text-gray-400 mb-1">תוצאה ($) — רווח/הפסד סופי</label>
            <input type="number" name="result" step="0.01" placeholder="השאר ריק אם הטרייד עדיין פתוח" value={form.result} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-4 rounded-xl transition-colors text-lg">
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>

        </form>
      </main>
    </div>
  )
}