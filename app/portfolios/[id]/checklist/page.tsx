'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  getTemplateForPortfolio,
  getPresets,
  buildTemplateFromPreset,
  createEmptyTemplate,
  addCategory,
  addItemToCategory,
  addCustomItem,
  removeItem,
  getBankItems,
} from '@/lib/checklist'
import {
  getCategoryLabel,
  type ChecklistTemplateWithCategories,
  type ChecklistTemplatePreset,
  type ChecklistBankItem,
  type ChecklistBankCategory,
} from '@/types/checklist'

const CATEGORY_OPTIONS: ChecklistBankCategory[] = [
  'strategy_filter',
  'technical',
  'fundamental',
  'market_context',
  'risk_management',
  'psychology',
]

export default function ChecklistPage() {
  const params = useParams()
  const portfolioId = params.id as string

  const [portfolioName, setPortfolioName] = useState('')
  const [template, setTemplate] = useState<ChecklistTemplateWithCategories | null>(null)
  const [presets, setPresets] = useState<ChecklistTemplatePreset[]>([])
  const [bankItems, setBankItems] = useState<ChecklistBankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [newCategoryKey, setNewCategoryKey] = useState<ChecklistBankCategory>('strategy_filter')

  const [openAddBankFor, setOpenAddBankFor] = useState<string | null>(null)
  const [selectedBankItemId, setSelectedBankItemId] = useState<string>('')

  const [openAddCustomFor, setOpenAddCustomFor] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')
  const [customRequiresNote, setCustomRequiresNote] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('name')
      .eq('id', portfolioId)
      .single()
    setPortfolioName(portfolio?.name || '')

    const [tpl, presetsData, bankData] = await Promise.all([
      getTemplateForPortfolio(portfolioId),
      getPresets(),
      getBankItems(),
    ])
    setTemplate(tpl)
    setPresets(presetsData)
    setBankItems(bankData)
    setLoading(false)
  }

  useEffect(() => {
    if (portfolioId) load()
  }, [portfolioId])

  const handleUsePreset = async (presetId: string) => {
    setBusy(true)
    const tpl = await buildTemplateFromPreset(portfolioId, presetId)
    setTemplate(tpl)
    setBusy(false)
  }

  const handleStartFromScratch = async () => {
    setBusy(true)
    await createEmptyTemplate(portfolioId)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setBusy(false)
  }

  const handleAddCategory = async () => {
    if (!template) return
    setBusy(true)
    await addCategory(template.id, newCategoryKey, template.categories.length)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setBusy(false)
  }

  const handleAddBankItem = async (categoryId: string) => {
    const bankItem = bankItems.find((b) => b.id === selectedBankItemId)
    if (!bankItem) return
    const category = template?.categories.find((c) => c.id === categoryId)
    setBusy(true)
    await addItemToCategory(categoryId, bankItem, category?.items.length || 0)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setOpenAddBankFor(null)
    setSelectedBankItemId('')
    setBusy(false)
  }

  const handleAddCustomItem = async (categoryId: string) => {
    if (!customText.trim()) return
    const category = template?.categories.find((c) => c.id === categoryId)
    setBusy(true)
    await addCustomItem(categoryId, customText.trim(), customRequiresNote, category?.items.length || 0)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setOpenAddCustomFor(null)
    setCustomText('')
    setCustomRequiresNote(false)
    setBusy(false)
  }

  const handleRemoveItem = async (itemId: string) => {
    setBusy(true)
    await removeItem(itemId)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setBusy(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zen-charcoal text-zen-cream flex items-center justify-center">
        טוען...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zen-charcoal text-zen-cream">
      <nav className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <img src="/logo.svg" alt="ZenStock" className="h-8 w-auto" />
        <a href="/portfolios" className="text-zen-cream/50 hover:text-zen-sage transition-colors text-sm">
          חזרה לתיקים
        </a>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="font-display text-2xl mb-1">צ'ק ליסט לפני טרייד</h2>
          <p className="text-zen-cream/50 text-sm">תיק: {portfolioName}</p>
        </div>

        {!template ? (
          <div>
            <p className="text-zen-cream/60 mb-4 text-sm">בחר תבנית מוכנה כנקודת התחלה, או התחל מאפס:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="bg-white/5 rounded-2xl border-2 border-white/15 hover:border-zen-sage p-5 transition-all"
                >
                  <h3 className="text-base font-semibold mb-1">{p.name}</h3>
                  <p className="text-xs text-zen-cream/40 mb-4">{p.description}</p>
                  <button
                    onClick={() => handleUsePreset(p.id)}
                    disabled={busy}
                    className="w-full bg-zen-sage hover:opacity-90 text-zen-charcoal py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
                  >
                    {busy ? 'בונה...' : 'השתמש בתבנית הזו'}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleStartFromScratch}
              disabled={busy}
              className="w-full bg-white/5 hover:bg-white/10 border border-dashed border-white/15 text-zen-cream/60 py-3 rounded-xl text-sm transition-colors disabled:opacity-40"
            >
              {busy ? 'יוצר...' : 'התחל מאפס'}
            </button>
          </div>
        ) : (
          <div>
            {template.categories.map((cat) => (
              <div key={cat.id} className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-4">
                <h3 className="text-sm font-semibold text-zen-sage mb-3">
                  {getCategoryLabel(cat.name as ChecklistBankCategory)}
                </h3>

                <div className="flex flex-col gap-2 mb-3">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm">{item.text}</span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={busy}
                        className="text-zen-cream/30 hover:text-red-400 text-sm px-1 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {cat.items.length === 0 && (
                    <p className="text-xs text-zen-cream/30 italic">אין פריטים בקטגוריה הזו עדיין</p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setOpenAddBankFor(openAddBankFor === cat.id ? null : cat.id)}
                    className="text-xs text-zen-cream/50 hover:text-zen-sage border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    הוסף מהבנק
                  </button>
                  <button
                    onClick={() => setOpenAddCustomFor(openAddCustomFor === cat.id ? null : cat.id)}
                    className="text-xs text-zen-cream/50 hover:text-zen-sage border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    תנאי מותאם אישית
                  </button>
                </div>

                {openAddBankFor === cat.id && (
                  <div className="mt-3 flex gap-2">
                    <select
                      value={selectedBankItemId}
                      onChange={(e) => setSelectedBankItemId(e.target.value)}
                      className="flex-1 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zen-sage"
                      style={{ backgroundColor: '#202022', color: '#F7F6F2' }}
                    >
                      <option value="" style={{ backgroundColor: '#202022', color: '#F7F6F2' }}>
                        בחר תנאי...
                      </option>
                      {bankItems
                        .filter((b) => b.category === cat.name)
                        .filter((b) => !cat.items.some((i) => i.bank_item_id === b.id))
                        .map((b) => (
                          <option
                            key={b.id}
                            value={b.id}
                            style={{ backgroundColor: '#202022', color: '#F7F6F2' }}
                          >
                            {b.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleAddBankItem(cat.id)}
                      disabled={busy || !selectedBankItemId}
                      className="bg-zen-sage hover:opacity-90 text-zen-charcoal px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
                    >
                      הוסף
                    </button>
                  </div>
                )}

                {openAddCustomFor === cat.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    <input
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="לדוגמה: בדקתי דוח רבעוני אחרון"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-sm focus:outline-none focus:border-zen-sage"
                    />
                    <label className="flex items-center gap-2 text-xs text-zen-cream/50">
                      <input
                        type="checkbox"
                        checked={customRequiresNote}
                        onChange={(e) => setCustomRequiresNote(e.target.checked)}
                      />
                      דורש שדה הערה חופשי בזמן הטרייד
                    </label>
                    <button
                      onClick={() => handleAddCustomItem(cat.id)}
                      disabled={busy || !customText.trim()}
                      className="bg-zen-sage hover:opacity-90 text-zen-charcoal py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
                    >
                      הוסף תנאי
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="bg-white/5 rounded-2xl border border-dashed border-white/15 p-5 flex gap-2 items-center">
              <select
                value={newCategoryKey}
                onChange={(e) => setNewCategoryKey(e.target.value as ChecklistBankCategory)}
                className="flex-1 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zen-sage"
                style={{ backgroundColor: '#202022', color: '#F7F6F2' }}
              >
                {CATEGORY_OPTIONS.map((key) => (
                  <option key={key} value={key} style={{ backgroundColor: '#202022', color: '#F7F6F2' }}>
                    {getCategoryLabel(key)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddCategory}
                disabled={busy}
                className="bg-white/5 hover:bg-white/10 text-zen-cream/70 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
              >
                הוסף קטגוריה
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}