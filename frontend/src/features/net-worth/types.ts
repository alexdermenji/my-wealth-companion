export type NetWorthType = 'Asset' | 'Liability';

export interface NetWorthItem {
  id: string;
  name: string;
  group: string;
  type: NetWorthType;
  order: number;
  isHidden?: boolean;
  linkedBudgetCategoryId?: string | null;
}

export interface NetWorthValue {
  itemId: string;
  year: number;
  months: Record<number, number>;
}
