import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BudgetSection } from "@/features/budget/components/BudgetSection";
import type { BudgetCategory } from "@/shared/types";
import type { BudgetPlan } from "@/features/budget/types";

const queryClient = new QueryClient();

const meta: Meta<typeof BudgetSection> = {
  title: "Finance/Budget Section",
  component: BudgetSection,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The annual budget table section. Each `BudgetSection` renders a colour-coded header row, one row per category, and a totals footer. Renders inside a `<table>` — the story wraps it accordingly.",
      },
    },
  },
  // BudgetSection renders <tr> elements so it must live inside <tbody>
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <div className="bg-[#f0f2f8] p-6">
          <div className="overflow-x-auto rounded-xl border border-[#dde3f0] bg-white shadow-md">
            <table className="min-w-[960px] w-full border-collapse text-sm">
              <tbody>
                <Story />
              </tbody>
            </table>
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof BudgetSection>;

// ─── Shared demo data ─────────────────────────────────────────────────────────

const INCOME_CATEGORIES: BudgetCategory[] = [
  { id: "sal", name: "Salary",    type: "Income", group: "Employment"  },
  { id: "bon", name: "Bonus",     type: "Income", group: "Employment"  },
  { id: "fre", name: "Freelance", type: "Income", group: "Side Income" },
  { id: "div", name: "Dividends", type: "Income", group: "Investments" },
];

const EXPENSES_CATEGORIES: BudgetCategory[] = [
  { id: "ren", name: "Rent",          type: "Expenses", group: "Housing"   },
  { id: "uti", name: "Utilities",     type: "Expenses", group: "Housing"   },
  { id: "gro", name: "Groceries",     type: "Expenses", group: "Food"      },
  { id: "eat", name: "Eating Out",    type: "Expenses", group: "Food"      },
  { id: "tra", name: "Travel",        type: "Expenses", group: "Transport" },
  { id: "sub", name: "Subscriptions", type: "Expenses", group: "Lifestyle" },
];

const SAVINGS_CATEGORIES: BudgetCategory[] = [
  { id: "emf", name: "Emergency Fund", type: "Savings", group: "Emergency"  },
  { id: "hol", name: "Holiday",        type: "Savings", group: "Goals"      },
  { id: "isa", name: "ISA / Stocks",   type: "Savings", group: "Investment" },
];

const DEBT_CATEGORIES: BudgetCategory[] = [
  { id: "cc",  name: "Credit Card",  type: "Debt", group: "Credit" },
  { id: "stu", name: "Student Loan", type: "Debt", group: "Loans"  },
];

function makePlans(cats: BudgetCategory[], valuesFn: (id: string, mo: number) => number): BudgetPlan[] {
  return cats.map(cat => ({
    categoryId: cat.id,
    year: 2026,
    months: Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [i + 1, valuesFn(cat.id, i + 1)])
    ) as Record<number, number>,
  }));
}

const INCOME_PLANS = makePlans(INCOME_CATEGORIES, (id, mo) => ({
  sal: 4200,
  bon: [6].includes(mo) ? 1500 : [12].includes(mo) ? 2000 : 0,
  fre: [6, 7].includes(mo) ? 0 : 600 + (mo % 3) * 100,
  div: [3, 9].includes(mo) ? 120 : [6, 12].includes(mo) ? 280 : 0,
}[id] ?? 0));

const EXPENSES_PLANS = makePlans(EXPENSES_CATEGORIES, (id, mo) => ({
  ren: 1500,
  uti: 180 - mo * 5,
  gro: 370 + (mo % 4) * 15,
  eat: 200 + (mo % 5) * 20,
  tra: 120,
  sub: 65,
}[id] ?? 0));

const SAVINGS_PLANS = makePlans(SAVINGS_CATEGORIES, (id, mo) => ({
  emf: 300,
  hol: [7, 8, 9].includes(mo) ? 0 : 200,
  isa: 400,
}[id] ?? 0));

const DEBT_PLANS = makePlans(DEBT_CATEGORIES, (id) => ({
  cc:  200,
  stu: 150,
}[id] ?? 0));

const noop = () => {};

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Income: Story = {
  args: {
    type: "Income",
    categories: INCOME_CATEGORIES,
    budgetPlans: INCOME_PLANS,
    onAmountChange: noop,
    currency: "£",
  },
};

export const Expenses: Story = {
  args: {
    type: "Expenses",
    categories: EXPENSES_CATEGORIES,
    budgetPlans: EXPENSES_PLANS,
    onAmountChange: noop,
    currency: "£",
  },
};

export const Savings: Story = {
  args: {
    type: "Savings",
    categories: SAVINGS_CATEGORIES,
    budgetPlans: SAVINGS_PLANS,
    onAmountChange: noop,
    currency: "£",
  },
};

export const Liabilities: Story = {
  args: {
    type: "Debt",
    categories: DEBT_CATEGORIES,
    budgetPlans: DEBT_PLANS,
    onAmountChange: noop,
    currency: "£",
  },
};

export const AllSections: Story = {
  name: "All Sections",
  parameters: {
    docs: {
      description: {
        story: "All four section types stacked — approximates the full Budget Plan page layout.",
      },
    },
  },
  render: () => (
    <div className="bg-[#f0f2f8] p-6 flex flex-col gap-3">
      {(
        [
          { type: "Income"   as const, cats: INCOME_CATEGORIES,   plans: INCOME_PLANS   },
          { type: "Expenses" as const, cats: EXPENSES_CATEGORIES, plans: EXPENSES_PLANS },
          { type: "Savings"  as const, cats: SAVINGS_CATEGORIES,  plans: SAVINGS_PLANS  },
          { type: "Debt"     as const, cats: DEBT_CATEGORIES,     plans: DEBT_PLANS     },
        ]
      ).map(({ type, cats, plans }) => (
        <div key={type} className="overflow-x-auto rounded-xl border border-[#dde3f0] bg-white shadow-md">
          <table className="min-w-[960px] w-full border-collapse text-sm">
            <tbody>
              <BudgetSection
                type={type}
                categories={cats}
                budgetPlans={plans}
                onAmountChange={noop}
                currency="£"
              />
            </tbody>
          </table>
        </div>
      ))}
    </div>
  ),
  // Override the default decorator — AllSections provides its own wrapper
  decorators: [Story => <QueryClientProvider client={queryClient}><Story /></QueryClientProvider>],
};
