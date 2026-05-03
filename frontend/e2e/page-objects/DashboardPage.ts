import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly chart: Locator;

  constructor(readonly page: Page) {
    this.chart = page.locator('span', { hasText: 'Net Worth' }).first();
  }

  async goto() {
    await this.page.goto('/');
    await this.chart.waitFor();
  }

  getChartLegendItem(label: string): Locator {
    return this.page.locator('span', { hasText: label }).first();
  }
}
