'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type ChatMessage = { role: 'user' | 'assistant'; text: string }

type ParsedTrade = {
  date: string
  symbol: string
  direction: 'long' | 'short'
  entry_price: number
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'היי! תאר/י לי את העסקה במילים שלך — סימול, כיוון, מחיר כניסה, סטופ, יעד, וכל מה שתרצה. אני אסדר את זה ביומן 🙂' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingTrade, setPendingTrade] = useState<ParsedTrade | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pendingTrade])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const newMessages = [...messages, { role: 'user' as const, text: input.trim() }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/trade-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.text })),
        }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages(m => [...m, { role: 'assistant', text: 'משהו השתבש: ' + data.error }])
      } else if (data.type === 'trade_ready') {
        setPendingTrade(data.trade)
        if (data.assistantText) setMessages(m => [...m, { role: 'assistant', text: data.assistantText }])
      } else {
        setMessages(m => [...m, { role: 'assistant', text: data.text }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'שגיאת רשת, נסה שוב.' }])
    }
    setLoading(false)
  }

  const updatePendingField = (field: keyof ParsedTrade, value: any) => {
    if (!pendingTrade) return
    setPendingTrade({ ...pendingTrade, [field]: value })
  }

  const handleConfirm = async () => {
    if (!pendingTrade) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const entryPrice = pendingTrade.entry_price
    const stopLoss = pendingTrade.stop_loss || 0
    const takeProfit = pendingTrade.take_profit || 0
    const riskAmount = pendingTrade.risk_amount || 0

    const stopSize = entryPrice - stopLoss
    const shares = stopSize > 0 && riskAmount > 0 ? riskAmount / stopSize : null
    const positionSize = shares ? shares * entryPrice : null
    const rewardSize = takeProfit - entryPrice
    const riskReward = stopSize > 0 && rewardSize > 0 ? rewardSize / stopSize : null

    const { error } = await supabase.from('trades').insert([{
      user_id: user.id,
      portfolio_id: portfolioId || null,
      date: pendingTrade.date,
      symbol: pendingTrade.symbol.toUpperCase(),
      direction: pendingTrade.direction,
      entry_price: entryPrice,
      stop_loss: pendingTrade.stop_loss,
      take_profit: pendingTrade.take_profit,
      risk_amount: pendingTrade.risk_amount,
      shares,
      position_size: positionSize,
      risk_reward: riskReward,
      setup: pendingTrade.setup,
      notes: pendingTrade.notes,
      result: pendingTrade.result,
    }])

    if (error) {
      setMessages(m => [...m, { role: 'assistant', text: 'שגיאה בשמירה: ' + error.message }])
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    setMessages(m => [...m, { role: 'assistant', text: `✅ העסקה ב-${pendingTrade.symbol} נשמרה ביומן. מעדכן את האפיון שלך...` }])

    updateTraderProfile(user.id)
    onTradeAdded()
  }

  const updateTraderProfile = async (userId: string) => {
    const supabase = createClient()
    const { data: allTrades } = await supabase
      .from('trades')
      .select('date, symbol, direction, entry_price, stop_loss, take_profit, risk_amount, risk_reward, result, setup, notes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100)

    const { data: existingProfile } = await supabase
      .from('trader_profile')
      .select('insights')
      .eq('user_id', userId)
      .maybeSingle()

    try {
      const res = await fetch('/api/trader-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: allTrades, previousInsights: existingProfile?.insights || null }),
      })
      const data = await res.json()
      if (data.insights) {
        await supabase.from('trader_profile').upsert({
          user_id: userId,
          insights: data.insights,
          updated_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error('שגיאה בעדכון פרופיל סוחר', err)
    }
  }

  const handleAddAnother = () => {
    setPendingTrade(null)
    setSaved(false)
    setMessages(m => [...m, { role: 'assistant', text: 'מעולה, ספר/י לי על העסקה הבאה 👇' }])
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-emerald-400 flex items-center gap-2">🤖 צ'אט בוט - הוספת עסקה</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-gray-800 text-gray-100' : 'bg-emerald-600/20 border border-emerald-700/50 text-emerald-50'
              }`}>
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

          {pendingTrade && !saved && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mt-1">
              <p className="text-xs text-gray-400 mb-3">זיהיתי את הפרטים האלה — אפשר לערוך לפני שמירה:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">תאריך</span>
                  <input type="date" value={pendingTrade.date} onChange={e => updatePendingField('date', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">סימול</span>
                  <input type="text" value={pendingTrade.symbol} onChange={e => updatePendingField('symbol', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">כיוון</span>
                  <select value={pendingTrade.direction} onChange={e => updatePendingField('direction', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white">
                    <option value="long">לונג</option>
                    <option value="short">שורט</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">כניסה</span>
                  <input type="number" step="0.01" value={pendingTrade.entry_price} onChange={e => updatePendingField('entry_price', parseFloat(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-red-400">S.L</span>
                  <input type="number" step="0.01" value={pendingTrade.stop_loss ?? ''} onChange={e => updatePendingField('stop_loss', e.target.value ? parseFloat(e.target.value) : null)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-emerald-400">T.P</span>
                  <input type="number" step="0.01" value={pendingTrade.take_profit ?? ''} onChange={e => updatePendingField('take_profit', e.target.value ? parseFloat(e.target.value) : null)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">סיכון ($)</span>
                  <input type="number" step="0.01" value={pendingTrade.risk_amount ?? ''} onChange={e => updatePendingField('risk_amount', e.target.value ? parseFloat(e.target.value) : null)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Setup</span>
                  <input type="text" value={pendingTrade.setup ?? ''} onChange={e => updatePendingField('setup', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-xs text-gray-500">תוצאה ($) — אם נסגרה</span>
                  <input type="number" step="0.01" value={pendingTrade.result ?? ''} onChange={e => updatePendingField('result', e.target.value ? parseFloat(e.target.value) : null)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" />
                </label>
              </div>

              <button onClick={handleConfirm} disabled={saving} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {saving ? 'שומר...' : '✅ אישור והוספה ליומן'}
              </button>
            </div>
          )}

          {saved && (
            <div className="flex justify-center">
              <button onClick={handleAddAnother} className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                + הוסף עסקה נוספת
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="תאר/י את העסקה..."
            disabled={loading || (!!pendingTrade && !saved)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || (!!pendingTrade && !saved)}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 rounded-lg font-medium transition-colors"
          >
            שלח
          </button>
        </div>
      </div>
    </div>
  )
}