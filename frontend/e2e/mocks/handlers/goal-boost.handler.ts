import type { Page } from '@playwright/test';
import type {
  BoostEntry,
  BoostGoal,
} from '../../../src/features/goal-boost/model';
import { mockCategories } from '../data/categories';
export async function setupGoalBoostMock(page: Page) {
  const goals: BoostGoal[] = [],
    entries: BoostEntry[] = [];
  let failure = false;
  await page.route('**/rest/v1/GoalBoostGoals*', (route) =>
    route.fulfill({ json: goals }),
  );
  await page.route('**/rest/v1/GoalBoostEntries*', (route) =>
    route.fulfill({ json: [...entries].reverse() }),
  );
  await page.route('**/rest/v1/rpc/goal_boost_command', async (route) => {
    if (failure) {
      failure = false;
      await route.fulfill({
        status: 400,
        json: { message: 'Save failed. Please retry.' },
      });
      return;
    }
    const { p_action: a, p_data: d } = route.request().postDataJSON();
    if (a === 'goal') {
      goals.forEach((g) => (g.active = false));
      const c = mockCategories.find((c) => c.id === d.categoryId)!;
      goals.unshift({
        id: crypto.randomUUID(),
        category_id: c.id,
        name: c.name,
        kind: c.type as 'Debt' | 'Savings',
        active: true,
        settings: {},
      });
    } else if (a === 'settings') {
      goals.find((g) => g.id === d.goalId)!.settings = d.settings;
    } else if (a === 'remove') {
      const at = entries.findIndex((e) => e.id === d.id);
      if (at >= 0) entries.splice(at, 1);
    } else if (a === 'edit') {
      const e = entries.find((e) => e.id === d.id)!;
      Object.assign(e, {
        description: d.description,
        date: d.date,
        amount: d.amount,
        face_value: d.faceValue,
        paid: d.paid,
      });
    } else if (!entries.some((e) => e.id === d.id)) {
      entries.push({
        id: d.id,
        kind: d.kind,
        amount: d.amount,
        description: d.description || 'Linked transaction',
        date: d.date,
        face_value: d.faceValue ?? null,
        paid: d.paid ?? null,
        transaction_id:
          d.kind === 'saved' ? null : d.transactionId || crypto.randomUUID(),
        goal_id: d.goalId ?? null,
      });
    }
    await route.fulfill({ json: {} });
  });
  return {
    goals,
    entries,
    failNext: () => {
      failure = true;
    },
  };
}
