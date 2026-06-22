'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Trade = {
  id: string
  date: string
  symbol: string
  direction: string | null
  entry_price: number
  stop_loss: number | null
  take_profit: number | null
  result: number | null
  portfolio_id: string | null
}

type Layer = {
  id: string
  created_at: string
  stop_loss: number | null
  take_profit: number | null
  narrative: string | null
  image_urls: string[] | null
}

function getRiskState(direction: string | null, entryPrice: number, currentSL: number | null) {
  if (currentSL === null) return null
  const isLong = direction !== 'short'
  if (isLong) {
    if (currentSL < entryPrice) return 'at_risk'
    if (currentSL === entryPrice) return 'break_even'
    return 'profit_locked'
  } else {
    if (currentSL > entryPrice) return 'at_risk'
    if (currentSL === entryPrice) return 'break_even'
    return 'profit_locked'
  }
}

const RISK_LABELS: { [key: string]: { label: string; className: string } } = {
  at_risk: { label: 'בסיכון', className: 'bg-red-900/30 text-red-400' },
  break_even: { label: 'Break Even', className: 'bg-amber-900/30 text-amber-400' },
  profit_locked: { label: 'רווח נעול', className: 'bg-zen-profit/15 text-zen-profit' },
}

export default function ManageTradePage() {
  const params = useParams()
  const tradeId = params?.id as string

  const [trade, setTrade] = useState<Trade | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  const [newSL, setNewSL] = useState('')
  const [newTP, setNewTP] = useState('')
  const [narrative, setNarrative] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const fetchAll = async () => {
    const supabase = createClient()
    const { data: tradeData } = await supabase
      .from('trades')
      .select('id, date, symbol, direction, entry_price, stop_loss, take_profit, result, portfolio_id')
      .eq('id', tradeId)
      .single()
    setTrade(tradeData)

    const { data: layersData } = await supabase
      .from('trade_management_layers')
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true })
    setLayers(layersData || [])

    if (tradeData) {
      const lastLayer = layersData && layersData.length > 0 ? layersData[layersData.length - 1] : null
      setNewSL(String(lastLayer?.stop_loss ?? tradeData.stop_loss ?? ''))
      setNewTP(String(lastLayer?.take_profit ?? tradeData.take_profit ?? ''))
    }

    setLoading(false)
  }

  useEffect(() => { if (tradeId) fetchAll() }, [tradeId])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImageFiles(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const handleSaveLayer = async () => {
    if (!trade) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const uploadedUrls: string[] = []
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('trade-images').upload(fileName, file)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('trade-images').getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
      }
    }

    await supabase.from('trade_management_layers').insert({
      trade_id: trade.id,
      user_id: user.id,
      stop_loss: newSL ? parseFloat(newSL) : null,
      take_profit: newTP ? parseFloat(newTP) : null,
      narrative: narrative.trim() || null,
      image_urls: uploadedUrls,
    })

    setNarrative('')
    setImageFiles([])
    setImagePreviews([])
    setSaving(false)
    await fetchAll()
  }

  if (loading || !trade) {
    return <div className="min-h-screen bg-zen-charcoal text-zen-cream flex items-center justify-center">טוען...</div>
  }

  const lastLayer = layers.length > 0 ? layers[layers.length - 1] : null
  const currentSL = lastLayer?.stop_loss ?? trade.stop_loss
  const currentTP = lastLayer?.take_profit ?? trade.take_profit
  const riskState = getRiskState(trade.direction, trade.entry_price, currentSL)
  const isOpen = trade.result === null
  const timelineDesc = [...layers].reverse()

  return (
    <div className="min-h-screen bg-zen-charcoal text-zen-cream">

      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="תמונת שכבה" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
        </div>
      )}

      <nav className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <img src="/logo.svg" alt="ZenStock" className="h-8 w-auto" />
        <button
          onClick={() => window.location.href = trade.portfolio_id ? `/dashboard?portfolio=${trade.portfolio_id}` : '/dashboard'}
          className="text-sm text-zen-cream/50 hover:text-zen-cream transition-colors">
          ← חזרה לדשבורד
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="font-display text-2xl mb-1">ניהול עסקה דינמי</h2>
        <p className="text-zen-cream/50 text-sm mb-8">
          {trade.symbol} · {trade.direction === 'long' ? 'לונג ↑' : 'שורט ↓'} · נכנס/ה ב-{trade.date}
        </p>

        {!isOpen && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-sm text-zen-cream/60">
            העסקה נסגרה בתוצאה של <span className={(trade.result ?? 0) > 0 ? 'text-zen-profit' : 'text-red-400'}>${trade.result?.toFixed(2)}</span> -
            ההיסטוריה נעולה לצפייה בלבד.
          </div>
        )}

        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-zen-cream/50">מצב נוכחי</h3>
            {riskState && (
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${RISK_LABELS[riskState].className}`}>
                {RISK_LABELS[riskState].label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-zen-cream/40 mb-1">כניסה (קבוע)</p>
              <p className="text-lg font-semibold">${trade.entry_price}</p>
            </div>
            <div>
              <p className="text-xs text-red-400 mb-1">S.L נוכחי</p>
              <p className="text-lg font-semibold text-red-400">{currentSL ? `$${currentSL}` : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-zen-profit mb-1">T.P נוכחי</p>
              <p className="text-lg font-semibold text-zen-profit">{currentTP ? `$${currentTP}` : '-'}</p>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="bg-white/5 rounded-xl border border-zen-sage/30 p-6 mb-8">
            <h3 className="text-sm font-semibold mb-4">עדכון ניהול - שכבה חדשה</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-red-400 mb-1">S.L חדש</label>
                <input type="number" step="0.01" value={newSL} onChange={e => setNewSL(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-sm focus:outline-none focus:border-zen-sage" />
              </div>
              <div>
                <label className="block text-xs text-zen-profit mb-1">T.P חדש</label>
                <input type="number" step="0.01" value={newTP} onChange={e => setNewTP(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-sm focus:outline-none focus:border-zen-sage" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-zen-cream/50 mb-1">מה קרה ולמה עדכנת?</label>
              <textarea value={narrative} onChange={e => setNarrative(e.target.value)} rows={3}
                placeholder="לדוגמה: נוצר Higher Low אחרי שבירת התנגדות ב-150, מקדם סטופ להגנה על הרווח..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-sm placeholder-zen-cream/30 focus:outline-none focus:border-zen-sage resize-none" />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-zen-cream/50 mb-1">תמונות (אופציונלי, אפשר כמה)</label>
              <input type="file" accept="image/*" multiple onChange={handleImageSelect}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zen-sage file:text-zen-charcoal file:text-xs cursor-pointer" />
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {imagePreviews.map((src, i) => (
                    <img key={i} src={src} className="h-16 w-16 object-cover rounded border border-white/10" />
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleSaveLayer} disabled={saving}
              className="w-full bg-zen-sage hover:opacity-90 disabled:opacity-40 text-zen-charcoal font-semibold py-2.5 rounded-lg text-sm transition-opacity">
              {saving ? 'שומר...' : 'שמור שכבה חדשה'}
            </button>
          </div>
        )}

        <h3 className="text-sm font-semibold text-zen-cream/50 mb-4">היסטוריית ניהול ({layers.length} שכבות)</h3>

        <div className="flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-zen-cream/40 mb-1">{trade.date} · כניסה ראשונית</p>
            <p className="text-sm text-zen-cream/70">
              S.L: <span className="text-red-400">{trade.stop_loss ? `$${trade.stop_loss}` : '-'}</span> ·
              T.P: <span className="text-zen-profit">{trade.take_profit ? `$${trade.take_profit}` : '-'}</span>
            </p>
          </div>

          {timelineDesc.map(layer => (
            <div key={layer.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-zen-cream/40 mb-2">
                {new Date(layer.created_at).toLocaleDateString('he-IL')} {new Date(layer.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-zen-cream/70 mb-2">
                S.L: <span className="text-red-400">{layer.stop_loss ? `$${layer.stop_loss}` : '-'}</span> ·
                T.P: <span className="text-zen-profit">{layer.take_profit ? `$${layer.take_profit}` : '-'}</span>
              </p>
              {layer.narrative && (
                <p className="text-sm text-zen-cream leading-relaxed mb-2">{layer.narrative}</p>
              )}
              {layer.image_urls && layer.image_urls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {layer.image_urls.map((url, i) => (
                    <img key={i} src={url} onClick={() => setLightboxImg(url)}
                      className="h-16 w-16 object-cover rounded border border-white/10 cursor-pointer hover:opacity-80" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}