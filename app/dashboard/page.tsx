'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import TradeChatModal from '@/components/TradeChatModal'

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
  portfolio_id: string | null
}

type Portfolio = {
  id: string
  name: string
  type: string
}

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightboxTrade, setLightboxTrade] = useState<{ image: string; notes: string | null; symbol: string } | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)

  const getPortfolioId = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('portfolio')
  }

  const fetchTrades = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const portfolioId = getPortfolioId()

    if (portfolioId) {
      const { data: p } = await supabase.from('portfolios').select('id, name, type').eq('id', portfolioId).single()
      setPortfolio(p)
    }

    let query = supabase.from('trades').select('*').order('date', { ascending: false })
    if (portfolioId) {
      query = query.eq('portfolio_id', portfolioId)
    } else {
      query = query.is('portfolio_id', null)
    }

    const { data } = await query
    setTrades(data || [])
    setLoading(false)
  }

  const fetchInsights = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const pid = getPortfolioId()
    let query = supabase.from('trader_profile').select('insights').eq('user_id', user.id)
    query = pid ? query.eq('portfolio_id', pid) : query.is('portfolio_id', null)
    const { data } = await query.maybeSingle()
    setInsights(data?.insights || null)
  }

  useEffect(() => {
    fetchTrades()
    fetchInsights()
  }, [])

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

  const portfolioId = typeof window !== 'undefined' ? getPortfolioId() : null
  const newTradeUrl = portfolioId
    ? `/dashboard/new-trade?portfolio=${portfolioId}`
    : '/dashboard/new-trade'

  const totalTrades = trades.length
  const closedTrades = trades.filter(t => t.result !== null)
  const openTrades = trades.filter(t => t.result === null)
  const closedTradesSorted = closedTrades
  const winners = closedTrades.filter(t => (t.result ?? 0) > 0)
  const winRate = closedTrades.length ? Math.round((winners.length / closedTrades.length) * 100) : 0
  const totalProfit = closedTrades.reduce((sum, t) => sum + (t.result ?? 0), 0)

  const now = new Date()
  const monthTrades = closedTrades.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const monthProfit = monthTrades.reduce((sum, t) => sum + (t.result ?? 0), 0)

  return (
    <div className="min-h-screen bg-zen-charcoal text-zen-cream">

      {lightboxTrade && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxTrade(null)}>
          <div className="relative w-full max-w-3xl bg-zen-charcoal border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxTrade(null)} className="absolute top-3 left-3 z-10 bg-white/10 text-zen-cream rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-white/20">✕</button>
            <img src={lightboxTrade.image} alt="תמונת טרייד" className="w-full object-contain max-h-[60vh]" />
            <div className="p-5 border-t border-white/10">
              <p className="text-zen-cream/40 text-xs mb-2 font-semibold uppercase tracking-wider">הערות — {lightboxTrade.symbol}</p>
              {lightboxTrade.notes ? (
                <p className="text-zen-cream text-sm leading-relaxed whitespace-pre-wrap">{lightboxTrade.notes}</p>
              ) : (
                <p className="text-zen-cream/40 text-sm italic">אין הערות לטרייד זה</p>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="ZenStock" className="h-8 w-auto" />
          {portfolio && (
            <span className="text-zen-cream/40 text-sm">/ {portfolio.name}</span>
          )}
        </div>
        <div className="flex gap-4 items-center text-sm">
          <button onClick={() => window.location.href = '/portfolios'} className="text-zen-cream/50 hover:text-zen-cream transition-colors">← התיקים שלי</button>
          <span className="text-zen-cream font-medium">דשבורד</span>
          <button onClick={() => window.location.href = portfolioId ? `/dashboard/journal?portfolio=${portfolioId}` : '/dashboard/journal'} className="text-zen-cream/50 hover:text-zen-sage transition-colors">יומן</button>
          <button onClick={handleLogout} className="text-zen-cream/50 hover:text-red-400 transition-colors">התנתק</button>
        </div>
      </nav>

      <main className="max-w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p className="text-zen-cream/40 text-sm mb-1">סה"כ טריידים</p>
            <p className="text-3xl font-semibold">{totalTrades}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p className="text-zen-cream/40 text-sm mb-1">Win Rate</p>
            <p className="text-3xl font-semibold text-green-400">{winRate}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p className="text-zen-cream/40 text-sm mb-1">רווח כולל</p>
            <p className={`text-3xl font-semibold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p className="text-zen-cream/40 text-sm mb-1">טריידים סגורים</p>
            <p className="text-3xl font-semibold">{closedTrades.length}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p className="text-zen-cream/40 text-sm mb-1">רווח החודש</p>
            <p className={`text-3xl font-semibold ${monthProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {monthProfit >= 0 ? '+' : ''}${monthProfit.toFixed(2)}
            </p>
          </div>
        </div>

        {insights && (
          <div className="bg-white/5 rounded-xl border border-zen-sage/30 p-5 mb-6 whitespace-pre-wrap text-sm text-zen-cream/80 leading-relaxed">
            {insights}
          </div>
        )}

        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setShowChatModal(true)}
            className="bg-white/10 hover:bg-white/15 text-zen-cream px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            ZEN Bot
          </button>
          <Link href={newTradeUrl} className="bg-zen-sage hover:opacity-90 text-zen-charcoal px-4 py-2 rounded-lg text-sm font-semibold transition-opacity">
            + טרייד חדש
          </Link>
        </div>

        {/* עסקאות פתוחות - תמיד מוצג */}
        <div className="bg-white/5 rounded-xl border border-zen-sage/30 p-6 overflow-x-auto mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            עסקאות פתוחות
            <span className="text-xs font-normal bg-zen-sage/15 text-zen-sage px-2 py-0.5 rounded-full">{openTrades.length}</span>
          </h2>

          {loading ? (
            <div className="text-center text-zen-cream/40 py-10">טוען...</div>
          ) : openTrades.length === 0 ? (
            <div className="text-center text-zen-cream/40 py-10">אין עסקאות פתוחות כרגע</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zen-cream/40 border-b border-white/10 text-right">
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
                  <th className="pb-3 pr-2">Setup</th>
                  <th className="pb-3 pr-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map(trade => (
                  <tr key={trade.id} className="border-b border-white/10 hover:bg-white/5 transition-colors text-right">
                    <td className="py-3 pr-2">
                      {trade.image_url ? (
                        <img src={trade.image_url} alt="טרייד"
                          onClick={() => setLightboxTrade({ image: trade.image_url!, notes: trade.notes, symbol: trade.symbol })}
                          className="w-12 h-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-white/10" />
                      ) : (
                        <div className="w-12 h-10 bg-white/5 rounded border border-white/10 flex items-center justify-center text-zen-cream/30 text-xs">אין</div>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      {trade.direction === 'long' ? <span className="text-green-400 font-bold text-lg">↑</span>
                        : trade.direction === 'short' ? <span className="text-red-400 font-bold text-lg">↓</span> : '-'}
                    </td>
                    <td className="py-3 pr-2 text-zen-cream/70">{trade.date}</td>
                    <td className="py-3 pr-2 font-semibold text-zen-cream">{trade.symbol}</td>
                    <td className="py-3 pr-2">${trade.entry_price}</td>
                    <td className="py-3 pr-2 text-red-400">{trade.stop_loss ? `$${trade.stop_loss}` : '-'}</td>
                    <td className="py-3 pr-2 text-green-400">{trade.take_profit ? `$${trade.take_profit}` : '-'}</td>
                    <td className="py-3 pr-2 text-amber-400">{trade.risk_amount ? `$${trade.risk_amount}` : '-'}</td>
                    <td className="py-3 pr-2">{trade.shares ? Math.round(trade.shares) : '-'}</td>
                    <td className="py-3 pr-2">{trade.position_size ? `$${Math.round(trade.position_size)}` : '-'}</td>
                    <td className="py-3 pr-2">
                      {trade.risk_reward ? (
                        <span className={trade.risk_reward >= 2 ? 'text-green-400' : trade.risk_reward >= 1 ? 'text-amber-400' : 'text-red-400'}>
                          1:{trade.risk_reward.toFixed(1)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 pr-2 text-zen-cream/50">{trade.setup || '-'}</td>
                    <td className="py-3 pr-2">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => window.location.href = `/dashboard/edit-trade/${trade.id}`}
                          className="text-xs bg-white/10 hover:bg-white/15 text-zen-cream px-2 py-1 rounded transition-colors">
                          ערוך
                        </button>
                        <button onClick={() => handleDelete(trade.id)} disabled={deletingId === trade.id}
                          className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 px-2 py-1 rounded transition-colors disabled:opacity-50">
                          {deletingId === trade.id ? '...' : 'מחק'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* היסטוריית עסקאות - סגורות, חדש למעלה */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">היסטוריית העסקאות שלי</h2>

          {loading ? (
            <div className="text-center text-zen-cream/40 py-16">טוען...</div>
          ) : closedTradesSorted.length === 0 ? (
            <div className="text-center text-zen-cream/40 py-16">
              <p className="text-lg">עדיין אין עסקאות סגורות</p>
              <p className="text-sm mt-2">עסקאות שתסגור יופיעו כאן</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zen-cream/40 border-b border-white/10 text-right">
                  <th className="pb-3 pr-2">#</th>
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
                {closedTradesSorted.map((trade, i) => (
                  <tr key={trade.id} className="border-b border-white/10 hover:bg-white/5 transition-colors text-right">
                    <td className="py-3 pr-2 text-zen-cream/40">{i + 1}</td>
                    <td className="py-3 pr-2">
                      {trade.image_url ? (
                        <img src={trade.image_url} alt="טרייד"
                          onClick={() => setLightboxTrade({ image: trade.image_url!, notes: trade.notes, symbol: trade.symbol })}
                          className="w-12 h-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-white/10" />
                      ) : (
                        <div className="w-12 h-10 bg-white/5 rounded border border-white/10 flex items-center justify-center text-zen-cream/30 text-xs">אין</div>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      {trade.direction === 'long' ? <span className="text-green-400 font-bold text-lg">↑</span>
                        : trade.direction === 'short' ? <span className="text-red-400 font-bold text-lg">↓</span> : '-'}
                    </td>
                    <td className="py-3 pr-2 text-zen-cream/70">{trade.date}</td>
                    <td className="py-3 pr-2 font-semibold text-zen-cream">{trade.symbol}</td>
                    <td className="py-3 pr-2">${trade.entry_price}</td>
                    <td className="py-3 pr-2 text-red-400">{trade.stop_loss ? `$${trade.stop_loss}` : '-'}</td>
                    <td className="py-3 pr-2 text-green-400">{trade.take_profit ? `$${trade.take_profit}` : '-'}</td>
                    <td className="py-3 pr-2 text-amber-400">{trade.risk_amount ? `$${trade.risk_amount}` : '-'}</td>
                    <td className="py-3 pr-2">{trade.shares ? Math.round(trade.shares) : '-'}</td>
                    <td className="py-3 pr-2">{trade.position_size ? `$${Math.round(trade.position_size)}` : '-'}</td>
                    <td className="py-3 pr-2">
                      {trade.risk_reward ? (
                        <span className={trade.risk_reward >= 2 ? 'text-green-400' : trade.risk_reward >= 1 ? 'text-amber-400' : 'text-red-400'}>
                          1:{trade.risk_reward.toFixed(1)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className={`py-3 pr-2 font-semibold ${(trade.result ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${trade.result!.toFixed(2)}
                    </td>
                    <td className="py-3 pr-2 text-zen-cream/50">{trade.setup || '-'}</td>
                    <td className="py-3 pr-2">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => window.location.href = `/dashboard/edit-trade/${trade.id}`}
                          className="text-xs bg-white/10 hover:bg-white/15 text-zen-cream px-2 py-1 rounded transition-colors">
                          ערוך
                        </button>
                        <button onClick={() => handleDelete(trade.id)} disabled={deletingId === trade.id}
                          className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 px-2 py-1 rounded transition-colors disabled:opacity-50">
                          {deletingId === trade.id ? '...' : 'מחק'}
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

      {showChatModal && (
        <TradeChatModal
          onClose={() => setShowChatModal(false)}
          onTradeAdded={() => { fetchTrades(); fetchInsights() }}
          portfolioId={portfolioId}
        />
      )}
    </div>
  )
}