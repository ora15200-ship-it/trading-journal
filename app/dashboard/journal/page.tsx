'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Trade = {
  id: string
  date: string
  result: number | null
  symbol?: string
}

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<{ date: string; trades: Trade[] } | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase
        .from('trades')
        .select('id, date, result, symbol')
        .order('date', { ascending: true })
      setTrades(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const closedTrades = trades.filter(t => t.result !== null)
  const totalProfit = closedTrades.reduce((sum, t) => sum + (t.result || 0), 0)
  const winners = closedTrades.filter(t => (t.result || 0) > 0)
  const winRate = closedTrades.length ? Math.round((winners.length / closedTrades.length) * 100) : 0

  // בניית נתוני Heatmap לפי חודש נוכחי
  const buildHeatmap = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay() // 0=ראשון

    // קיבוץ טריידים לפי תאריך
    const byDate: { [date: string]: Trade[] } = {}
    closedTrades.forEach(t => {
      if (!byDate[t.date]) byDate[t.date] = []
      byDate[t.date].push(t)
    })

    const cells = []
    // תאים ריקים לפני היום הראשון
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null)
    }
    // ימי החודש
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayTrades = byDate[dateStr] || []
      const total = dayTrades.reduce((sum, t) => sum + (t.result || 0), 0)
      cells.push({ day: d, date: dateStr, trades: dayTrades, total })
    }

    return cells
  }

  const heatmapCells = buildHeatmap()
  const monthName = new Date().toLocaleString('he-IL', { month: 'long', year: 'numeric' })

  const getColor = (total: number, hasTrades: boolean) => {
    if (!hasTrades) return 'bg-gray-800 border-gray-700'
    if (total > 500) return 'bg-emerald-600 border-emerald-500'
    if (total > 100) return 'bg-emerald-700 border-emerald-600'
    if (total > 0) return 'bg-emerald-900 border-emerald-700'
    if (total > -100) return 'bg-red-900 border-red-700'
    if (total > -500) return 'bg-red-700 border-red-600'
    return 'bg-red-600 border-red-500'
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">טוען...</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">יומן מסחר</h1>
        <div className="flex gap-4 items-center text-sm">
          <button onClick={() => window.location.href = '/dashboard'} className="text-gray-400 hover:text-white transition-colors">דשבורד</button>
          <span className="text-white font-medium">יומן</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">יומן ביצועים</h2>

        {/* כרטיסי סיכום */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">סה"כ טריידים סגורים</p>
            <p className="text-3xl font-bold">{closedTrades.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Win Rate כולל</p>
            <p className="text-3xl font-bold text-emerald-400">{winRate}%</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">רווח מצטבר</p>
            <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${totalProfit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">מפת ביצועים — {monthName}</h3>
            <div className="flex gap-3 text-xs text-gray-400 items-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block"></span> רווח</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block"></span> הפסד</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-800 inline-block"></span> אין טריידים</span>
            </div>
          </div>

          {/* כותרות ימי שבוע */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs text-gray-500">
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* תאי הלוח */}
          <div className="grid grid-cols-7 gap-2">
            {heatmapCells.map((cell, i) => {
              if (!cell) return <div key={i} />
              const hasTrades = cell.trades.length > 0
              return (
                <div
                  key={i}
                  onClick={() => hasTrades && setSelectedDay({ date: cell.date, trades: cell.trades })}
                  className={`rounded-lg border p-1 min-h-[56px] flex flex-col items-center justify-center transition-all
                    ${getColor(cell.total, hasTrades)}
                    ${hasTrades ? 'cursor-pointer hover:opacity-80 hover:scale-105' : 'cursor-default'}
                  `}
                >
                  <span className="text-xs text-white/70">{cell.day}</span>
                  {hasTrades && (
                    <span className={`text-xs font-bold ${cell.total >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {cell.total >= 0 ? '+' : ''}${cell.total.toFixed(0)}
                    </span>
                  )}
                  {cell.trades.length > 1 && (
                    <span className="text-[10px] text-white/50">{cell.trades.length} טריידים</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* פופאפ פירוט יום */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDay(null)}>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold">{selectedDay.date}</h4>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className="flex flex-col gap-3">
                {selectedDay.trades.map((t, i) => (
                  <div key={t.id} className="flex justify-between items-center bg-gray-800 rounded-lg px-4 py-3">
                    <span className="text-gray-300 text-sm">
                      {i + 1}. {t.symbol || 'טרייד'}
                    </span>
                    <span className={`font-bold text-sm ${(t.result || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(t.result || 0) >= 0 ? '+' : ''}${(t.result || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center border-t border-gray-700 pt-3 mt-1">
                  <span className="text-gray-400 text-sm">סה"כ יומי</span>
                  <span className={`font-bold ${selectedDay.trades.reduce((s, t) => s + (t.result || 0), 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${selectedDay.trades.reduce((s, t) => s + (t.result || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}