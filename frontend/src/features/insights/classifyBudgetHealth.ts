import type { Insight } from './types';

export interface BudgetHealthInput {
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
  debtPct: number; // subset of needsPct from debt transactions
}

export interface BudgetHealthResult {
  type: Insight['type'];
  statusLabel: string;
  subtext: string;
  actionLabel?: string;
}

export function classifyBudgetHealth({
  needsPct,
  wantsPct,
  savingsPct,
  debtPct,
}: BudgetHealthInput): BudgetHealthResult {
  const total = needsPct + wantsPct + savingsPct;
  // Guard against rounding artefacts where independently rounded debtPct > needsPct
  const expenseNeedsPct = Math.max(0, needsPct - debtPct);
  const debtDriven = debtPct > 0 && expenseNeedsPct <= 50;
  const debtPriorityMonth = debtPct >= 20 && expenseNeedsPct <= 55 && wantsPct <= 30;

  // 1. Spending + saving exceeds income (drawing down other accounts)
  if (total > 100) {
    const spendingOnly = needsPct + wantsPct;
    const overBy = total - 100;
    if (spendingOnly > 100) {
      return {
        type: 'warning',
        statusLabel: "You're spending more than you earn",
        subtext: `Your spending is ${spendingOnly - 100}% above your income\nThis gap builds debt or drains savings\nStart with Wants — easiest to reduce`,
        actionLabel: 'Review categories',
      };
    }
    return {
      type: 'warning',
      statusLabel: "You're over your income",
      subtext: `Spending + saving is ${overBy}% above your income\nYou're covering the gap from elsewhere\nFix it now before it compounds`,
      actionLabel: 'Review categories',
    };
  }

  // 2. Both Needs and Wants over target
  if (needsPct > 50 && wantsPct > 30) {
    return {
      type: 'warning',
      statusLabel: 'Spending is out of balance',
      subtext: `Needs: ${needsPct}% (target ≤50%)\nWants: ${wantsPct}% (target ≤30%)\nWants are the easiest lever — start there`,
      actionLabel: 'Reduce Wants',
    };
  }

  // 3. Needs high but driven by debt repayments. Debt is treated as productive
  // net-worth progress, so a heavy debt month should not be framed as failed saving.
  if (needsPct > 50 && (debtDriven || debtPriorityMonth)) {
    if (savingsPct >= 20) {
      return {
        type: 'positive',
        statusLabel: 'Strong debt progress',
        subtext: `Needs are high (${needsPct}%) due to debt\nYou're still saving ${savingsPct}% — excellent\nYou're improving net worth from both sides`,
        actionLabel: 'Keep it up',
      };
    }
    if (savingsPct > 0) {
      return {
        type: 'info',
        statusLabel: 'Debt-focused month',
        subtext: `Needs look high (${needsPct}%) due to debt\nYou're saving ${savingsPct}% — good start\nWhen debt clears → move those payments to savings`,
        actionLabel: 'Stay consistent',
      };
    }
    return {
      type: 'info',
      statusLabel: 'Debt-first month',
      subtext: `Debt repayment is taking priority over savings\nThat's productive — it improves your net worth\nWhen debt clears, redirect those payments to savings`,
      actionLabel: 'Plan ahead',
    };
  }

  // 4. Needs high from pure expenses (not debt)
  if (needsPct > 50) {
    if (savingsPct >= 20) {
      return {
        type: 'info',
        statusLabel: 'High costs, but saving well',
        subtext: `Needs: ${needsPct}% (above target)\nSavings: ${savingsPct}% — on track\nReduce fixed costs to create more buffer`,
        actionLabel: 'Review Needs',
      };
    }
    return {
      type: 'warning',
      statusLabel: 'Essential costs are too high',
      subtext: `Needs: ${needsPct}% of your income\nThis limits savings and flexibility\nEven -5% would improve your position`,
      actionLabel: 'Review Needs',
    };
  }

  // 5. Wants high but savings are strong
  if (wantsPct > 30 && savingsPct >= 20) {
    return {
      type: 'info',
      statusLabel: 'Wants are high',
      subtext: `Wants: ${wantsPct}% (above 30%)\nSavings are still strong (${savingsPct}%)\nWatch for gradual increases over time`,
      actionLabel: 'Monitor Wants',
    };
  }

  // 6. Wants high and savings are suffering
  if (wantsPct > 30) {
    return {
      type: 'warning',
      statusLabel: 'Wants are reducing savings',
      subtext: `${wantsPct}% of your income goes to Wants\nThis is limiting your savings\nCut Wants → redirect to savings`,
      actionLabel: 'Reduce Wants',
    };
  }

  // 7. On track but no savings recorded
  if (savingsPct === 0) {
    return {
      type: 'info',
      statusLabel: 'No savings yet',
      subtext: `Spending is under control\nYou have room to start saving\nStart small — even £50 matters`,
      actionLabel: 'Add savings',
    };
  }

  // 8. On track but savings below target
  if (savingsPct < 20) {
    return {
      type: 'info',
      statusLabel: 'Room to save more',
      subtext: `Savings: ${savingsPct}% (target ≥20%)\nYou don't need to cut spending\nJust redirect unused budget`,
      actionLabel: 'Boost savings',
    };
  }

  // 9. All targets met
  return {
    type: 'positive',
    statusLabel: "You're on track",
    subtext: `Needs: ${needsPct}%\nWants: ${wantsPct}%\nSavings: ${savingsPct}%\nBalanced and sustainable\nKeep this consistency`,
    actionLabel: 'Keep it up',
  };
}
