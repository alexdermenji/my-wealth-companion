import { Page, Locator, expect } from '@playwright/test';

export class AppNav {
  private readonly nav: Locator;

  constructor(private page: Page) {
    this.nav = page.locator('aside nav');
  }

  async navigateTo(label: string) {
    await this.nav.getByText(label, { exact: true }).click();
  }

  async expectActiveLink(label: string) {
    const link = this.nav.locator('a').filter({ hasText: label });
    await expect(link).toHaveClass(/bg-primary/);
  }
}
