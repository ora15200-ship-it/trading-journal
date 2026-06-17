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
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())

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

  // קיבוץ כל הטריידים לפי תאריך
  const byDate: { [date: string]: Trade[] } = {}
  closedTrades.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = []
    byDate[t.date].push(t)
  })

  // סיכום לפי חודש נוכחי
  const monthTrades = closedTrades.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  })
  const monthProfit = monthTrades.reduce((sum, t) => sum + (t.result || 0), 0)
  const monthWinners = monthTrades.filter(t => (t.result || 0) > 0)
  const monthWinRate = monthTrades.length ? Math.round((monthWinners.length / monthTrades.length) * 100) : 0

  // בניית Heatmap
  const buildHeatmap = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()
    const cells = []
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayTrades = byDate[dateStr] || []
      const total = dayTrades.reduce((sum, t) => sum + (t.result || 0), 0)
      cells.push({ day: d, date: dateStr, trades: dayTrades, total })
    }
    return cells
  }

  // נתוני חודשים לשורת השנה
  const getMonthSummary = (year: number, month: number) => {
    const mt = closedTrades.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    const profit = mt.reduce((sum, t) => sum + (t.result || 0), 0)
    return { count: mt.length, profit }
  }

  // שנים זמינות
  const availableYears = [...new Set(closedTrades.map(t => new Date(t.date).getFullYear()))].sort()
  if (!availableYears.includes(currentYear)) availableYears.push(currentYear)
  availableYears.sort()

  const heatmapCells = buildHeatmap()
  const monthNames = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
  const monthShort = ['ינו','פבר','מרץ','אפר','מאי','יוני','יולי','אוג','ספט','אוק','נוב','דצמ']

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const getColor = (total: number, hasTrades: boolean) => {
    if (!hasTrades) return 'bg-gray-800 border-gray-700'
    if (total > 500) return 'bg-emerald-600 border-emerald-500'
    if (total > 100) return 'bg-emerald-700 border-emerald-600'
    if (total > 0) return 'bg-emerald-900 border-emerald-700'
    if (total > -100) return 'bg-red-900 border-red-700'
    if (total > -500) return 'bg-red-700 border-red-600'
    return 'bg-red-600 border-red-500'
  }

  const getMonthColor = (profit: number, count: number) => {
    if (count === 0) return 'bg-gray-800 text-gray-600'
    if (profit > 0) return 'bg-emerald-900 text-emerald-400'
    return 'bg-red-900 text-red-400'
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

        {/* כרטיסי סיכום כללי */}
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

          {/* ניווט שנים */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentYear(y => y - 1)} className="text-gray-400 hover:text-white px-2 py-1 rounded transition-colors text-lg">‹</button>
            <div className="flex gap-2">
              {availableYears.map(y => (
                <button
                  key={y}
                  onClick={() => setCurrentYear(y)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentYear === y ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  {y}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentYear(y => y + 1)} className="text-gray-400 hover:text-white px-2 py-1 rounded transition-colors text-lg">›</button>
          </div>

          {/* שורת חודשים */}
          <div className="grid grid-cols-12 gap-1 mb-6">
            {monthShort.map((name, i) => {
              const { profit, count } = getMonthSummary(currentYear, i)
              const isActive = i === currentMonth
              return (
                <button
                  key={i}
                  onClick={() => setCurrentMonth(i)}
                  className={`rounded-lg p-1.5 text-center transition-all ${getMonthColor(profit, count)} ${isActive ? 'ring-2 ring-emerald-400' : 'hover:opacity-80'}`}
                >
                  <div className="text-[10px] font-medium">{name}</div>
                  {count > 0 && (
                    <div className="text-[9px] mt-0.5">
                      {profit >= 0 ? '+' : ''}${Math.round(profit)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* כותרת חודש + סיכום חודשי */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-gray-800 transition-colors">‹</button>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{monthNames[currentMonth]} {currentYear}</h3>
              {monthTrades.length > 0 && (
                <div className="flex gap-4 justify-center mt-1 text-sm">
                  <span className="text-gray-400">{monthTrades.length} טריידים</span>
                  <span className="text-gray-400">Win Rate: <span className="text-emerald-400">{monthWinRate}%</span></span>
                  <span className={monthProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {monthProfit >= 0 ? '+' : ''}${monthProfit.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <button onClick={nextMonth} className="text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-gray-800 transition-colors">›</button>
          </div>

          {/* מקרא */}
          <div className="flex gap-3 text-xs text-gray-400 items-center mb-4">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block"></span> רווח</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block"></span> הפסד</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-800 inline-block"></span> אין טריידים</span>
          </div>

          {/* כותרות ימי שבוע */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs text-gray-500">
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => <div key={d}>{d}</div>)}
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
                    <span className="text-gray-300 text-sm">{i + 1}. {t.symbol || 'טרייד'}</span>
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