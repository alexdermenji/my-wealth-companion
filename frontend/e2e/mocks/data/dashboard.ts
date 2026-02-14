import type { DashboardSummary, MonthlyComparison } from '../../../src/features/dashboard/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function createMockDashboardSummary(year: number, month: number): DashboardSummary {
  const hasData = year === 2026 && month <= 2;
  return {
    year,
    month,
    breakdown: [
      {
        type: 'Income',
        totalTracked: hasData ? 3500 : 0,
        totalBudget: 5000,
        items: [
          { categoryId: 'c1', categoryName: 'Employment (Net)', group: 'Employment', tracked: hasData ? 3500 : 0, budget: 4000, percentage: hasData ? 88 : 0 },
          { categoryId: 'c2', categoryName: 'Side Hustle (Net)', group: 'Side Hustle', tracked: 0, budget: 1000, percentage: 0 },
        ],
      },
      {
        type: 'Expenses',
        totalTracked: hasData ? 85.5 : 0,
        totalBudget: 2000,
        items: [
          { categoryId: 'c3', categoryName: 'Rent', group: 'Housing', tracked: 0, budget: 1200, percentage: 0 },
          { categoryId: 'c4', categoryName: 'Groceries', group: 'Groceries', tracked: hasData ? 85.5 : 0, budget: 800, percentage: hasData ? 11 : 0 },
        ],
      },
      {
        type: 'Savings',
        totalTracked: 0,
        totalBudget: 500,
        items: [
          { categoryId: 'c5', categoryName: 'Emergency Fund', group: 'Savings', tracked: 0, budget: 500, percentage: 0 },
        ],
      },
      {
        type: 'Debt',
        totalTracked: 0,
        totalBudget: 300,
        items: [
          { categoryId: 'c6', categoryName: 'Credit Card Debt', group: 'Debt', tracked: 0, budget: 300, percentage: 0 },
        ],
      },
    ],
  };
}

export function createMockMonthlyComparison(year: number): MonthlyComparison {
  return {
    year,
    months: MONTH_NAMES.map((monthName, i) => ({
      month: i + 1,
      monthName,
      income: i < 2 ? 3500 : 0,
      expenses: i < 2 ? 85.5 : 0,
    })),
  };
}
