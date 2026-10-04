import { test, expect } from '../../fixtures/base.fixture';
import type { Page } from '@playwright/test';
async function fillDebt(page: Page) {
  await page.getByLabel('Principal balance').fill('1000');
  await page.getByLabel('Annual interest rate').fill('12');
  await page.getByLabel('Monthly payment (').fill('510');
}
for (const mobile of [false, true]) {
  test(`${mobile ? 'mobile' : 'desktop'} savings, persistence, partial contribution, history and goal change`, async ({
    page,
    mockSetup,
  }) => {
    test.setTimeout(60000);
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const card = page.getByRole('region', { name: 'Goal Boost' });
    await card.getByRole('button', { name: 'Choose', exact: true }).click();
    await page.getByLabel('Budget category').selectOption('c6');
    await fillDebt(page);
    await page
      .getByRole('button', { name: 'Save goal', exact: true })
      .click();
    await card.getByRole('button', { name: 'Add a boost' }).click();
    await page.getByLabel('Boost type').selectOption('voucher');
    await page.getByLabel('Description', { exact: true }).fill('Asda');
    await page.getByLabel('Voucher value').fill('100');
    await page.getByLabel('Amount paid').fill('96');
    await expect(page.getByText(/Saved: .*4.00/)).toBeVisible();
    mockSetup.goalBoostMock.failNext();
    await page
      .getByRole('button', { name: 'Save boost', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText('Save failed');
    await expect(
      page.getByLabel('Description', { exact: true }),
    ).toHaveValue('Asda');
    await page
      .getByRole('button', { name: 'Save boost', exact: true })
      .click();
    await expect(card.getByTestId('boost-available')).toContainText('4.00');
    await page.reload();
    await expect(card.getByTestId('boost-available')).toContainText('4.00');
    await card.getByRole('button', { name: 'Record repayment' }).click();
    await page.getByLabel('Transaction source').selectOption('new');
    await page
      .getByRole('combobox', { name: 'Account', exact: true })
      .selectOption('1');
    await page.getByLabel('Full transaction amount').fill('100');
    await page
      .getByLabel('Description', { exact: true })
      .fill('Extra card payment');
    await page.getByLabel('Amount allocated').fill('2');
    await expect(
      page.getByText(
        /Estimated interest saved by this contribution: .0\.04/,
      ),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Record contribution', exact: true })
      .click();
    await expect(card.getByTestId('boost-available')).toContainText('2.00');
    await expect(card.getByTestId('boost-interest')).toContainText('0.04');
    await page.reload();
    await expect(card.getByTestId('boost-interest')).toContainText('0.04');
    await card.getByRole('button', { name: 'Change', exact: true }).click();
    await page.getByLabel('Budget category').selectOption('c5');
    await page
      .getByRole('button', { name: 'Save goal', exact: true })
      .click();
    await expect(
      card.getByText('Emergency Fund', { exact: true }),
    ).toBeVisible();
    await expect(card.getByTestId('boost-available')).toContainText('2.00');
    await card.getByRole('button', { name: 'View all' }).click();
    await expect(page.getByRole('dialog')).toContainText(
      'Credit Card Debt',
    );
    await page.getByRole('button', { name: 'Unlink', exact: true }).click();
    await page
      .getByRole('button', { name: 'Confirm', exact: true })
      .click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(card.getByTestId('boost-available')).toContainText('4.00');
    expect(mockSetup.goalBoostMock.entries).toHaveLength(1);
    await expect(card.getByTestId('boost-interest')).toContainText('0.00');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/goal-boost-${mobile ? 'mobile' : 'desktop'}.png`,
      fullPage: true,
    });
  });
}
test('links only a portion of income without counting it as interest savings', async ({
  page,
  mockSetup,
}) => {
  await page.goto('/');
  const card = page.getByRole('region', { name: 'Goal Boost' });
  await card.getByRole('button', { name: 'Choose', exact: true }).click();
  await page.getByLabel('Budget category').selectOption('c6');
  await fillDebt(page);
  await page
    .getByRole('button', { name: 'Save goal', exact: true })
    .click();
  await card.getByRole('button', { name: 'Add a boost' }).click();
  await page.getByLabel('Boost type').selectOption('received');
  await page
    .getByRole('combobox', { name: 'Transaction', exact: true })
    .selectOption('tx-1');
  await page.getByLabel('Amount allocated').fill('30');
  await page
    .getByRole('button', { name: 'Save boost', exact: true })
    .click();
  await expect(card.getByTestId('boost-available')).toContainText('30.00');
  await expect(card.getByTestId('boost-interest')).toContainText('0.00');
  expect(mockSetup.txMock.getStore()).toHaveLength(2);
});
for (const mobile of [false, true]) {
  test(`${mobile ? 'mobile' : 'desktop'} existing £4 contribution gets an estimate after setup, with validation and retry`, async ({
    page,
    mockSetup,
  }) => {
    test.setTimeout(60000);
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    mockSetup.goalBoostMock.goals.push({
      id: 'old-goal',
      category_id: 'c6',
      name: 'Credit Card Debt',
      active: true,
      kind: 'Debt',
      settings: { balance: 48257.7, payment: 981.09 },
    });
    mockSetup.goalBoostMock.entries.push(
      {
        id: 'saved',
        kind: 'saved',
        amount: 4,
        date: '2026-01-01',
        description: 'Voucher saving',
        face_value: 100,
        paid: 96,
        transaction_id: null,
        goal_id: null,
      },
      {
        id: 'old-payment',
        kind: 'contribution',
        amount: 4,
        date: '2026-01-01',
        description: 'Earlier repayment',
        face_value: null,
        paid: null,
        transaction_id: 'old-tx',
        goal_id: 'old-goal',
      },
    );
    await page.goto('/');
    const card = page.getByRole('region', { name: 'Goal Boost' });
    await expect(card.getByTestId('boost-interest')).toHaveText('—');
    await card
      .getByRole('button', { name: 'Set up interest savings' })
      .click();
    await expect(page.getByLabel('Principal balance')).toBeEmpty();
    await expect(page.getByLabel('Monthly payment (')).toBeEmpty();
    await expect(
      page.getByLabel('Balance date', { exact: true }),
    ).toHaveValue('2026-01-01');
    await fillDebt(page);
    await page.getByLabel('Monthly payment (').fill('10');
    await page
      .getByRole('button', { name: 'Save goal', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText('does not cover');
    await page.getByLabel('Monthly payment (').fill('510');
    mockSetup.goalBoostMock.failNext();
    await page
      .getByRole('button', { name: 'Save goal', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText('Save failed');
    await expect(page.getByLabel('Principal balance')).toHaveValue('1000');
    await page
      .getByRole('button', { name: 'Save goal', exact: true })
      .click();
    await expect(card.getByTestId('boost-interest')).toContainText('0.08');
    await expect(card.getByTestId('boost-available')).toContainText('0.00');
    expect(mockSetup.goalBoostMock.entries).toHaveLength(2);
    expect(mockSetup.goalBoostMock.goals).toHaveLength(1);
    await page.reload();
    await expect(card.getByTestId('boost-interest')).toContainText('0.08');
    await card.getByRole('button', { name: 'View all' }).click();
    await expect(page.getByRole('dialog')).toContainText(
      /Estimated interest saved: .0\.08/,
    );
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/boost-interest-${mobile ? 'mobile' : 'desktop'}.png`,
      fullPage: true,
    });
    await card.getByRole('button', { name: 'Edit debt details' }).click();
    await expect(page.getByLabel('Principal balance')).toHaveValue('1000');
    await expect(page.getByLabel('Annual interest rate')).toHaveValue('12');
    await page.getByLabel('Annual interest rate').fill('0');
    await page
      .getByRole('button', { name: 'Save goal', exact: true })
      .click();
    await expect(card.getByTestId('boost-interest')).toContainText('0.00');
    await expect(card.getByTestId('boost-available')).toContainText('0.00');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
