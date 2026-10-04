export interface BoostGoal {
  id: string;
  category_id: string;
  name: string;
  kind: 'Debt' | 'Savings';
  active: boolean;
  settings: Partial<ForecastInput> & {
    debtType?: 'loan' | 'card' | 'mortgage';
    version?: 2;
    balanceDate?: string;
    nextPaymentDate?: string;
  };
}
export interface BoostEntry {
  id: string;
  kind: 'saved' | 'received' | 'contribution';
  amount: number;
  description: string;
  date: string;
  face_value: number | null;
  paid: number | null;
  transaction_id: string | null;
  goal_id: string | null;
}
export const cents = (value: number) => Math.round(value * 100);
export function summarize(entries: BoostEntry[]) {
  const sum = (kind: BoostEntry['kind']) =>
    entries
      .filter((e) => e.kind === kind)
      .reduce((n, e) => n + cents(e.amount), 0) / 100;
  const saved = sum('saved'),
    received = sum('received'),
    contributed = sum('contribution');
  return {
    saved,
    received,
    contributed,
    available: (cents(saved) + cents(received) - cents(contributed)) / 100,
  };
}
export interface ForecastInput {
  balance: number;
  rate: number;
  payment: number;
}
export function payoff(input: ForecastInput, extra = 0) {
  const { balance, rate, payment } = input;
  if (
    ![balance, rate, payment, extra].every(Number.isFinite) ||
    balance < 0 ||
    rate < 0 ||
    rate > 100 ||
    payment <= 0 ||
    extra < 0 ||
    extra > balance ||
    balance > 1e10
  )
    throw new Error(
      'Enter a valid balance, rate (0–100%) and positive monthly payment.',
    );
  let debt = cents(balance) - cents(extra),
    interest = 0,
    months = 0;
  const instalment = cents(payment);
  while (debt > 0) {
    if (months >= 1200)
      throw new Error('Repayment exceeds the supported 100-year forecast.');
    const charge = Math.round((debt * rate) / 1200);
    if (instalment <= charge)
      throw new Error(
        'This payment does not cover the interest. Increase the monthly payment.',
      );
    interest += charge;
    debt = Math.max(0, debt + charge - instalment);
    months++;
  }
  return { months, interest: interest / 100 };
}
export function comparePayoff(input: ForecastInput, extra: number) {
  const before = payoff(input),
    after = payoff(input, extra);
  return {
    before,
    after,
    saved: (cents(before.interest) - cents(after.interest)) / 100,
    monthsSaved: before.months - after.months,
  };
}
