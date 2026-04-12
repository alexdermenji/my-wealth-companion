import { Page, Locator, expect } from '@playwright/test';

export class AppNav {
  private readonly nav: Locator;
  private readonly accountMenuButton: Locator;

  constructor(private page: Page) {
    this.nav = page.locator('header nav');
    this.accountMenuButton = page.getByRole('button', { name: 'Open account menu' });
  }

  async navigateTo(label: string) {
    await this.nav.getByRole('link', { name: label, exact: true }).click();
  }

  async openAccountMenu() {
    await this.accountMenuButton.click();
  }

  async navigateToSettings() {
    await this.openAccountMenu();
    await this.page.getByRole('menuitem', { name: 'Settings' }).click();
  }

  async expectActiveLink(label: string) {
    const link = this.nav.locator('a').filter({ hasText: label });
    await expect(link).toHaveClass(/bg-secondary/);
  }
}
