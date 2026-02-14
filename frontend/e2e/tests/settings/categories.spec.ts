import { test, expect } from '../../fixtures/base.fixture';
import { setupAllMocks } from '../../mocks/handlers';

test.describe('Categories Settings', () => {
  test('should display 4 category blocks', async ({ settingsPage }) => {
    await expect(settingsPage.getCategoryBlock('Income')).toBeVisible();
    await expect(settingsPage.getCategoryBlock('Expenses')).toBeVisible();
    await expect(settingsPage.getCategoryBlock('Savings')).toBeVisible();
    await expect(settingsPage.getCategoryBlock('Debt')).toBeVisible();
  });

  test('should show category details', async ({ settingsPage }) => {
    const block = settingsPage.getCategoryBlock('Expenses');
    await expect(block).toContainText('Rent');
    await expect(block).toContainText('Groceries');
  });

  test('should add category', async ({ settingsPage }) => {
    await settingsPage.addCategory('Expenses', {
      name: 'Dining Out',
      group: 'Food',
      emoji: '🍽️',
    });
    await settingsPage.page.waitForTimeout(300);

    await expect(settingsPage.getCategoryBlock('Expenses')).toContainText('Dining Out');
  });

  test('should edit category', async ({ settingsPage }) => {
    await settingsPage.editCategory('Expenses', 'Groceries', {
      name: 'Weekly Groceries',
    });
    await settingsPage.page.waitForTimeout(300);

    await expect(settingsPage.getCategoryBlock('Expenses')).toContainText('Weekly Groceries');
  });

  test('should delete category without dependencies', async ({ settingsPage }) => {
    // No usageMap configured — delete should succeed immediately
    await settingsPage.deleteCategory('Savings', 'Emergency Fund');
    await settingsPage.page.waitForTimeout(300);

    await expect(settingsPage.getCategoryBlock('Savings')).not.toContainText('Emergency Fund');
  });
});

test.describe('Categories - Delete with Dependencies', () => {
  test.use({
    mockOptions: {
      categories: {
        usageMap: {
          c4: { transactionCount: 2, budgetPlanCount: 1 },
        },
      },
    },
  });

  test('should show confirm dialog when deleting category with dependencies', async ({ settingsPage }) => {
    await settingsPage.deleteCategory('Expenses', 'Groceries');

    const dialog = settingsPage.getDeleteConfirmDialog();
    await expect(dialog).toBeVisible();
    const text = await settingsPage.getDeleteConfirmText();
    expect(text).toContain('2');
    expect(text).toContain('1');
  });

  test('should force delete after confirm', async ({ settingsPage }) => {
    await settingsPage.deleteCategory('Expenses', 'Groceries');
    await settingsPage.confirmForceDelete();
    await settingsPage.page.waitForTimeout(300);

    await expect(settingsPage.getCategoryBlock('Expenses')).not.toContainText('Groceries');
  });

  test('should cancel delete', async ({ settingsPage }) => {
    await settingsPage.deleteCategory('Expenses', 'Groceries');
    await settingsPage.cancelDelete();

    await expect(settingsPage.getCategoryBlock('Expenses')).toContainText('Groceries');
  });
});
