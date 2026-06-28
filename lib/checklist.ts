// lib/checklist.ts
import { createClient } from '@/utils/supabase/client';
import type {
  ChecklistBankItem,
  ChecklistTemplatePreset,
  ChecklistTemplatePresetItem,
  ChecklistTemplate,
  ChecklistCategory,
  ChecklistItem,
  ChecklistTemplateWithCategories,
  TradeChecklistResponse,
  ChecklistResponseDraft,
} from '@/types/checklist';

export async function getBankItems(): Promise<ChecklistBankItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checklist_bank_items')
    .select('*')
    .order('category')
    .order('name');
  if (error) throw error;
  return data as ChecklistBankItem[];
}

export async function getPresets(): Promise<ChecklistTemplatePreset[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checklist_template_presets')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as ChecklistTemplatePreset[];
}

export async function getPresetItems(presetId: string): Promise<ChecklistTemplatePresetItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checklist_template_preset_items')
    .select('*')
    .eq('preset_id', presetId);
  if (error) throw error;
  return data as ChecklistTemplatePresetItem[];
}

export async function getTemplateForPortfolio(
  portfolioId: string
): Promise<ChecklistTemplateWithCategories | null> {
  const supabase = createClient();

  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .maybeSingle();
  if (templateError) throw templateError;
  if (!template) return null;

  const { data: categories, error: categoriesError } = await supabase
    .from('checklist_categories')
    .select('*')
    .eq('template_id', template.id)
    .order('order_index');
  if (categoriesError) throw categoriesError;

  const categoryIds = (categories ?? []).map((c) => c.id);

  let items: ChecklistItem[] = [];
  if (categoryIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabase
      .from('checklist_items')
      .select('*')
      .in('category_id', categoryIds)
      .order('order_index');
    if (itemsError) throw itemsError;
    items = itemsData as ChecklistItem[];
  }

  return {
    ...(template as ChecklistTemplate),
    categories: (categories as ChecklistCategory[]).map((cat) => ({
      ...cat,
      items: items.filter((i) => i.category_id === cat.id),
    })),
  };
}

export async function createEmptyTemplate(portfolioId: string): Promise<ChecklistTemplate> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checklist_templates')
    .insert({ portfolio_id: portfolioId })
    .select()
    .single();
  if (error) throw error;
  return data as ChecklistTemplate;
}

export async function buildTemplateFromPreset(
  portfolioId: string,
  presetId: string
): Promise<ChecklistTemplateWithCategories> {
  const supabase = createClient();

  const template = await createEmptyTemplate(portfolioId);

  const [presetItems, bankItems] = await Promise.all([
    getPresetItems(presetId),
    getBankItems(),
  ]);

  const bankItemsById = new Map(bankItems.map((b) => [b.id, b]));

  const byCategory = new Map<string, typeof presetItems>();
  for (const pi of presetItems) {
    const bankItem = bankItemsById.get(pi.bank_item_id);
    if (!bankItem) continue;
    const list = byCategory.get(bankItem.category) ?? [];
    list.push(pi);
    byCategory.set(bankItem.category, list);
  }

  const categories: ChecklistCategory[] = [];
  let orderIndex = 0;

  for (const [categoryKey, presetItemsInCategory] of byCategory.entries()) {
    const { data: category, error: categoryError } = await supabase
      .from('checklist_categories')
      .insert({
        template_id: template.id,
        name: categoryKey,
        order_index: orderIndex++,
      })
      .select()
      .single();
    if (categoryError) throw categoryError;
    categories.push(category as ChecklistCategory);

    const itemsToInsert = presetItemsInCategory.map((pi, idx) => {
      const bankItem = bankItemsById.get(pi.bank_item_id)!;
      return {
        category_id: category.id,
        bank_item_id: bankItem.id,
        text: bankItem.name,
        requires_note: bankItem.requires_note,
        order_index: idx,
      };
    });

    const { error: itemsError } = await supabase
      .from('checklist_items')
      .insert(itemsToInsert);
    if (itemsError) throw itemsError;
  }

  const full = await getTemplateForPortfolio(portfolioId);
  if (!full) throw new Error('Template creation failed');
  return full;
}

