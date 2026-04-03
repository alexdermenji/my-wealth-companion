import { Page, Locator } from '@playwright/test';

export class BudgetPlanPage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    // Page no longer has a "Budget Planning" h1 — use the Allocations header as the ready signal
    this.heading = page.getByText('Allocations', { exact: true }).first();
  }

  async goto() {
    await this.page.goto('/budget');
    await this.page.waitForLoadState('networkidle');
  }

  async selectYear(year: string) {
    // Year nav is now arrow buttons: < 2026 >
    // Read current year then click left or right arrows accordingly
    const yearText = this.page.locator('span.font-bold').filter({ hasText: /^\d{4}$/ });
    const current = parseInt(await yearText.textContent() ?? '2026', 10);
    const target = parseInt(year, 10);
    const diff = target - current;
    const buttons = this.page.getByRole('button');
    if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) {
        await buttons.first().click();
      }
    } else {
      for (let i = 0; i < diff; i++) {
        await buttons.nth(1).click();
      }
    }
  }

  getRemainingRow(): Locator {
    return this.page.locator('tr').filter({ hasText: 'Remaining' });
  }

  getSectionHeader(type: string): Locator {
    return this.page.locator('tr').filter({ hasText: new RegExp(`^\\s*${type}\\s*$`) });
  }

  getCategoryRow(categoryName: string): Locator {
    return this.page.locator('tr').filter({ hasText: categoryName });
  }

  async setCategoryAmount(categoryName: string, monthIndex: number, value: string) {
    const row = this.getCategoryRow(categoryName);
    // Budget cells are td > span.cursor-pointer elements (one per month column)
    const cell = row.locator('td span.cursor-pointer').nth(monthIndex);
    await cell.click();
    const input = row.locator('input[type="number"]').first();
    await input.fill(value);
    await input.press('Tab');
  }

  async getCategoryInput(categoryName: string, monthIndex: number): Promise<string> {
    const row = this.getCategoryRow(categoryName);
    const cell = row.locator('td span.cursor-pointer').nth(monthIndex);
    await cell.click();
    const input = row.locator('input[type="number"]').first();
    const val = await input.inputValue();
    await input.press('Escape');
    return val;
  }

  getSectionTotalRow(type: string): Locator {
    return this.page.locator('tr').filter({ hasText: 'Total' }).filter({ hasText: type });
  }
}
