import { Page, Locator } from '@playwright/test';
import { RadixSelect } from './components/RadixSelect';

export class BudgetPlanPage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budget Planning' });
  }

  async goto() {
    await this.page.goto('/budget');
    await this.heading.waitFor();
  }

  async selectYear(year: string) {
    const trigger = this.page.locator('button[role="combobox"]').first();
    const select = new RadixSelect(this.page, trigger);
    await select.selectOption(year);
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
    const input = row.locator('input').nth(monthIndex);
    await input.focus();
    await input.fill('');
    await input.fill(value);
    await input.press('Tab');
  }

  async getCategoryInput(categoryName: string, monthIndex: number): Promise<string> {
    const row = this.getCategoryRow(categoryName);
    return row.locator('input').nth(monthIndex).inputValue();
  }

  getSectionTotalRow(type: string): Locator {
    // The total row is inside the section, after category rows
    // Each section has its own table body; total row contains "Total" text
    return this.page.locator('tr').filter({ hasText: 'Total' }).filter({ hasText: type });
  }
}
