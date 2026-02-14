export interface BudgetPlan {
  categoryId: string;
  year: number;
  // monthly amounts keyed by month (1-12)
  months: Record<number, number>;
}
