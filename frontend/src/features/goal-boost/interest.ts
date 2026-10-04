import { addMonths, format, isValid, parseISO } from 'date-fns';
import {
  cents,
  comparePayoff,
  payoff,
  type BoostEntry,
  type BoostGoal,
  type ForecastInput,
} from './model';

export interface DebtSettings extends ForecastInput {
  version: 2;
  debtType: 'loan' | 'card' | 'mortgage';
  balanceDate: string;
  nextPaymentDate: string;
}
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));

export function validateDebtSettings(settings: DebtSettings) {
  if (
    settings.version !== 2 ||
    !['loan', 'card', 'mortgage'].includes(settings.debtType)
  ) {
    throw new Error(
      'Set up your debt details to estimate interest savings.',
    );
  }
  if (
    !validDate(settings.balanceDate) ||
    !validDate(settings.nextPaymentDate) ||
    settings.nextPaymentDate <= settings.balanceDate ||
    settings.nextPaymentDate >
      format(addMonths(parseISO(settings.balanceDate), 1), 'yyyy-MM-dd')
  ) {
    throw new Error(
      'The next payment must be after the balance date and within one month.',
    );
  }
  if (settings.balanceDate > format(new Date(), 'yyyy-MM-dd')) {
    throw new Error('The balance date cannot be in the future.');
  }
  if (
    settings.balance <= 0 ||
    cents(settings.payment) <= 0 ||
    cents(settings.balance) / 100 !== settings.balance ||
    cents(settings.payment) / 100 !== settings.payment
  ) {
    throw new Error(
      'Enter a positive principal balance and monthly payment with at most two decimal places.',
    );
  }
  payoff(settings);
}

/**
 * Monthly fixed-rate model. Regular payments happen before boosts on the same
 * date. The balance is the principal BEFORE any included boosts. Each marginal
 * estimate starts after earlier boosts, so the totals do not double count.
 * Inputs and transactions are persisted; projections are derived, not cash.
 */
export function goalInterest(goal: BoostGoal, entries: BoostEntry[]) {
  const byEntry: Record<string, number> = {};
  if (goal.kind !== 'Debt') return { saved: 0, byEntry, error: undefined };
  try {
    const settings = goal.settings as DebtSettings;
    validateDebtSettings(settings);
    const contributions = entries
      .filter((e) => e.kind === 'contribution' && e.goal_id === goal.id)
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
      );
    let debt = cents(settings.balance),
      paymentIndex = 0,
      saved = 0;
    for (const entry of contributions) {
      if (!validDate(entry.date) || entry.date < settings.balanceDate) {
        throw new Error(
          'Use a balance dated on or before the earliest contribution to include your previous repayments.',
        );
      }
      while (
        format(
          addMonths(parseISO(settings.nextPaymentDate), paymentIndex),
          'yyyy-MM-dd',
        ) <= entry.date
      ) {
        if (paymentIndex >= 1200)
          throw new Error(
            'The contribution is outside the supported 100-year schedule.',
          );
        if (debt > 0)
          debt = Math.max(
            0,
            debt +
              Math.round((debt * settings.rate) / 1200) -
              cents(settings.payment),
          );
        paymentIndex++;
      }
      if (
        !Number.isFinite(entry.amount) ||
        entry.amount <= 0 ||
        cents(entry.amount) > debt
      ) {
        throw new Error(
          'Contributions exceed the estimated principal left. Check the starting balance, payment and contribution dates.',
        );
      }
      const result = comparePayoff(
        { ...settings, balance: debt / 100 },
        entry.amount,
      );
      byEntry[entry.id] = result.saved;
      saved += cents(result.saved);
      debt -= cents(entry.amount);
    }
    return { saved: saved / 100, byEntry, error: undefined };
  } catch (error) {
    return {
      saved: 0,
      byEntry: {} as Record<string, number>,
      error: (error as Error).message,
    };
  }
}

export function interestSummary(goals: BoostGoal[], entries: BoostEntry[]) {
  const byGoal = Object.fromEntries(
    goals.map((goal) => [goal.id, goalInterest(goal, entries)]),
  );
  const byEntry = Object.assign(
    {},
    ...Object.values(byGoal).map((result) => result.byEntry),
  ) as Record<string, number>;
  const missingGoals = goals.filter(
    (goal) =>
      goal.kind === 'Debt' &&
      byGoal[goal.id].error &&
      entries.some(
        (entry) =>
          entry.kind === 'contribution' && entry.goal_id === goal.id,
      ),
  );
  return {
    saved:
      Object.values(byGoal).reduce(
        (sum, result) => sum + cents(result.saved),
        0,
      ) / 100,
    byEntry,
    byGoal,
    missingGoals,
    configured: goals.some(
      (goal) => goal.kind === 'Debt' && !byGoal[goal.id].error,
    ),
  };
}
