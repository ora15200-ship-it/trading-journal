// types/checklist.ts

export type ChecklistBankCategory =
  | 'fundamental'
  | 'technical'
  | 'market_context'
  | 'risk_management'
  | 'psychology'
  | 'strategy_filter';

export interface ChecklistBankItem {
  id: string;
  category: ChecklistBankCategory;
  name: string;
  description: string | null;
  requires_note: boolean;
  created_at: string;
}

export interface ChecklistTemplatePreset {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ChecklistTemplatePresetItem {
  id: string;
  preset_id: string;
  bank_item_id: string;
  default_checked: boolean;
}

export interface ChecklistTemplate {
  id: string;
  portfolio_id: string;
  name: string;
  created_at: string;
}

export interface ChecklistCategory {
  id: string;
  template_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  category_id: string;
  bank_item_id: string | null;
  text: string;
  personal_note: string | null;
  requires_note: boolean;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

export interface ChecklistCategoryWithItems extends ChecklistCategory {
  items: ChecklistItem[];
}

export interface ChecklistTemplateWithCategories extends ChecklistTemplate {
  categories: ChecklistCategoryWithItems[];
}

export interface TradeChecklistResponse {
  id: string;
  trade_id: string;
  item_id: string | null;
  item_text_snapshot: string;
  is_checked: boolean;
  note: string | null;
  overridden: boolean;
  created_at: string;
}

export interface ChecklistResponseDraft {
  item_id: string;
  item_text_snapshot: string;
  is_checked: boolean;
  note: string;
  requires_note: boolean;
  is_required: boolean;
  overridden: boolean;
}

const CATEGORY_LABELS: Record<ChecklistBankCategory, string> = {
  fundamental: 'ניתוח פונדומנטלי',
  technical: 'ניתוח טכני',
  market_context: 'הקשר שוק',
  risk_management: 'ניהול סיכונים',
  psychology: 'פסיכולוגיה ומשמעת',
  strategy_filter: 'מסנן אסטרטגיה',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as ChecklistBankCategory] ?? category;
}