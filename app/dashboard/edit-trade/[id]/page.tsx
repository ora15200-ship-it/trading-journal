'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function EditTradePage() {
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [portfolioId, setPortfolioId] = useState<string | null>(null)

  const [form, setForm] = useState({
    date: '',
    symbol: '',
    direction: 'long',
    entry_price: '',
    setup: '',
    notes: '',
    result: '',
  })

  useEffect(() => {
    const fetchTrade = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('trades').select('*').eq('id', id).single()
      if (data) {
        setExistingImage(data.image_url || null)
        setPortfolioId(data.portfolio_id || null)
        setForm({
          date: data.date || '',
          symbol: data.symbol || '',
          direction: data.direction || 'long',
          entry_price: data.entry_price?.toString() || '',
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
      entry_price: parseFloat(form.entry_price) || null,
      setup: form.setup || null,
      notes: form.notes || null,
      result: form.result ? parseFloat(form.result) : null,
      image_url,
    }).eq('id', id)

    setSaving(false)
    if (error) {
      alert('שגיאה בשמירה: ' + error.message)
    } else {
      window.location.href = portfolioId ? `/dashboard?portfolio=${portfolioId}` : '/dashboard'
    }
  }

  if (loading) return <div className="min-h-screen bg-zen-charcoal text-zen-cream flex items-center justify-center">טוען...</div>

  return (
    <div className="min-h-screen bg-zen-charcoal text-zen-cream">
      <nav className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <img src="/logo.svg" alt="ZenStock" className="h-8 w-auto" />
        <button
          onClick={() => window.location.href = portfolioId ? `/dashboard?portfolio=${portfolioId}` : '/dashboard'}
          className="text-sm text-zen-cream/50 hover:text-zen-cream transition-colors">
          ← חזרה לדשבורד
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="font-display text-2xl mb-2">עריכת פרטי כניסה</h2>
        <p className="text-sm text-zen-cream/50 mb-6">
          תיקון עובדות בסיסיות בלבד (תאריך, סימול, כניסה, הערות). לעדכון S.L / T.P עבור לדף ניהול העסקה.
        </p>

        <a href={`/dashboard/manage-trade/${id}`}
          className="inline-block mb-8 text-sm bg-zen-sage/15 border border-zen-sage/30 text-zen-sage px-4 py-2 rounded-lg hover:bg-zen-sage/25 transition-colors">
          → לדף ניהול עסקה דינמי (S.L / T.P)
        </a>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">תאריך *</label>
              <input type="date" name="date" required value={form.date} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream focus:outline-none focus:border-zen-sage" />
            </div>
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">סימול *</label>
              <input type="text" name="symbol" required value={form.symbol} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream focus:outline-none focus:border-zen-sage" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <label className="block text-sm text-zen-cream/50 mb-3">כיוון העסקה *</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, direction: 'long' })}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-lg font-semibold transition-all ${form.direction === 'long' ? 'border-zen-profit bg-zen-profit/15 text-zen-profit' : 'border-white/10 text-zen-cream/50 hover:border-white/25'}`}>
                <span className="text-2xl">↑</span> לונג
              </button>
              <button type="button" onClick={() => setForm({ ...form, direction: 'short' })}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-lg font-semibold transition-all ${form.direction === 'short' ? 'border-red-500 bg-red-500/15 text-red-400' : 'border-white/10 text-zen-cream/50 hover:border-white/25'}`}>
                <span className="text-2xl">↓</span> שורט
              </button>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <label className="block text-sm text-zen-cream/50 mb-1">מחיר כניסה *</label>
            <input type="number" name="entry_price" required step="0.01" value={form.entry_price} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream focus:outline-none focus:border-zen-sage" />
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">תמונה (צילום מסך)</label>
              {existingImage && !imagePreview && (
                <img src={existingImage} alt="תמונה קיימת" className="mb-3 rounded-lg max-h-48 object-contain border border-white/10" />
              )}
              <input type="file" accept="image/*" onChange={handleImage}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zen-sage file:text-zen-charcoal file:text-sm cursor-pointer" />
              {imagePreview && (
                <img src={imagePreview} alt="תצוגה מקדימה" className="mt-3 rounded-lg max-h-48 object-contain border border-white/10" />
              )}
            </div>
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">Setup</label>
              <input type="text" name="setup" value={form.setup} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream focus:outline-none focus:border-zen-sage" />
            </div>
            <div>
              <label className="block text-sm text-zen-cream/50 mb-1">הערות</label>
              <textarea name="notes" rows={4} value={form.notes} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream focus:outline-none focus:border-zen-sage resize-none" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <label className="block text-sm text-zen-cream/50 mb-1">תוצאה ($) — רווח/הפסד סופי</label>
            <input type="number" name="result" step="0.01" placeholder="השאר ריק אם הטרייד עדיין פתוח" value={form.result} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zen-cream placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-zen-sage hover:opacity-90 disabled:opacity-40 text-zen-charcoal font-semibold py-4 rounded-xl transition-opacity text-lg">
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>

        </form>
      </main>
    </div>
  )
}