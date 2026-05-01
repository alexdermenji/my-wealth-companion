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
    this.detailsInput = this.dialog.locator('input[placeholder*="Tesco"]');
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

    if (data.details !== undefined && await this.detailsInput.isVisible()) {
      await this.detailsInput.clear();
      await this.detailsInput.fill(data.details);
    }

    if (await this.dialog.locator('label', { hasText: 'Account' }).isVisible()) {
      await this.selectByLabel('Account', data.account);
    }

    if (data.budgetType) {
      await this.selectByLabel('Budget Type', data.budgetType);
    }

    if (data.budgetPosition) {
      await this.selectBudgetPosition(data.budgetPosition);
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

  private async selectBudgetPosition(optionText: string) {
    const posLabel = this.dialog.locator('label', { hasText: 'Budget Position' });
    const posContainer = posLabel.locator('..');
    await posContainer.locator('input').click();
    await posContainer.getByText(optionText, { exact: true }).click();
  }

  private async selectByLabel(labelText: string, optionText: string) {
    const label = this.dialog.locator('label', { hasText: labelText });
    const container = label.locator('..');
    const trigger = container.locator('button[role="combobox"]');
    const select = new RadixSelect(this.page, trigger);
    await select.selectOption(optionText);
  }
}
