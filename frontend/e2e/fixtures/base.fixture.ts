import { test as base } from '@playwright/test';
import { setupAllMocks, type AllMocksOptions } from '../mocks/handlers';
import { TransactionsPage } from '../page-objects/TransactionsPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { BudgetPlanPage } from '../page-objects/BudgetPlanPage';
import { SettingsPage } from '../page-objects/SettingsPage';
import { AppNav } from '../page-objects/AppNav';

type Fixtures = {
  mockSetup: Awaited<ReturnType<typeof setupAllMocks>>;
  mockOptions: AllMocksOptions;
  transactionsPage: TransactionsPage;
  dashboardPage: DashboardPage;
  budgetPlanPage: BudgetPlanPage;
  settingsPage: SettingsPage;
  appNav: AppNav;
};

export const test = base.extend<Fixtures>({
  mockOptions: [{}, { option: true }],

  mockSetup: async ({ page, mockOptions }, use) => {
    const mocks = await setupAllMocks(page, mockOptions);
    await use(mocks);
  },

  transactionsPage: async ({ page, mockSetup }, use) => {
    const txPage = new TransactionsPage(page);
    await txPage.goto();
    await use(txPage);
  },

  dashboardPage: async ({ page, mockSetup }, use) => {
    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await use(dashPage);
  },

  budgetPlanPage: async ({ page, mockSetup }, use) => {
    const budgetPage = new BudgetPlanPage(page);
    await budgetPage.goto();
    await use(budgetPage);
  },

  settingsPage: async ({ page, mockSetup }, use) => {
    const settPage = new SettingsPage(page);
    await settPage.goto();
    await use(settPage);
  },

  appNav: async ({ page, mockSetup }, use) => {
    const nav = new AppNav(page);
    await use(nav);
  },
});

export { expect } from '@playwright/test';
