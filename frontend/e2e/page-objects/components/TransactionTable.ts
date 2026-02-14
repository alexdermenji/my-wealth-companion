import { Page, Locator, expect } from '@playwright/test';

export class TransactionTable {
  readonly table: Locator;
  readonly rows: Locator;
  readonly emptyMessage: Locator;

  constructor(private page: Page) {
    this.table = page.locator('table');
    this.rows = this.table.locator('tbody tr');
    this.emptyMessage = page.getByText('No transactions yet');
  }

  async getRowCount(): Promise<number> {
    if (await this.emptyMessage.isVisible()) return 0;
    return this.rows.count();
  }

  getRow(index: number): Locator {
    return this.rows.nth(index);
  }

  getRowByDetails(details: string): Locator {
    return this.rows.filter({ hasText: details });
  }

  async expectRowCount(count: number) {
    if (count === 0) {
      await expect(this.emptyMessage).toBeVisible();
    } else {
      await expect(this.rows).toHaveCount(count);
    }
  }

  async expectRowContains(details: string, expectedTexts: string[]) {
    const row = this.getRowByDetails(details);
    for (const text of expectedTexts) {
      await expect(row).toContainText(text);
    }
  }

  async clickEdit(details: string) {
    const row = this.getRowByDetails(details);
    await row.locator('button').first().click();
  }

  async clickDelete(details: string) {
    const row = this.getRowByDetails(details);
    await row.locator('button.text-destructive').click();
  }
}
