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
  removeCategory,
  addItemToCategory,
  addCustomItem,
  removeItem,
  getBankItems,
  setItemRequired,
  updateItemPersonalNote,
  updateItemText,
  updateTemplatePhilosophy,
  replaceTemplateWithPreset,
  replaceTemplateWithEmpty,
} from '@/lib/checklist'
import {
  getCategoryLabel,
  type ChecklistTemplateWithCategories,
  type ChecklistTemplatePreset,
  type ChecklistBankItem,
  type ChecklistBankCategory,
} from '@/types/checklist'

// קטגוריות לבחירה: השלבים מתוך "ספר הנהלים" (שלבים 2-10) + הקטגוריות הקיימות + מותאם אישית
const CATEGORY_OPTIONS: ChecklistBankCategory[] = [
  'market_condition',
  'stock_screening',
  'stock_quality',
  'setup',
  'entry_trigger',
  'confluence',
  'risk_management',
  'trade_management',
  'exit',
  'fundamental',
  'technical',
]
const CUSTOM_CATEGORY_VALUE = '__custom__'

export default function ChecklistPage() {
  const params = useParams()
  const portfolioId = params.id as string

  const [portfolioName, setPortfolioName] = useState('')
  const [template, setTemplate] = useState<ChecklistTemplateWithCategories | null>(null)
  const [presets, setPresets] = useState<ChecklistTemplatePreset[]>([])
  const [bankItems, setBankItems] = useState<ChecklistBankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [newCategoryKey, setNewCategoryKey] = useState<string>(CATEGORY_OPTIONS[0])
  const [customCategoryName, setCustomCategoryName] = useState('')

  const [openAddBankFor, setOpenAddBankFor] = useState<string | null>(null)
  const [selectedBankItemId, setSelectedBankItemId] = useState<string>('')
  const [bankPersonalNote, setBankPersonalNote] = useState('')

  const [openAddCustomFor, setOpenAddCustomFor] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')
  const [customRequiresNote, setCustomRequiresNote] = useState(false)
  const [customPersonalNote, setCustomPersonalNote] = useState('')

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editNote, setEditNote] = useState('')

  // פילוסופיית האסטרטגיה
  const [philosophyDraft, setPhilosophyDraft] = useState('')
  const [editingPhilosophy, setEditingPhilosophy] = useState(false)
  const [savingPhilosophy, setSavingPhilosophy] = useState(false)

  // מתג החלפת תבנית
  const [showTemplateSwitcher, setShowTemplateSwitcher] = useState(false)

  // פאנל ZEN Bot
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisText, setAnalysisText] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

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
    setPhilosophyDraft(tpl?.philosophy || '')
    setPresets(presetsData)
    setBankItems(bankData)
    setLoading(false)
  }

  useEffect(() => {
    if (portfolioId) load()
  }, [portfolioId])

  const handleUsePreset = async (presetId: string) => {
    if (template) {
      if (!confirm('החלפת התבנית תמחק את כל הקטגוריות והתנאים הקיימים בתבנית הנוכחית. להמשיך?')) return
    }
    setBusy(true)
    const tpl = template
      ? await replaceTemplateWithPreset(portfolioId, presetId)
      : await buildTemplateFromPreset(portfolioId, presetId)
    setTemplate(tpl)
    setPhilosophyDraft(tpl?.philosophy || '')
    setShowTemplateSwitcher(false)
    setBusy(false)
  }

  const handleStartFromScratch = async () => {
    if (template) {
      if (!confirm('המעבר לבנייה אישית ימחק את כל הקטגוריות והתנאים הקיימים בתבנית הנוכחית. להמשיך?')) return
    }
    setBusy(true)
    if (template) {
      await replaceTemplateWithEmpty(portfolioId)
    } else {
      await createEmptyTemplate(portfolioId)
    }
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setPhilosophyDraft(tpl?.philosophy || '')
    setShowTemplateSwitcher(false)
    setBusy(false)
  }

  const handleSavePhilosophy = async () => {
    if (!template) return
    setSavingPhilosophy(true)
    await updateTemplatePhilosophy(template.id, philosophyDraft)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setEditingPhilosophy(false)
    setSavingPhilosophy(false)
  }

  const handleAddCategory = async () => {
    if (!template) return
    const isCustom = newCategoryKey === CUSTOM_CATEGORY_VALUE
    const name = isCustom ? customCategoryName.trim() : newCategoryKey
    if (isCustom && !name) return
    setBusy(true)
    await addCategory(template.id, name, template.categories.length)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setCustomCategoryName('')
    setBusy(false)
  }

  const handleRemoveCategory = async (categoryId: string) => {
    if (!confirm('למחוק את הקטגוריה הזו וכל התנאים שבתוכה?')) return
    setBusy(true)
    await removeCategory(categoryId)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setBusy(false)
  }

  const handleAddBankItem = async (categoryId: string) => {
    const bankItem = bankItems.find((b) => b.id === selectedBankItemId)
    if (!bankItem) return
    const category = template?.categories.find((c) => c.id === categoryId)
    setBusy(true)
    await addItemToCategory(categoryId, bankItem, category?.items.length || 0, false, bankPersonalNote)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setOpenAddBankFor(null)
    setSelectedBankItemId('')
    setBankPersonalNote('')
    setBusy(false)
  }

  const handleAddCustomItem = async (categoryId: string) => {
    if (!customText.trim()) return
    const category = template?.categories.find((c) => c.id === categoryId)
    setBusy(true)
    await addCustomItem(
      categoryId,
      customText.trim(),
      customRequiresNote,
      category?.items.length || 0,
      false,
      customPersonalNote
    )
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setOpenAddCustomFor(null)
    setCustomText('')
    setCustomRequiresNote(false)
    setCustomPersonalNote('')
    setBusy(false)
  }

  const handleRemoveItem = async (itemId: string) => {
    setBusy(true)
    await removeItem(itemId)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setBusy(false)
  }

  const handleToggleRequired = async (itemId: string, current: boolean) => {
    setBusy(true)
    await setItemRequired(itemId, !current)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    setBusy(false)
  }

  const startEditing = (itemId: string, currentText: string, currentNote: string | null) => {
    setEditingItemId(itemId)
    setEditText(currentText)
    setEditNote(currentNote || '')
  }

  const cancelEditing = () => {
    setEditingItemId(null)
    setEditText('')
    setEditNote('')
  }

  const handleSaveEdit = async (itemId: string, isCustomItem: boolean) => {
    setBusy(true)
    if (isCustomItem && editText.trim()) {
      await updateItemText(itemId, editText.trim())
    }
    await updateItemPersonalNote(itemId, editNote)
    const tpl = await getTemplateForPortfolio(portfolioId)
    setTemplate(tpl)
    cancelEditing()
    setBusy(false)
  }

  const handleAnalyze = async () => {
    if (!template) return
    setAnalysisLoading(true)
    setAnalysisError(null)
    try {
      const categoriesPayload = template.categories.map((cat) => ({
        label: getCategoryLabel(cat.name),
        items: cat.items.map((item) => ({
          text: item.text,
          personal_note: item.personal_note,
          is_required: item.is_required,
        })),
      }))

      const res = await fetch('/api/analyze-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioName,
          philosophy: template.philosophy,
          categories: categoriesPayload,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setAnalysisError(data.error)
      } else {
        setAnalysisText(data.analysis)
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'שגיאה בניתוח')
    } finally {
      setAnalysisLoading(false)
    }
  }

  const openAnalysisPanel = () => {
    setShowAnalysis(true)
    if (!analysisText && !analysisLoading) {
      handleAnalyze()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zen-charcoal text-zen-cream flex items-center justify-center">
        טוען...
      </div>
    )
  }

  const showSelector = !template || showTemplateSwitcher

  // סדר תצוגה קבוע לקטגוריות, לפי השלבים הלוגיים של האסטרטגיה (לא לפי סדר ההוספה)
  const CATEGORY_DISPLAY_ORDER: Record<string, number> = {
    market_condition: 1,
    stock_screening: 2,
    stock_quality: 3,
    setup: 4,
    entry_trigger: 5,
    confluence: 6,
    risk_management: 7,
    trade_management: 8,
    exit: 9,
    fundamental: 10,
    technical: 11,
    psychology: 12,
    strategy_filter: 13,
    market_context: 14,
  }

  const sortedCategories = template
    ? [...template.categories].sort((a, b) => {
        const orderA = CATEGORY_DISPLAY_ORDER[a.name] ?? 999
        const orderB = CATEGORY_DISPLAY_ORDER[b.name] ?? 999
        if (orderA !== orderB) return orderA - orderB
        return a.order_index - b.order_index
      })
    : []

  return (
    <div className="min-h-screen bg-zen-charcoal text-zen-cream">
      <nav className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <img src="/logo.svg" alt="ZenStock" className="h-8 w-auto" />
        <div className="flex items-center gap-4">
          {template && (
            <>
              <button
                onClick={() => setShowTemplateSwitcher(true)}
                className="bg-white/10 hover:bg-white/15 text-zen-cream px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🔄 ערוך תבנית
              </button>
              <button
                onClick={openAnalysisPanel}
                className="bg-white/10 hover:bg-white/15 text-zen-cream px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🤖 ניתוח ZEN Bot
              </button>
            </>
          )}
          <a href="/portfolios" className="text-zen-cream/50 hover:text-zen-sage transition-colors text-sm">
            חזרה לתיקים
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="font-display text-2xl mb-1">אסטרטגיה אישית</h2>
          <p className="text-zen-cream/50 text-sm">תיק: {portfolioName}</p>
        </div>

        {showSelector ? (
          <div>
            {template && (
              <button
                onClick={() => setShowTemplateSwitcher(false)}
                className="text-zen-cream/40 hover:text-zen-cream text-sm mb-4 inline-block"
              >
                ← ביטול, חזרה לתבנית הנוכחית
              </button>
            )}
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
              <div className="bg-white/5 rounded-2xl border-2 border-dashed border-white/15 hover:border-zen-sage p-5 transition-all">
                <h3 className="text-base font-semibold mb-1">בנייה אישית</h3>
                <p className="text-xs text-zen-cream/40 mb-4">
                  עמוד ריק לחלוטין — תבנה את כל הקטגוריות והתנאים בעצמך מאפס
                </p>
                <button
                  onClick={handleStartFromScratch}
                  disabled={busy}
                  className="w-full bg-white/10 hover:bg-white/15 text-zen-cream py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  {busy ? 'יוצר...' : 'התחל מאפס'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* שלב 1 - פילוסופיית האסטרטגיה */}
            <div className="bg-white/5 rounded-2xl border border-zen-sage/30 p-5 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-zen-sage">
                  שלב 1 · פילוסופיית האסטרטגיה
                </h3>
                {!editingPhilosophy && (
                  <button
                    onClick={() => setEditingPhilosophy(true)}
                    className="text-zen-cream/30 hover:text-zen-sage text-sm px-1 transition-colors"
                  >
                    ✏️
                  </button>
                )}
              </div>
              <p className="text-xs text-zen-cream/40 mb-3">
                מה אני מחפש? באילו שווקים אני סוחר? מה היתרון (Edge) שלי?
              </p>
              {editingPhilosophy ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={philosophyDraft}
                    onChange={(e) => setPhilosophyDraft(e.target.value)}
                    placeholder="לדוגמה: אני מחפש מניות איכותיות במגמת עלייה שמבצעות פריצה של תבנית המשך עם ווליום גבוה."
                    rows={3}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-sm focus:outline-none focus:border-zen-sage resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePhilosophy}
                      disabled={savingPhilosophy}
                      className="bg-zen-sage hover:opacity-90 text-zen-charcoal px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
                    >
                      {savingPhilosophy ? 'שומר...' : 'שמור'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPhilosophy(false)
                        setPhilosophyDraft(template.philosophy || '')
                      }}
                      className="bg-white/5 hover:bg-white/10 text-zen-cream/60 px-4 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : template.philosophy ? (
                <p className="text-sm text-zen-cream/80 whitespace-pre-wrap">{template.philosophy}</p>
              ) : (
                <p className="text-xs text-zen-cream/30 italic">לא נכתבה עדיין פילוסופיה לאסטרטגיה</p>
              )}
            </div>

            {/* שלבים 2-10 - קטגוריות, בסדר קבוע */}
            {sortedCategories.map((cat) => (
              <div key={cat.id} className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-zen-sage">
                    {getCategoryLabel(cat.name)}
                  </h3>
                  <button
                    onClick={() => handleRemoveCategory(cat.id)}
                    disabled={busy}
                    className="text-zen-cream/30 hover:text-red-400 text-xs px-2 py-1 transition-colors whitespace-nowrap"
                  >
                    🗑 מחק קטגוריה
                  </button>
                </div>

                <div className="flex flex-col gap-2 mb-3">
                  {cat.items.map((item) => {
                    const isCustomItem = !item.bank_item_id
                    const isEditing = editingItemId === item.id

                    if (isEditing) {
                      return (
                        <div key={item.id} className="bg-white/5 rounded-lg px-3 py-3 flex flex-col gap-2">
                          {isCustomItem ? (
                            <input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-sm focus:outline-none focus:border-zen-sage"
                            />
                          ) : (
                            <span className="text-sm font-medium">{item.text}</span>
                          )}
                          <textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="הסבר אישי (אופציונלי)... לדוגמה: אני מחפש מניות עם ווליום גבוה מהממוצע"
                            rows={2}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-xs focus:outline-none focus:border-zen-sage resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(item.id, isCustomItem)}
                              disabled={busy}
                              className="bg-zen-sage hover:opacity-90 text-zen-charcoal px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
                            >
                              שמור
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-white/5 hover:bg-white/10 text-zen-cream/60 px-4 py-1.5 rounded-lg text-xs transition-colors"
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between bg-white/5 rounded-lg px-3 py-2 gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{item.text}</span>
                          {item.personal_note && (
                            <p className="text-xs text-zen-cream/40 mt-1">{item.personal_note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleToggleRequired(item.id, item.is_required)}
                            disabled={busy}
                            className={`text-[11px] px-2 py-1 rounded-md border transition-colors whitespace-nowrap ${
                              item.is_required
                                ? 'border-zen-sage text-zen-sage bg-zen-sage/10'
                                : 'border-white/15 text-zen-cream/40'
                            }`}
                          >
                            {item.is_required ? 'חובה' : 'לא חובה'}
                          </button>
                          <button
                            onClick={() => startEditing(item.id, item.text, item.personal_note)}
                            disabled={busy}
                            className="text-zen-cream/30 hover:text-zen-sage text-sm px-1 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={busy}
                            className="text-zen-cream/30 hover:text-red-400 text-sm px-1 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
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
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex gap-2">
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
                    <textarea
                      value={bankPersonalNote}
                      onChange={(e) => setBankPersonalNote(e.target.value)}
                      placeholder="הסבר אישי (אופציונלי)... לדוגמה: אני מחפש מניות עם ווליום גבוה מהממוצע"
                      rows={2}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-xs focus:outline-none focus:border-zen-sage resize-none"
                    />
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
                    <textarea
                      value={customPersonalNote}
                      onChange={(e) => setCustomPersonalNote(e.target.value)}
                      placeholder="הסבר אישי (אופציונלי)..."
                      rows={2}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-xs focus:outline-none focus:border-zen-sage resize-none"
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

            <div className="bg-white/5 rounded-2xl border border-dashed border-white/15 p-5 flex flex-col gap-2 mb-4">
              <div className="flex gap-2 items-center">
                <select
                  value={newCategoryKey}
                  onChange={(e) => setNewCategoryKey(e.target.value)}
                  className="flex-1 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zen-sage"
                  style={{ backgroundColor: '#202022', color: '#F7F6F2' }}
                >
                  {CATEGORY_OPTIONS.map((key) => (
                    <option key={key} value={key} style={{ backgroundColor: '#202022', color: '#F7F6F2' }}>
                      {getCategoryLabel(key)}
                    </option>
                  ))}
                  <option value={CUSTOM_CATEGORY_VALUE} style={{ backgroundColor: '#202022', color: '#F7F6F2' }}>
                    קטגוריה מותאמת אישית +
                  </option>
                </select>
                <button
                  onClick={handleAddCategory}
                  disabled={busy || (newCategoryKey === CUSTOM_CATEGORY_VALUE && !customCategoryName.trim())}
                  className="bg-white/5 hover:bg-white/10 text-zen-cream/70 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
                >
                  הוסף קטגוריה
                </button>
              </div>
              {newCategoryKey === CUSTOM_CATEGORY_VALUE && (
                <input
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="שם הקטגוריה שלך, לדוגמה: ניתוח רוחב שוק"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zen-cream text-sm focus:outline-none focus:border-zen-sage"
                />
              )}
            </div>

            {/* שלבים 11-12 - תיעוד וסטטיסטיקה, מתבצעים בדשבורד */}
            <div className="bg-white/5 rounded-2xl border border-dashed border-zen-sage/30 p-5">
              <h3 className="text-sm font-semibold text-zen-sage mb-2">
                שלבים 11-12 · תיעוד וסטטיסטיקה
              </h3>
              <p className="text-xs text-zen-cream/50 mb-4 leading-relaxed">
                השלבים האחרונים ב"ספר הנהלים" — תיעוד כל עסקה (תמונות, הערות, סיבת הכניסה) וחישוב
                הסטטיסטיקות (Win Rate, רווח כולל, וכו') — לא מתבצעים בעמוד הזה, הם כבר קורים
                אוטומטית בדשבורד שלך: כל טרייד שאתה שומר נספר, ותוכל לראות את ההיסטוריה והנתונים
                המצטברים שם.
              </p>
              
              <button
                onClick={() => { window.location.href = `/dashboard?portfolio=${portfolioId}` }}
                className="inline-block bg-zen-sage hover:opacity-90 text-zen-charcoal px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
              >
                למעבר לדשבורד →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* פאנל ZEN Bot בצד */}
      {showAnalysis && (
        <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowAnalysis(false)}>
          <div
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-zen-charcoal border-l border-white/10 p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">🤖 ניתוח ZEN Bot</h3>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-zen-cream/40 hover:text-zen-cream text-lg px-1"
              >
                ✕
              </button>
            </div>
            <p className="text-zen-cream/40 text-sm mb-5">תיק: {portfolioName}</p>

            {analysisLoading ? (
              <div className="text-zen-cream/40 text-sm py-10 text-center">מנתח את האסטרטגיה...</div>
            ) : analysisError ? (
              <div className="text-red-400 text-sm">{analysisError}</div>
            ) : analysisText ? (
              <p className="text-zen-cream/80 text-sm leading-relaxed whitespace-pre-wrap">{analysisText}</p>
            ) : (
              <div className="text-zen-cream/40 text-sm py-10 text-center">אין עדיין ניתוח</div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={analysisLoading}
              className="w-full mt-6 bg-white/10 hover:bg-white/15 text-zen-cream py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              {analysisLoading ? 'מנתח...' : '🔄 נתח מחדש'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}