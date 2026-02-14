import { test, expect } from '../../fixtures/base.fixture';

test.describe('Edit Transaction', () => {
  test('should open edit dialog with pre-filled data', async ({ transactionsPage }) => {
    await transactionsPage.table.clickEdit('Monthly salary');
    await transactionsPage.form.waitForOpen();

    await expect(transactionsPage.form.dialog).toContainText(/edit transaction/i);
    await expect(transactionsPage.form.amountInput).toHaveValue('3500');
    await expect(transactionsPage.form.detailsInput).toHaveValue('Monthly salary');
    await expect(transactionsPage.form.submitButton).toHaveText(/update transaction/i);
  });

  test('should edit and see updated values', async ({ transactionsPage }) => {
    await transactionsPage.table.clickEdit('Monthly salary');
    await transactionsPage.form.waitForOpen();

    await transactionsPage.form.detailsInput.fill('Updated salary');
    await transactionsPage.form.amountInput.fill('4000');
    await transactionsPage.form.submit();
    await transactionsPage.form.waitForClosed();

    await transactionsPage.table.expectRowContains('Updated salary', ['$4,000.00']);
  });

  test('should edit transaction account', async ({ transactionsPage }) => {
    await transactionsPage.table.clickEdit('Walmart groceries');
    await transactionsPage.form.waitForOpen();

    const label = transactionsPage.form.dialog.locator('label', { hasText: 'Account' });
    const container = label.locator('..');
    await container.locator('button[role="combobox"]').click();
    const listbox = transactionsPage.page.locator('[role="listbox"]');
    await listbox.getByRole('option', { name: 'Credit Card 1' }).click();

    await transactionsPage.form.submit();
    await transactionsPage.form.waitForClosed();

    await transactionsPage.table.expectRowContains('Walmart groceries', ['Credit Card 1']);
  });

  test('should cancel edit without changes', async ({ transactionsPage }) => {
    await transactionsPage.table.clickEdit('Monthly salary');
    await transactionsPage.form.waitForOpen();

    await transactionsPage.form.amountInput.fill('9999');
    await transactionsPage.page.keyboard.press('Escape');
    await transactionsPage.form.waitForClosed();

    await transactionsPage.table.expectRowContains('Monthly salary', ['$3,500.00']);
  });

  test('should reject edit with empty amount', async ({ transactionsPage }) => {
    await transactionsPage.table.clickEdit('Monthly salary');
    await transactionsPage.form.waitForOpen();

    await transactionsPage.form.amountInput.clear();
    await transactionsPage.form.submit();

    await expect(transactionsPage.form.dialog).toBeVisible();
  });
});
