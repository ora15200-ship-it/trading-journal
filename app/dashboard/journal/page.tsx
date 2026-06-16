'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Trade = {
  id: string
  date: string
  result: number | null
}

type Period = 'daily' | 'weekly' | 'monthly'

export default function JournalPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('monthly')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase
        .from('trades')
        .select('id, date, result')
        .order('date', { ascending: true })
      setTrades(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const closedTrades = trades.filter(t => t.result !== null)

  const getChartData = () => {
    if (closedTrades.length === 0) return []

    const groups: { [key: string]: number } = {}

    closedTrades.forEach(trade => {
      const date = new Date(trade.date)
      let key = ''

      if (period === 'daily') {
        key = trade.date
      } else if (period === 'weekly') {
        const startOfWeek = new Date(date)
        startOfWeek.setDate(date.getDate() - date.getDay())
        key = startOfWeek.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      groups[key] = (groups[key] || 0) + (trade.result || 0)
    })

    let cumulative = 0
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        cumulative += value
        return {
          label: period === 'monthly' ? key : key.slice(5),
          רווח: parseFloat(value.toFixed(2)),
          מצטבר: parseFloat(cumulative.toFixed(2)),
        }
      })
  }

  const chartData = getChartData()
  const totalProfit = closedTrades.reduce((sum, t) => sum + (t.result || 0), 0)
  const winners = closedTrades.filter(t => (t.result || 0) > 0)
  const winRate = closedTrades.length ? Math.round((winners.length / closedTrades.length) * 100) : 0

  const periodLabel = { daily: 'יומי', weekly: 'שבועי', monthly: 'חודשי' }

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

        {/* גרף */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">גרף ביצועים</h3>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${period === p ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  {periodLabel[p]}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <p>אין נתונים להצגה</p>
              <p className="text-sm mt-2">הוסף טריידים עם תוצאה כדי לראות את הגרף</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Line type="monotone" dataKey="רווח" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                <Line type="monotone" dataKey="מצטבר" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          )}

          <div className="flex gap-4 mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-emerald-400"></div> רווח לתקופה</div>
            <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-blue-400 border-dashed"></div> מצטבר</div>
          </div>
        </div>
      </main>
    </div>
  )
}