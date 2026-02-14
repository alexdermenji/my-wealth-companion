import { Page, Locator, expect } from '@playwright/test';
import { TransactionFormDialog, type TransactionFormData } from './components/TransactionFormDialog';
import { TransactionTable } from './components/TransactionTable';
import { RadixSelect } from './components/RadixSelect';

export class TransactionsPage {
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly form: TransactionFormDialog;
  readonly table: TransactionTable;

  constructor(public page: Page) {
    this.heading = page.getByRole('heading', { name: 'Transactions' });
    this.addButton = page.getByRole('button', { name: /add transaction/i });
    this.form = new TransactionFormDialog(page);
    this.table = new TransactionTable(page);
  }

  async goto() {
    await this.page.goto('/transactions');
    await expect(this.heading).toBeVisible();
  }

  async openAddDialog() {
    await this.addButton.click();
    await this.form.waitForOpen();
  }

  async addTransaction(data: TransactionFormData) {
    await this.openAddDialog();
    await this.form.fillAndSubmit(data);
  }

  async filterByType(type: string) {
    const filterArea = this.page.locator('.flex.gap-3');
    const trigger = filterArea.locator('button[role="combobox"]').first();
    const select = new RadixSelect(this.page, trigger);
    await select.selectOption(type);
  }

  async filterByAccount(account: string) {
    const filterArea = this.page.locator('.flex.gap-3');
    const trigger = filterArea.locator('button[role="combobox"]').nth(1);
    const select = new RadixSelect(this.page, trigger);
    await select.selectOption(account);
  }
}
