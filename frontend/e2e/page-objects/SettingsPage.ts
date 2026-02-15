import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
  }

  async goto() {
    await this.page.goto('/settings');
    await this.heading.waitFor();
  }

  // --- General Settings ---

  private findInputByLabel(container: Locator, label: string): Locator {
    // Label and Input are siblings inside a div wrapper
    const wrapper = container.locator('div').filter({ hasText: new RegExp(`^${label}$`) });
    return wrapper.locator('input');
  }

  getGeneralInput(label: string): Locator {
    const generalCard = this.page.locator('.rounded-lg').filter({ hasText: 'General' }).first();
    return this.findInputByLabel(generalCard, label);
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
    // The "Add" button is inside the Accounts card header, as a DialogTrigger
    const accountsCard = this.page.locator('.rounded-lg').filter({ hasText: 'Accounts' });
    await accountsCard.getByRole('button', { name: /Add/ }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    // Name input — find by label text sibling
    const nameInput = this.findInputByLabel(dialog, 'Name');
    await nameInput.fill(name);
    // Type select
    await dialog.locator('button[role="combobox"]').click();
    await this.page.getByRole('listbox').getByText(type, { exact: true }).click();
    // Submit — button text is "Add" or "Update"
    await dialog.getByRole('button', { name: /^(Add|Update)$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
  }

  async editAccount(name: string, newName: string) {
    const row = this.getAccountsTable().locator('tr').filter({ hasText: name });
    // First button in row is the edit (pencil) button
    await row.getByRole('button').first().click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    const nameInput = this.findInputByLabel(dialog, 'Name');
    await nameInput.fill(newName);
    await dialog.getByRole('button', { name: /^(Add|Update)$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
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
    // The add button is the small ghost button with Plus icon in the card header
    // It's the only button in the card header area
    const headerButtons = block.locator('button');
    await headerButtons.first().click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    const nameInput = this.findInputByLabel(dialog, 'Name');
    await nameInput.fill(data.name);
    const groupInput = dialog.locator('input[placeholder*="Housing"]');
    await groupInput.fill(data.group);
    if (data.emoji) {
      const emojiInput = dialog.locator('input[placeholder="🏠"]');
      await emojiInput.fill(data.emoji);
    }
    await dialog.getByRole('button', { name: /^(Add|Update)$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
  }

  async editCategory(type: string, name: string, data: { name?: string; group?: string; emoji?: string }) {
    const block = this.getCategoryBlock(type);
    const item = block.locator('div.group').filter({ hasText: name });
    await item.hover();
    // Edit button (pencil icon) - first button in the item
    await item.getByRole('button').first().click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    if (data.name) {
      const nameInput = this.findInputByLabel(dialog, 'Name');
      await nameInput.fill(data.name);
    }
    if (data.group) {
      const groupInput = dialog.locator('input[placeholder*="Housing"]');
      await groupInput.fill(data.group);
    }
    if (data.emoji) {
      const emojiInput = dialog.locator('input[placeholder="🏠"]');
      await emojiInput.fill(data.emoji);
    }
    await dialog.getByRole('button', { name: /^(Add|Update)$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
  }

  async deleteCategory(type: string, name: string) {
    const block = this.getCategoryBlock(type);
    const item = block.locator('div.group').filter({ hasText: name });
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
