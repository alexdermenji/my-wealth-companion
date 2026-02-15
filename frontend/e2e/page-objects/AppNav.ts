import { Page, Locator, expect } from '@playwright/test';

export class AppNav {
  private readonly nav: Locator;

  constructor(private page: Page) {
    this.nav = page.locator('header nav');
  }

  async navigateTo(label: string) {
    await this.nav.getByRole('link', { name: label, exact: true }).click();
  }

  async expectActiveLink(label: string) {
    const link = this.nav.locator('a').filter({ hasText: label });
    await expect(link).toHaveClass(/bg-secondary/);
  }
}
