import { test, expect } from '../../fixtures/base.fixture';

test.describe('Edit Transaction', () => {
  test('should open edit dialog with pre-filled data', async ({ transactionsPage }) => {
    await transactionsPage.table.clickEdit('Monthly salary');
    await transactionsPage.form.waitForOpen();

    await expect(transactionsPage.form.dialog).toContainText(/edit transaction/i);
    await expect(transactionsPage.form.amountInput).toHaveValue('3500');
    await expect(transactionsPage.form.submitButton).toHaveText(/update transaction/i);
  });

  test('should edit and see updated values', async ({ transactionsPage }) => {
    await transactionsPage.table.clickEdit('Monthly salary');
    await transactionsPage.form.waitForOpen();

    await transactionsPage.form.amountInput.fill('4000');
    await transactionsPage.form.submit();
    await transactionsPage.form.waitForClosed();

    await transactionsPage.table.expectRowContains('Monthly salary', ['$4,000.00']);
  });

  test('should edit transaction date and show the updated date in the table', async ({ transactionsPage }) => {
    await transactionsPage.table.clickEdit('Monthly salary');
    await transactionsPage.form.waitForOpen();

    await transactionsPage.form.dateInput.fill('2026-02-10');
    await transactionsPage.form.submit();
    await transactionsPage.form.waitForClosed();

    await transactionsPage.table.expectRowDate('Monthly salary', '10-Feb-26');
  });

  test.skip('should edit transaction account', async ({ transactionsPage }) => {
    // Account field is currently hidden from the transaction form UI
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
