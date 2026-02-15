import { Page, Locator, expect } from '@playwright/test';
import { RadixSelect } from './components/RadixSelect';

export class DashboardPage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budget Dashboard' });
  }

  async goto() {
    await this.page.goto('/');
    await this.heading.waitFor();
  }

  async selectYear(year: string) {
    const triggers = this.page.locator('.flex.gap-2 button[role="combobox"]');
    const yearSelect = new RadixSelect(this.page, triggers.first());
    await yearSelect.selectOption(year);
  }

  async selectMonth(month: string) {
    const triggers = this.page.locator('.flex.gap-2 button[role="combobox"]');
    const monthSelect = new RadixSelect(this.page, triggers.nth(1));
    await monthSelect.selectOption(month);
  }

  async getSummaryValue(label: string): Promise<string> {
    const card = this.page.locator('.rounded-lg').filter({ hasText: label });
    return card.locator('.stat-value').first().innerText();
  }

  getBreakdownTitle(): Locator {
    return this.page.locator('h2, h3').filter({ hasText: /Breakdown —/ });
  }

  getChartCard(title: string): Locator {
    return this.page.locator('.rounded-lg').filter({ hasText: title });
  }

  getPieEmptyMessage(): Locator {
    return this.page.getByText('No expense data for this period');
  }
}
