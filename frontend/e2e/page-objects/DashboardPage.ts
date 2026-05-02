import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
  }

  async goto() {
    await this.page.goto('/');
    await this.heading.waitFor();
  }

  getChartLegendItem(label: string): Locator {
    return this.page.locator('span', { hasText: label }).first();
  }
}
