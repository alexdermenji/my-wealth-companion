import { Page } from '@playwright/test';
import { setupAccountsMock } from './accounts.handler';
import { setupCategoriesMock, type CategoriesMockOptions } from './categories.handler';
import { setupTransactionsMock, type TransactionsMockOptions } from './transactions.handler';
import { setupSettingsMock } from './settings.handler';
import { setupDashboardMock } from './dashboard.handler';
import { setupBudgetPlansMock, type BudgetPlansMockOptions } from './budget-plans.handler';
import { setupNetWorthMock } from './net-worth.handler';

export { setupAccountsMock, setupCategoriesMock, setupTransactionsMock, setupSettingsMock, setupDashboardMock, setupBudgetPlansMock, setupNetWorthMock };

export interface AllMocksOptions {
  transactions?: TransactionsMockOptions;
  categories?: CategoriesMockOptions;
  budgetPlans?: BudgetPlansMockOptions;
}

export async function setupAllMocks(page: Page, options: AllMocksOptions = {}) {
  const settingsMock = await setupSettingsMock(page);
  const accountsMock = await setupAccountsMock(page);
  const categoriesMock = await setupCategoriesMock(page, options.categories);
  const txMock = await setupTransactionsMock(page, options.transactions);
  await setupDashboardMock(page);
  const budgetPlansMock = await setupBudgetPlansMock(page, options.budgetPlans);
  const netWorthMock = await setupNetWorthMock(page);
  return { txMock, accountsMock, categoriesMock, settingsMock, budgetPlansMock, netWorthMock };
}
