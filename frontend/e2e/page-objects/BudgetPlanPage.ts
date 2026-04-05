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
    // Year nav pill: < 2026 >  — target the pill container's buttons specifically
    const yearPill = this.page.locator('div.rounded-full').filter({ has: this.page.locator('span').filter({ hasText: /^\d{4}$/ }) });
    const current = parseInt(await yearPill.locator('span').textContent() ?? '2026', 10);
    const target = parseInt(year, 10);
    const diff = target - current;
    if (diff < 0) {
      const prevBtn = yearPill.locator('button').first();
      for (let i = 0; i < Math.abs(diff); i++) {
        await prevBtn.click();
      }
    } else {
      const nextBtn = yearPill.locator('button').last();
      for (let i = 0; i < diff; i++) {
        await nextBtn.click();
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

  /** Returns the input locator for a month cell without clicking or focusing it. */
  getCellInput(categoryName: string, monthIndex: number) {
    return this.getCategoryRow(categoryName).locator('input[type="text"]').nth(monthIndex);
  }

  async setCategoryAmount(categoryName: string, monthIndex: number, value: string) {
    const row = this.getCategoryRow(categoryName);
    // Budget cells are text inputs, one per month column (after the 2-col category cell)
    const input = row.locator('input[type="text"]').nth(monthIndex);
    await input.click();
    await input.selectText();
    await input.fill(value);
    await input.press('Tab');
  }

  /** Type a value then press Shift+Tab to trigger the fill-forward behaviour. */
  async fillAndShiftTab(categoryName: string, monthIndex: number, value: string) {
    const input = this.getCellInput(categoryName, monthIndex);
    await input.click();
    await input.selectText();
    await input.fill(value);
    await input.press('Shift+Tab');
  }

  /** Click a cell and press Shift+Tab without typing (used to test fill from an existing value). */
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
