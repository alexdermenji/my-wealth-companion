import { Page, Locator } from '@playwright/test';
import { RadixSelect } from './components/RadixSelect';

export class BudgetPlanPage {
  readonly heading: Locator;
  readonly overviewTab: Locator;
  readonly editBudgetTab: Locator;

  constructor(readonly page: Page) {
    this.overviewTab = page.getByRole('tab', { name: /overview/i });
    this.editBudgetTab = page.getByRole('tab', { name: /edit budget/i });
    // Use the Overview tab as the page-ready signal — it is always visible on load.
    this.heading = this.overviewTab;
  }

  async goto() {
    await this.page.goto('/budget');
    await this.overviewTab.waitFor();
  }

  async switchToEditTab() {
    await this.editBudgetTab.click();
    await this.page.getByText('Allocations', { exact: true }).waitFor();
  }

  async selectYear(year: string) {
    // Year dropdown is the only combobox visible in the Edit tab bar
    const trigger = this.page.getByRole('combobox').first();
    await new RadixSelect(this.page, trigger).selectOption(year);
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

  getCellInput(categoryName: string, monthIndex: number) {
    return this.getCategoryRow(categoryName).locator('input[type="text"]').nth(monthIndex);
  }

  async setCategoryAmount(categoryName: string, monthIndex: number, value: string) {
    const row = this.getCategoryRow(categoryName);
    const input = row.locator('input[type="text"]').nth(monthIndex);
    await input.click();
    await input.selectText();
    await input.fill(value);
    await input.press('Tab');
  }

  async fillAndShiftTab(categoryName: string, monthIndex: number, value: string) {
    const input = this.getCellInput(categoryName, monthIndex);
    await input.click();
    await input.selectText();
    await input.fill(value);
    await input.press('Shift+Tab');
  }

  async shiftTabCell(categoryName: string, monthIndex: number) {
    const input = this.getCellInput(categoryName, monthIndex);
    await input.click();
    await input.press('Shift+Tab');
  }

  async getCategoryInput(categoryName: string, monthIndex: number): Promise<string> {
    const row = this.getCategoryRow(categoryName);
    const input = row.locator('input[type="text"]').nth(monthIndex);
    await input.click();
    const val = await input.inputValue();
    await input.press('Escape');
    return val;
  }

  getSectionTotalRow(type: string): Locator {
    return this.page.locator('tr').filter({ hasText: 'Total' }).filter({ hasText: type });
  }
}
