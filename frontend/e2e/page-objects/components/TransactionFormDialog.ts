import { Page, Locator } from '@playwright/test';
import { RadixSelect } from './RadixSelect';

export interface TransactionFormData {
  date?: string;
  amount: string;
  details?: string;
  account: string;
  budgetType?: string;
  budgetPosition?: string;
}

export class TransactionFormDialog {
  readonly dialog: Locator;
  readonly dateInput: Locator;
  readonly amountInput: Locator;
  readonly detailsInput: Locator;
  readonly submitButton: Locator;

  constructor(private page: Page) {
    this.dialog = page.locator('[role="dialog"]');
    this.dateInput = this.dialog.locator('input[type="date"]');
    this.amountInput = this.dialog.locator('input[type="number"]');
    this.detailsInput = this.dialog.locator('input[placeholder*="Walmart"]');
    this.submitButton = this.dialog.getByRole('button', { name: /add|update/i });
  }

  async waitForOpen() {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async waitForClosed() {
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async fill(data: TransactionFormData) {
    if (data.date) {
      await this.dateInput.fill(data.date);
    }

    await this.amountInput.clear();
    await this.amountInput.fill(data.amount);

    if (data.details !== undefined) {
      await this.detailsInput.clear();
      await this.detailsInput.fill(data.details);
    }

    await this.selectByLabel('Account', data.account);

    if (data.budgetType) {
      await this.selectByLabel('Budget Type', data.budgetType);
    }

    if (data.budgetPosition) {
      await this.selectByLabel('Budget Position', data.budgetPosition);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async fillAndSubmit(data: TransactionFormData) {
    await this.fill(data);
    await this.submit();
    await this.waitForClosed();
  }

  private async selectByLabel(labelText: string, optionText: string) {
    const label = this.dialog.locator('label', { hasText: labelText });
    const container = label.locator('..');
    const trigger = container.locator('button[role="combobox"]');
    const select = new RadixSelect(this.page, trigger);
    await select.selectOption(optionText);
  }
}
