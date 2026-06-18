'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Portfolio = {
  id: string
  name: string
  type: string
  description: string | null
  created_at: string
}

const PORTFOLIO_ICONS: { [key: string]: string } = {
  'long-term': '📈',
  'aggressive': '⚡',
  'crypto': '🪙',
  'options': '🎯',
  'other': '💼',
}

const PORTFOLIO_COLORS: { [key: string]: string } = {
  'long-term': 'border-blue-500/50 hover:border-blue-400',
  'aggressive': 'border-emerald-500/50 hover:border-emerald-400',
  'crypto': 'border-yellow-500/50 hover:border-yellow-400',
  'options': 'border-purple-500/50 hover:border-purple-400',
  'other': 'border-gray-500/50 hover:border-gray-400',
}

const TYPE_LABELS: { [key: string]: string } = {
  'long-term': 'ארוך טווח',
  'aggressive': 'מסחר אגרסיבי',
  'crypto': 'קריפטו',
  'options': 'אופציות',
  'other': 'אחר',
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editPortfolio, setEditPortfolio] = useState<Portfolio | null>(null)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('long-term')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPortfolios = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data } = await supabase.from('portfolios').select('*').order('created_at')
    setPortfolios(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPortfolios() }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('portfolios').insert({
      user_id: user.id,
      name: newName.trim(),
      type: newType,
      description: newDesc.trim() || null,
    })
    setNewName(''); setNewType('long-term'); setNewDesc('')
    setShowNew(false); setSaving(false)
    await fetchPortfolios()
  }

  const handleEdit = async () => {
    if (!editPortfolio || !editPortfolio.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('portfolios').update({
      name: editPortfolio.name.trim(),
      type: editPortfolio.type,
      description: editPortfolio.description?.trim() || null,
    }).eq('id', editPortfolio.id)
    setEditPortfolio(null); setSaving(false)
    await fetchPortfolios()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את התיק?')) return
    const supabase = createClient()
    await supabase.from('portfolios').delete().eq('id', id)
    await fetchPortfolios()
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">טוען...</div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">יומן מסחר</h1>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors text-sm">התנתק</button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">התיקים שלי</h2>
          <p className="text-gray-400">בחר תיק להמשיך או צור תיק חדש</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {portfolios.map(p => (
            <div
              key={p.id}
              onClick={() => window.location.href = `/dashboard?portfolio=${p.id}`}
              className={`bg-gray-900 rounded-2xl border-2 p-6 cursor-pointer transition-all hover:scale-105 hover:bg-gray-800 ${PORTFOLIO_COLORS[p.type] || PORTFOLIO_COLORS['other']}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-4xl">{PORTFOLIO_ICONS[p.type] || '💼'}</span>
                <div className="flex gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); setEditPortfolio({ ...p }) }}
                    className="text-gray-600 hover:text-emerald-400 text-sm transition-colors px-1"
                  >✏️</button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                    className="text-gray-600 hover:text-red-400 text-sm transition-colors px-1"
                  >✕</button>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">{p.name}</h3>
              {p.description && <p className="text-gray-400 text-sm">{p.description}</p>}
              <div className="mt-4 text-xs text-gray-500">{TYPE_LABELS[p.type] || 'אחר'}</div>
            </div>
          ))}

          <div
            onClick={() => setShowNew(true)}
            className="bg-gray-900 rounded-2xl border-2 border-dashed border-gray-700 p-6 cursor-pointer transition-all hover:border-emerald-500 hover:bg-gray-800 flex flex-col items-center justify-center min-h-[160px] gap-2"
          >
            <span className="text-4xl text-gray-600">+</span>
            <span className="text-gray-500 text-sm">תיק חדש</span>
          </div>
        </div>

        {/* טופס תיק חדש */}
        {showNew && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">תיק חדש</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">שם התיק</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="לדוגמה: תיק ארוך טווח"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">סוג</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                    <option value="long-term">📈 ארוך טווח</option>
                    <option value="aggressive">⚡ מסחר אגרסיבי</option>
                    <option value="crypto">🪙 קריפטו</option>
                    <option value="options">🎯 אופציות</option>
                    <option value="other">💼 אחר</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">תיאור (אופציונלי)</label>
                  <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="תיאור קצר..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={handleCreate} disabled={saving || !newName.trim()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {saving ? 'יוצר...' : 'צור תיק'}
                  </button>
                  <button onClick={() => setShowNew(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors">
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* טופס עריכת תיק */}
        {editPortfolio && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setEditPortfolio(null)}>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">עריכת תיק</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">שם התיק</label>
                  <input value={editPortfolio.name}
                    onChange={e => setEditPortfolio({ ...editPortfolio, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">סוג</label>
                  <select value={editPortfolio.type}
                    onChange={e => setEditPortfolio({ ...editPortfolio, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                    <option value="long-term">📈 ארוך טווח</option>
                    <option value="aggressive">⚡ מסחר אגרסיבי</option>
                    <option value="crypto">🪙 קריפטו</option>
                    <option value="options">🎯 אופציות</option>
                    <option value="other">💼 אחר</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">תיאור (אופציונלי)</label>
                  <input value={editPortfolio.description || ''}
                    onChange={e => setEditPortfolio({ ...editPortfolio, description: e.target.value })}
                    placeholder="תיאור קצר..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={handleEdit} disabled={saving || !editPortfolio.name.trim()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {saving ? 'שומר...' : 'שמור שינויים'}
                  </button>
                  <button onClick={() => setEditPortfolio(null)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors">
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}