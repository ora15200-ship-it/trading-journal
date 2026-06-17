'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type Trade = {
  id: string
  date: string
  symbol: string
  direction: string | null
  entry_price: number
  stop_loss: number | null
  take_profit: number | null
  risk_amount: number | null
  shares: number | null
  position_size: number | null
  risk_reward: number | null
  result: number | null
  setup: string | null
  notes: string | null
  image_url: string | null
}

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightboxTrade, setLightboxTrade] = useState<{ image: string; notes: string | null; symbol: string } | null>(null)

  const fetchTrades = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data } = await supabase
      .from('trades')
      .select('*')
      .order('date', { ascending: false })
    setTrades(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTrades() }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הטרייד הזה?')) return
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('trades').delete().eq('id', id)
    await fetchTrades()
    setDeletingId(null)
  }

  const totalTrades = trades.length
  const closedTrades = trades.filter(t => t.result !== null)
  const winners = closedTrades.filter(t => (t.result ?? 0) > 0)
  const winRate = closedTrades.length ? Math.round((winners.length / closedTrades.length) * 100) : 0
  const totalProfit = closedTrades.reduce((sum, t) => sum + (t.result ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {lightboxTrade && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxTrade(null)}>
          <div className="relative w-full max-w-3xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxTrade(null)} className="absolute top-3 left-3 z-10 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-700">✕</button>
            <img src={lightboxTrade.image} alt="תמונת טרייד" className="w-full object-contain max-h-[60vh]" />
            <div className="p-5 border-t border-gray-700">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wider">הערות — {lightboxTrade.symbol}</p>
              {lightboxTrade.notes ? (
                <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">{lightboxTrade.notes}</p>
              ) : (
                <p className="text-gray-500 text-sm italic">אין הערות לטרייד זה</p>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">יומן מסחר</h1>
        <div className="flex gap-4 items-center text-sm">
          <span className="text-white font-medium">דשבורד</span>
          <button onClick={() => window.location.href = '/dashboard/journal'} className="text-gray-400 hover:text-emerald-400 transition-colors">יומן</button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">התנתק</button>
        </div>
      </nav>

      <main className="max-w-full mx-auto px-6 py-8">
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

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">הטריידים שלי</h2>
            <Link href="/dashboard/new-trade" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + טרייד חדש
            </Link>
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
                <tr className="text-gray-400 border-b border-gray-800 text-right">
                  <th className="pb-3 pr-2">תמונה</th>
                  <th className="pb-3 pr-2">כיוון</th>
                  <th className="pb-3 pr-2">תאריך</th>
                  <th className="pb-3 pr-2">סימול</th>
                  <th className="pb-3 pr-2">כניסה</th>
                  <th className="pb-3 pr-2">S.L</th>
                  <th className="pb-3 pr-2">T.P</th>
                  <th className="pb-3 pr-2">סיכון</th>
                  <th className="pb-3 pr-2">כמות</th>
                  <th className="pb-3 pr-2">שווי</th>
                  <th className="pb-3 pr-2">יחס</th>
                  <th className="pb-3 pr-2">תוצאה</th>
                  <th className="pb-3 pr-2">Setup</th>
                  <th className="pb-3 pr-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors text-right">
                    <td className="py-3 pr-2">
                      {trade.image_url ? (
                        <img
                          src={trade.image_url}
                          alt="טרייד"
                          onClick={() => setLightboxTrade({ image: trade.image_url!, notes: trade.notes, symbol: trade.symbol })}
                          className="w-12 h-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-gray-700"
                        />
                      ) : (
                        <div className="w-12 h-10 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-gray-600 text-xs">אין</div>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      {trade.direction === 'long' ? <span className="text-emerald-400 font-bold text-lg">↑</span>
                        : trade.direction === 'short' ? <span className="text-red-400 font-bold text-lg">↓</span> : '-'}
                    </td>
                    <td className="py-3 pr-2 text-gray-300">{trade.date}</td>
                    <td className="py-3 pr-2 font-bold text-white">{trade.symbol}</td>
                    <td className="py-3 pr-2">${trade.entry_price}</td>
                    <td className="py-3 pr-2 text-red-400">{trade.stop_loss ? `$${trade.stop_loss}` : '-'}</td>
                    <td className="py-3 pr-2 text-emerald-400">{trade.take_profit ? `$${trade.take_profit}` : '-'}</td>
                    <td className="py-3 pr-2 text-yellow-400">{trade.risk_amount ? `$${trade.risk_amount}` : '-'}</td>
                    <td className="py-3 pr-2">{trade.shares ? Math.round(trade.shares) : '-'}</td>
                    <td className="py-3 pr-2">{trade.position_size ? `$${Math.round(trade.position_size)}` : '-'}</td>
                    <td className="py-3 pr-2">
                      {trade.risk_reward ? (
                        <span className={trade.risk_reward >= 2 ? 'text-emerald-400' : trade.risk_reward >= 1 ? 'text-yellow-400' : 'text-red-400'}>
                          1:{trade.risk_reward.toFixed(1)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className={`py-3 pr-2 font-semibold ${trade.result === null ? 'text-gray-400' : trade.result > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.result === null ? 'פתוח' : `$${trade.result.toFixed(2)}`}
                    </td>
                    <td className="py-3 pr-2 text-gray-400">{trade.setup || '-'}</td>
                    <td className="py-3 pr-2">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => window.location.href = `/dashboard/edit-trade/${trade.id}`}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors">
                          ✏️ ערוך
                        </button>
                        <button onClick={() => handleDelete(trade.id)} disabled={deletingId === trade.id}
                          className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded transition-colors disabled:opacity-50">
                          {deletingId === trade.id ? '...' : '🗑️ מחק'}
                        </button>
                      </div>
                    </td>
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