export async function addCategory(
  templateId: string,
  name: string,
  orderIndex: number
): Promise<ChecklistCategory> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checklist_categories')
    .insert({ template_id: templateId, name, order_index: orderIndex })
    .select()
    .single();
  if (error) throw error;
  return data as ChecklistCategory;
}

export async function removeCategory(categoryId: string): Promise<void> {
  const supabase = createClient();
  // קודם מוחקים את כל הפריטים שבתוך הקטגוריה, ואז את הקטגוריה עצמה
  const { error: itemsError } = await supabase
    .from('checklist_items')
    .delete()
    .eq('category_id', categoryId);
  if (itemsError) throw itemsError;

  const { error } = await supabase
    .from('checklist_categories')
    .delete()
    .eq('id', categoryId);
  if (error) throw error;
}

export async function addItemToCategory(
  categoryId: string,
  bankItem: ChecklistBankItem,
  orderIndex: number,
  isRequired: boolean = false,
  personalNote: string = ''
): Promise<ChecklistItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      category_id: categoryId,
      bank_item_id: bankItem.id,
      text: bankItem.name,
      personal_note: personalNote.trim() || null,
      requires_note: bankItem.requires_note,
      is_required: isRequired,
      order_index: orderIndex,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChecklistItem;
}

export async function addCustomItem(
  categoryId: string,
  text: string,
  requiresNote: boolean,
  orderIndex: number,
  isRequired: boolean = false,
  personalNote: string = ''
): Promise<ChecklistItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      category_id: categoryId,
      bank_item_id: null,
      text,
      personal_note: personalNote.trim() || null,
      requires_note: requiresNote,
      is_required: isRequired,
      order_index: orderIndex,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChecklistItem;
}

export async function updateItemPersonalNote(itemId: string, personalNote: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('checklist_items')
    .update({ personal_note: personalNote.trim() || null })
    .eq('id', itemId);
  if (error) throw error;
}

export async function updateItemText(itemId: string, text: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('checklist_items')
    .update({ text })
    .eq('id', itemId);
  if (error) throw error;
}

export async function setItemRequired(itemId: string, isRequired: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('checklist_items')
    .update({ is_required: isRequired })
    .eq('id', itemId);
  if (error) throw error;
}

export async function removeItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('checklist_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function updateTemplatePhilosophy(templateId: string, philosophy: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('checklist_templates')
    .update({ philosophy: philosophy.trim() || null })
    .eq('id', templateId);
  if (error) throw error;
}

async function deleteTemplateCompletely(portfolioId: string): Promise<void> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('checklist_templates')
    .select('id')
    .eq('portfolio_id', portfolioId)
    .maybeSingle();

  if (!existing) return;

  const { data: categories } = await supabase
    .from('checklist_categories')
    .select('id')
    .eq('template_id', existing.id);

  const categoryIds = (categories || []).map((c) => c.id);

  if (categoryIds.length > 0) {
    await supabase.from('checklist_items').delete().in('category_id', categoryIds);
    await supabase.from('checklist_categories').delete().in('id', categoryIds);
  }

  await supabase.from('checklist_templates').delete().eq('id', existing.id);
}

export async function replaceTemplateWithPreset(
  portfolioId: string,
  presetId: string
): Promise<ChecklistTemplateWithCategories> {
  await deleteTemplateCompletely(portfolioId);
  return buildTemplateFromPreset(portfolioId, presetId);
}

export async function replaceTemplateWithEmpty(portfolioId: string): Promise<ChecklistTemplate> {
  await deleteTemplateCompletely(portfolioId);
  return createEmptyTemplate(portfolioId);
}

export async function saveChecklistResponses(
  tradeId: string,
  drafts: ChecklistResponseDraft[]
): Promise<void> {
  const supabase = createClient();
  if (drafts.length === 0) return;

  const rows = drafts.map((d) => ({
    trade_id: tradeId,
    item_id: d.item_id,
    item_text_snapshot: d.item_text_snapshot,
    is_checked: d.is_checked,
    note: d.note || null,
    overridden: d.overridden,
  }));

  const { error } = await supabase.from('trade_checklist_responses').insert(rows);
  if (error) throw error;
}

export async function getResponsesForTrade(tradeId: string): Promise<TradeChecklistResponse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trade_checklist_responses')
    .select('*')
    .eq('trade_id', tradeId)
    .order('created_at');
  if (error) throw error;
  return data as TradeChecklistResponse[];
}