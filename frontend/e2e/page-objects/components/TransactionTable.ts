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

  getRowByText(text: string): Locator {
    return this.rows.filter({ hasText: text });
  }

  getRowByDetails(details: string): Locator {
    return this.getRowByText(details);
  }

  async expectRowCount(count: number) {
    if (count === 0) {
      await expect(this.emptyMessage).toBeVisible();
    } else {
      await expect(this.rows).toHaveCount(count);
    }
  }

  async expectRowContains(rowText: string, expectedTexts: string[]) {
    const row = this.getRowByText(rowText);
    for (const text of expectedTexts) {
      await expect(row).toContainText(text);
    }
  }

  async expectRowDate(rowText: string, expectedDate: string) {
    const row = this.getRowByText(rowText);
    await expect(row.locator('td').first()).toHaveText(expectedDate);
  }

  async clickEdit(rowText: string) {
    const row = this.getRowByText(rowText);
    await row.locator('button').first().click();
  }

  async clickDelete(rowText: string) {
    const row = this.getRowByText(rowText);
    await row.locator('button.text-destructive').click();
  }

  async clickDeleteByIndex(index: number) {
    const row = this.getRow(index);
    await row.locator('button.text-destructive').click();
  }
}
