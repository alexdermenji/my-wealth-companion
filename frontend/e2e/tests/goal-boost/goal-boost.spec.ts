import { test, expect } from '../../fixtures/base.fixture';
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
    await page.getByRole('button', { name: 'Save goal', exact: true }).click();
    await card.getByRole('button', { name: 'Add a boost' }).click();
    await page.getByLabel('Boost type').selectOption('voucher');
    await page.getByLabel('Description', { exact: true }).fill('Asda');
    await page.getByLabel('Voucher value').fill('100');
    await page.getByLabel('Amount paid').fill('96');
    await expect(page.getByText(/Saved: .*4.00/)).toBeVisible();
    mockSetup.goalBoostMock.failNext();
    await page.getByRole('button', { name: 'Save boost', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Save failed');
    await expect(page.getByLabel('Description', { exact: true })).toHaveValue(
      'Asda',
    );
    await page.getByRole('button', { name: 'Save boost', exact: true }).click();
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
    await page
      .getByRole('button', { name: 'Record contribution', exact: true })
      .click();
    await expect(card.getByTestId('boost-available')).toContainText('2.00');
    await card.getByRole('button', { name: 'Change', exact: true }).click();
    await page.getByLabel('Budget category').selectOption('c5');
    await page.getByRole('button', { name: 'Save goal', exact: true }).click();
    await expect(
      card.getByText('Emergency Fund', { exact: true }),
    ).toBeVisible();
    await expect(card.getByTestId('boost-available')).toContainText('2.00');
    await card.getByRole('button', { name: 'View all' }).click();
    await expect(page.getByRole('dialog')).toContainText('Credit Card Debt');
    await page.getByRole('button', { name: 'Unlink', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(card.getByTestId('boost-available')).toContainText('4.00');
    expect(mockSetup.goalBoostMock.entries).toHaveLength(1);
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
test('links only a portion of income and calculates interest without changing available funds', async ({
  page,
  mockSetup,
}) => {
  test.setTimeout(60000);
  await page.goto('/');
  const card = page.getByRole('region', { name: 'Goal Boost' });
  await card.getByRole('button', { name: 'Choose', exact: true }).click();
  await page.getByLabel('Budget category').selectOption('c6');
  await page.getByRole('button', { name: 'Save goal', exact: true }).click();
  await card.getByRole('button', { name: 'Add a boost' }).click();
  await page.getByLabel('Boost type').selectOption('received');
  await page
    .getByRole('combobox', { name: 'Transaction', exact: true })
    .selectOption('tx-1');
  await page.getByLabel('Amount allocated').fill('30');
  await page.getByRole('button', { name: 'Save boost', exact: true }).click();
  await expect(card.getByTestId('boost-available')).toContainText('30.00');
  expect(mockSetup.txMock.getStore()).toHaveLength(2);
  await card
    .getByRole('button', { name: 'What could a payment today save?' })
    .click();
  await page.getByLabel('Current debt balance').fill('1000');
  await page.getByLabel('Annual interest rate').fill('12');
  await page.getByLabel('Monthly payment', { exact: false }).fill('510');
  await page.getByLabel('Extra payment today').fill('500');
  await expect(page.getByText('1 months sooner')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('10.00');
  await page.getByRole('button', { name: 'Save forecast settings' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Forecast settings saved',
  );
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(card.getByTestId('boost-available')).toContainText('30.00');
});
