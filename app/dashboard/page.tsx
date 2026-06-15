'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Trade = {
  id: string
  date: string
  symbol: string
  entry_price: number
  exit_price: number | null
  quantity: number
  result: number | null
  setup: string | null
}

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrades = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('trades')
        .select('*')
        .order('date', { ascending: false })
      setTrades(data || [])
      setLoading(false)
    }
    fetchTrades()
  }, [])

  const totalTrades = trades.length
  const closedTrades = trades.filter(t => t.result !== null)
  const winners = closedTrades.filter(t => (t.result ?? 0) > 0)
  const winRate = closedTrades.length ? Math.round((winners.length / closedTrades.length) * 100) : 0
  const totalProfit = closedTrades.reduce((sum, t) => sum + (t.result ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">יומן מסחר</h1>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">סה"כ טריידים</p>
            <p className="text-3xl font-bold">{totalTrades}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-emerald-400">{winRate}%</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">רווח כולל</p>
            <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">טריידים סגורים</p>
            <p className="text-3xl font-bold">{closedTrades.length}</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">הטריידים שלי</h2>
            
              href="/dashboard/new-trade"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + טרייד חדש
            </a>
          </div>
          {loading ? (
            <div className="text-center text-gray-500 py-16">טוען...</div>
          ) : trades.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <p className="text-lg">עדיין אין טריידים</p>
              <p className="text-sm mt-2">לחץ על טרייד חדש כדי להתחיל</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-right pb-3">תאריך</th>
                  <th className="text-right pb-3">סימול</th>
                  <th className="text-right pb-3">כניסה</th>
                  <th className="text-right pb-3">יציאה</th>
                  <th className="text-right pb-3">כמות</th>
                  <th className="text-right pb-3">תוצאה</th>
                  <th className="text-right pb-3">Setup</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                    <td className="py-3">{trade.date}</td>
                    <td className="py-3 font-semibold">{trade.symbol}</td>
                    <td className="py-3">${trade.entry_price}</td>
                    <td className="py-3">{trade.exit_price ? `$${trade.exit_price}` : '-'}</td>
                    <td className="py-3">{trade.quantity}</td>
                    <td className={`py-3 font-semibold ${!trade.result ? 'text-gray-400' : trade.result > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {!trade.result ? 'פתוח' : `$${trade.result.toFixed(2)}`}
                    </td>
                    <td className="py-3 text-gray-400">{trade.setup || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}