'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type MatchedTrade = {
  symbol: string
  buyDate: string
  sellDate: string
  buyPrice: number
  sellPrice: number
  shares: number
  buyAmount: number
  result: number
}

type OpenPosition = {
  symbol: string
  buyDate: string
  shares: number
  buyAmount: number
}

type AnalysisResult = {
  closed: MatchedTrade[]
  open: OpenPosition[]
  platform: string
}

export default function ImportPage() {
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)

  const getPortfolioId = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('portfolio')
  }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
    setResult(null)
    setDone(false)
  }

  const handleAnalyze = async () => {
    if (images.length === 0) return
    setLoading(true)
    setResult(null)

    try {
      const base64Images = await Promise.all(images.map(file =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      ))

      const response = await fetch('/api/analyze-blink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images }),
      })

      const data = await response.json()

      if (data.error) {
        alert('שגיאת שרת: ' + data.error)
      } else {
        setResult(data)
      }
    } catch (err: any) {
      alert('שגיאה: ' + (err.message || 'לא ידועה'))
    }
    setLoading(false)
  }

  const handleImport = async () => {
    if (!result) return
    setImporting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const portfolioId = getPortfolioId()
    const trades = []

    for (const t of result.closed) {
      trades.push({
        user_id: user.id,
        portfolio_id: portfolioId || null,
        date: t.buyDate,
        symbol: t.symbol,
        entry_price: t.buyPrice,
        shares: t.shares,
        position_size: t.buyAmount,
        result: parseFloat(t.result.toFixed(2)),
        notes: `ייבוא מ${result.platform} — נמכר ב-${t.sellDate} במחיר $${t.sellPrice}`,
      })
    }

    for (const p of result.open) {
      trades.push({
        user_id: user.id,
        portfolio_id: portfolioId || null,
        date: p.buyDate,
        symbol: p.symbol,
        entry_price: parseFloat((p.buyAmount / p.shares).toFixed(4)),
        shares: p.shares,
        position_size: p.buyAmount,
        result: null,
        notes: `ייבוא מ${result.platform} — פוזיציה פתוחה`,
      })
    }

    await supabase.from('trades').insert(trades)
    setImporting(false)
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">יומן מסחר</h1>
        <button
          onClick={() => {
            const pid = getPortfolioId()
            window.location.href = pid ? `/dashboard?portfolio=${pid}` : '/dashboard'
          }}
          className="text-sm text-gray-400 hover:text-white transition-colors">
          ← חזרה לדשבורד
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">ייבוא עסקאות מתמונה</h2>
        <p className="text-gray-400 text-sm mb-8">
          העלה צילומי מסך מכל פלטפורמה — בלינק, Interactive Brokers, בנק ועוד.
          ה-AI יזהה את העסקאות ויכניס אותן אוטומטית לתיק.
        </p>

        {/* העלאת תמונות */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <label className="block text-sm text-gray-400 mb-1">צילומי מסך של עסקאות</label>
          <p className="text-xs text-gray-600 mb-3">אפשר להעלות כמה תמונות — מכל פלטפורמה</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-emerald-600 file:text-white file:text-sm cursor-pointer"
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {previews.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt={`תמונה ${i + 1}`} className="rounded-lg object-cover h-32 w-full border border-gray-700" />
                  <span className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {images.length > 0 && !result && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-4 rounded-xl transition-colors text-lg mb-6">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⟳</span> מנתח תמונות עם AI...
              </span>
            ) : '🤖 נתח עם AI'}
          </button>
        )}

        {/* תוצאות */}
        {result && (
          <div className="flex flex-col gap-6">

            {/* זיהוי פלטפורמה */}
            {result.platform && (
              <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                זוהתה פלטפורמה: <span className="font-bold text-white">{result.platform}</span>
                <span className="text-gray-500 mr-auto">{result.closed.length + result.open.length} עסקאות נמצאו</span>
              </div>
            )}

            {/* טריידים סגורים */}
            {result.closed.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4 text-emerald-400">✅ עסקאות סגורות ({result.closed.length})</h3>
                <div className="flex flex-col gap-3">
                  {result.closed.map((t, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white text-lg">{t.symbol}</p>
                        <p className="text-xs text-gray-400 mt-0.5">קניה: {t.buyDate} @ ${t.buyPrice}</p>
                        <p className="text-xs text-gray-400">מכירה: {t.sellDate} @ ${t.sellPrice}</p>
                        <p className="text-xs text-gray-500">{t.shares} מניות</p>
                      </div>
                      <span className={`font-bold text-xl ${t.result >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.result >= 0 ? '+' : ''}${t.result.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* פוזיציות פתוחות */}
            {result.open.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">📂 פוזיציות פתוחות ({result.open.length})</h3>
                <div className="flex flex-col gap-3">
                  {result.open.map((p, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white text-lg">{p.symbol}</p>
                        <p className="text-xs text-gray-400 mt-0.5">קניה: {p.buyDate}</p>
                        <p className="text-xs text-gray-500">{p.shares} מניות</p>
                      </div>
                      <span className="text-yellow-400 font-bold text-lg">${p.buyAmount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.closed.length === 0 && result.open.length === 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">
                <p className="text-lg">לא נמצאו עסקאות בתמונות</p>
                <p className="text-sm mt-2">נסה תמונות ברורות יותר או מזווית אחרת</p>
              </div>
            )}

            {(result.closed.length > 0 || result.open.length > 0) && (
              done ? (
                <div className="bg-emerald-900/50 border border-emerald-700 rounded-xl p-4 text-center">
                  <p className="text-emerald-400 font-semibold text-lg">✅ יובאו {result.closed.length + result.open.length} עסקאות בהצלחה!</p>
                  <button
                    onClick={() => {
                      const pid = getPortfolioId()
                      window.location.href = pid ? `/dashboard?portfolio=${pid}` : '/dashboard'
                    }}
                    className="mt-3 text-sm text-emerald-300 hover:text-white transition-colors">
                    → עבור לדשבורד
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-4 rounded-xl transition-colors text-lg">
                  {importing ? 'מייבא...' : `📥 ייבא ${result.closed.length + result.open.length} עסקאות לתיק`}
                </button>
              )
            )}
          </div>
        )}
      </main>
    </div>
  )
}