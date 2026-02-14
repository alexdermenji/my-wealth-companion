import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly heading: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
  }

  async goto() {
    await this.page.goto('/settings');
    await this.heading.waitFor();
  }

  // --- General Settings ---

  getGeneralInput(label: string): Locator {
    return this.page.getByLabel(label);
  }

  async setGeneralValue(label: string, value: string) {
    const input = this.getGeneralInput(label);
    await input.fill('');
    await input.fill(value);
    await input.press('Tab');
  }

  // --- Accounts ---

  getAccountsTable(): Locator {
    return this.page.locator('table').first();
  }

  getAccountRows(): Locator {
    return this.getAccountsTable().locator('tbody tr');
  }

  async addAccount(name: string, type: string) {
    await this.page.getByRole('button', { name: 'Add' }).first().click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(name);
    // Type select
    await dialog.locator('button[role="combobox"]').click();
    await this.page.getByRole('listbox').getByText(type, { exact: true }).click();
    await dialog.getByRole('button', { name: /save|add|create|submit/i }).click();
  }

  async editAccount(name: string, newName: string) {
    const row = this.getAccountsTable().locator('tr').filter({ hasText: name });
    await row.getByRole('button').first().click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(newName);
    await dialog.getByRole('button', { name: /save|update|submit/i }).click();
  }

  async deleteAccount(name: string) {
    const row = this.getAccountsTable().locator('tr').filter({ hasText: name });
    await row.getByRole('button').last().click();
  }

  // --- Categories ---

  getCategoryBlock(type: string): Locator {
    return this.page.locator('.rounded-lg').filter({ hasText: `${type} Categories` });
  }

  getCategoryItems(type: string): Locator {
    return this.getCategoryBlock(type).locator('[class*="group"]');
  }

  async addCategory(type: string, data: { name: string; group: string; emoji?: string }) {
    const block = this.getCategoryBlock(type);
    await block.getByRole('button', { name: '+' }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(data.name);
    await dialog.getByLabel('Group').fill(data.group);
    if (data.emoji) {
      await dialog.getByLabel('Emoji').fill(data.emoji);
    }
    await dialog.getByRole('button', { name: /save|add|create|submit/i }).click();
  }

  async editCategory(type: string, name: string, data: { name?: string; group?: string; emoji?: string }) {
    const block = this.getCategoryBlock(type);
    const item = block.locator('[class*="group"]').filter({ hasText: name });
    await item.hover();
    // Edit button (pencil icon) - first button in the item
    await item.getByRole('button').first().click();
    const dialog = this.page.getByRole('dialog');
    if (data.name) {
      await dialog.getByLabel('Name').fill(data.name);
    }
    if (data.group) {
      await dialog.getByLabel('Group').fill(data.group);
    }
    if (data.emoji) {
      await dialog.getByLabel('Emoji').fill(data.emoji);
    }
    await dialog.getByRole('button', { name: /save|update|submit/i }).click();
  }

  async deleteCategory(type: string, name: string) {
    const block = this.getCategoryBlock(type);
    const item = block.locator('[class*="group"]').filter({ hasText: name });
    await item.hover();
    // Delete button - last button in the item
    await item.getByRole('button').last().click();
  }

  getDeleteConfirmDialog(): Locator {
    return this.page.getByRole('alertdialog');
  }

  async getDeleteConfirmText(): Promise<string> {
    return this.getDeleteConfirmDialog().locator('p').innerText();
  }

  async confirmForceDelete() {
    await this.getDeleteConfirmDialog().getByRole('button', { name: 'Delete' }).click();
  }

  async cancelDelete() {
    await this.getDeleteConfirmDialog().getByRole('button', { name: 'Cancel' }).click();
  }
}
