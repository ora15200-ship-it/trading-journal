'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type DisplayMessage = { role: 'user' | 'assistant'; text: string; imagePreview?: string }
type ApiContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
type ApiMessage = { role: 'user' | 'assistant'; content: string | ApiContentBlock[] }

type ParsedTrade = {
  date: string
  symbol: string
  direction: 'long' | 'short'
  entry_price: number
  shares: number | null
  stop_loss: number | null
  take_profit: number | null
  risk_amount: number | null
  setup: string | null
  notes: string | null
  result: number | null
}

export default function TradeChatModal({
  onClose,
  onTradeAdded,
  portfolioId,
}: {
  onClose: () => void
  onTradeAdded: () => void
  portfolioId: string | null
}) {
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    { role: 'assistant', text: 'היי! תאר/י לי עסקה, או צרף/י תמונה (אפילו עם כמה עסקאות בבת אחת) — אני אסדר את זה ביומן 🙂' },
  ])
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([])
  const [input, setInput] = useState('')
  const [attachedImage, setAttachedImage] = useState<{ data: string; mediaType: string; preview: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingTrades, setPendingTrades] = useState<ParsedTrade[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [displayMessages, pendingTrades])

  const readFileAsBase64 = (file: File): Promise<{ data: string; mediaType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve({ data: result.split(',')[1], mediaType: file.type })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('כרגע נתמכות רק תמונות (PNG / JPG)')
      return
    }
    const { data, mediaType } = await readFileAsBase64(file)
    setAttachedImage({ data, mediaType, preview: URL.createObjectURL(file) })
    e.target.value = ''
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const { data, mediaType } = await readFileAsBase64(file)
          setAttachedImage({ data, mediaType, preview: URL.createObjectURL(file) })
        }
      }
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || loading) return

    const userText = input.trim() || (attachedImage ? 'נתח את התמונה הזו וחלץ את כל העסקאות שמופיעות בה' : '')

    setDisplayMessages(m => [...m, { role: 'user', text: userText, imagePreview: attachedImage?.preview }])

    const userContent: ApiContentBlock[] = []
    if (attachedImage) {
      userContent.push({ type: 'image', source: { type: 'base64', media_type: attachedImage.mediaType, data: attachedImage.data } })
    }
    userContent.push({ type: 'text', text: userText })

    const newApiMessages: ApiMessage[] = [...apiMessages, { role: 'user', content: userContent }]
    setApiMessages(newApiMessages)

    setInput('')
    setAttachedImage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/trade-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newApiMessages }),
      })
      const data = await res.json()

      if (data.error) {
        setDisplayMessages(m => [...m, { role: 'assistant', text: 'משהו השתבש: ' + data.error }])
      } else if (data.type === 'trades_ready') {
        setPendingTrades(data.trades.map((t: any) => ({ shares: null, stop_loss: null, take_profit: null, risk_amount: null, setup: null, notes: null, result: null, ...t })))
        if (data.assistantText) {
          setDisplayMessages(m => [...m, { role: 'assistant', text: data.assistantText }])
          setApiMessages(m => [...m, { role: 'assistant', content: data.assistantText }])
        }
      } else {
        setDisplayMessages(m => [...m, { role: 'assistant', text: data.text }])
        setApiMessages(m => [...m, { role: 'assistant', content: data.text }])
      }
    } catch {
      setDisplayMessages(m => [...m, { role: 'assistant', text: 'שגיאת רשת, נסה שוב.' }])
    }
    setLoading(false)
  }

  const updateTradeField = (index: number, field: keyof ParsedTrade, value: any) => {
    if (!pendingTrades) return
    const updated = [...pendingTrades]
    updated[index] = { ...updated[index], [field]: value }
    setPendingTrades(updated)
  }

  const removeTrade = (index: number) => {
    if (!pendingTrades) return
    const updated = pendingTrades.filter((_, i) => i !== index)
    setPendingTrades(updated.length ? updated : null)
  }

  const handleConfirmAll = async () => {
    if (!pendingTrades || pendingTrades.length === 0) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const rows = pendingTrades.map(t => {
      const entryPrice = t.entry_price
      const stopLoss = t.stop_loss || 0
      const takeProfit = t.take_profit || 0
      const riskAmount = t.risk_amount || 0

      let shares = t.shares
      const stopSize = entryPrice - stopLoss
      if (!shares && stopSize > 0 && riskAmount > 0) {
        shares = riskAmount / stopSize
      }

      const positionSize = shares ? shares * entryPrice : null
      const rewardSize = takeProfit - entryPrice
      const riskReward = stopSize > 0 && rewardSize > 0 ? rewardSize / stopSize : null

      return {
        user_id: user.id,
        portfolio_id: portfolioId || null,
        date: t.date,
        symbol: t.symbol.toUpperCase(),
        direction: t.direction,
        entry_price: entryPrice,
        stop_loss: t.stop_loss,
        take_profit: t.take_profit,
        risk_amount: t.risk_amount,
        shares: shares || null,
        position_size: positionSize,
        risk_reward: riskReward,
        setup: t.setup,
        notes: t.notes,
        result: t.result,
      }
    })

    const { error } = await supabase.from('trades').insert(rows)

    if (error) {
      setDisplayMessages(m => [...m, { role: 'assistant', text: 'שגיאה בשמירה: ' + error.message }])
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    setDisplayMessages(m => [...m, { role: 'assistant', text: `✅ נשמרו ${rows.length} עסקאות ביומן. מעדכן את האפיון שלך...` }])

    updateTraderProfile(user.id)
    onTradeAdded()
  }

  const updateTraderProfile = async (userId: string) => {
    const supabase = createClient()

    let tradesQuery = supabase
      .from('trades')
      .select('date, symbol, direction, entry_price, stop_loss, take_profit, risk_amount, risk_reward, result, setup, notes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100)

    tradesQuery = portfolioId ? tradesQuery.eq('portfolio_id', portfolioId) : tradesQuery.is('portfolio_id', null)
    const { data: allTrades } = await tradesQuery

    if (!allTrades || allTrades.length === 0) {
      return
    }

    let profileQuery = supabase.from('trader_profile').select('id, insights').eq('user_id', userId)
    profileQuery = portfolioId ? profileQuery.eq('portfolio_id', portfolioId) : profileQuery.is('portfolio_id', null)
    const { data: existingProfile } = await profileQuery.maybeSingle()

    try {
      const res = await fetch('/api/trader-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: allTrades, previousInsights: existingProfile?.insights || null }),
      })
      const data = await res.json()
      if (data.insights) {
        if (existingProfile?.id) {
          await supabase.from('trader_profile').update({ insights: data.insights, updated_at: new Date().toISOString() }).eq('id', existingProfile.id)
        } else {
          await supabase.from('trader_profile').insert({
            user_id: userId,
            portfolio_id: portfolioId || null,
            insights: data.insights,
            updated_at: new Date().toISOString(),
          })
        }
      }
    } catch (err) {
      console.error('שגיאה בעדכון פרופיל סוחר', err)
    }
  }

  const handleAddAnother = () => {
    setPendingTrades(null)
    setSaved(false)
    setDisplayMessages(m => [...m, { role: 'assistant', text: 'מעולה, ספר/י לי על העסקה הבאה 👇' }])
  }

  const inputDisabled = loading || (!!pendingTrades && !saved)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-emerald-400 flex items-center gap-2">🤖 צ'אט בוט - הוספת עסקה</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {displayMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-gray-800 text-gray-100' : 'bg-emerald-600/20 border border-emerald-700/50 text-emerald-50'
              }`}>
                {m.imagePreview && (
                  <img src={m.imagePreview} alt="תמונה שצורפה" className="rounded-lg mb-2 max-h-40 object-contain border border-gray-700" />
                )}
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-emerald-600/20 border border-emerald-700/50 rounded-xl px-4 py-2.5 text-sm text-emerald-200">
                <span className="animate-pulse">חושב...</span>
              </div>
            </div>
          )}

          {pendingTrades && !saved && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mt-1">
              <p className="text-xs text-gray-400 mb-3">
                זיהיתי {pendingTrades.length} עסק{pendingTrades.length === 1 ? 'ה' : 'אות'} — אפשר לערוך או להוריד לפני שמירה:
              </p>

              <div className="flex flex-col gap-3">
                {pendingTrades.map((t, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">עסקה {i + 1}</span>
                      <button onClick={() => removeTrade(i)} className="text-xs text-red-400 hover:text-red-300">✕ הסר</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">תאריך</span>
                        <input type="date" value={t.date} onChange={e => updateTradeField(i, 'date', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">סימול</span>
                        <input type="text" value={t.symbol} onChange={e => updateTradeField(i, 'symbol', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">כיוון</span>
                        <select value={t.direction} onChange={e => updateTradeField(i, 'direction', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs">
                          <option value="long">לונג</option>
                          <option value="short">שורט</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">כניסה</span>
                        <input type="number" step="0.01" value={t.entry_price} onChange={e => updateTradeField(i, 'entry_price', parseFloat(e.target.value))} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">כמות</span>
                        <input type="number" step="0.0001" value={t.shares ?? ''} onChange={e => updateTradeField(i, 'shares', e.target.value ? parseFloat(e.target.value) : null)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">תוצאה ($)</span>
                        <input type="number" step="0.01" value={t.result ?? ''} onChange={e => updateTradeField(i, 'result', e.target.value ? parseFloat(e.target.value) : null)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-red-400">S.L</span>
                        <input type="number" step="0.01" value={t.stop_loss ?? ''} onChange={e => updateTradeField(i, 'stop_loss', e.target.value ? parseFloat(e.target.value) : null)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-emerald-400">T.P</span>
                        <input type="number" step="0.01" value={t.take_profit ?? ''} onChange={e => updateTradeField(i, 'take_profit', e.target.value ? parseFloat(e.target.value) : null)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Setup</span>
                        <input type="text" value={t.setup ?? ''} onChange={e => updateTradeField(i, 'setup', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleConfirmAll} disabled={saving} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {saving ? 'שומר...' : `✅ אישור והוספת ${pendingTrades.length} עסק${pendingTrades.length === 1 ? 'ה' : 'אות'} ליומן`}
              </button>
            </div>
          )}

          {saved && (
            <div className="flex justify-center">
              <button onClick={handleAddAnother} className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                + הוסף עסקאות נוספות
              </button>
            </div>
          )}
        </div>

        {attachedImage && (
          <div className="px-5 pt-3 flex items-center gap-2">
            <img src={attachedImage.preview} alt="תצוגה מקדימה" className="h-12 w-12 object-cover rounded border border-gray-700" />
            <span className="text-xs text-gray-400">תמונה מצורפת</span>
            <button onClick={() => setAttachedImage(null)} className="text-xs text-red-400 hover:text-red-300 mr-auto">הסר ✕</button>
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-800 flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={inputDisabled}
            title="צרף תמונה"
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-3 rounded-lg transition-colors"
          >
            📎
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="תאר/י את העסקה, או הדבק/צרף תמונה..."
            disabled={inputDisabled}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={inputDisabled || (!input.trim() && !attachedImage)}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 rounded-lg font-medium transition-colors"
          >
            שלח
          </button>
        </div>
      </div>
    </div>
  )
}