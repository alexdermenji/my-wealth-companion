import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetSection } from "../BudgetSection";
import type { BudgetCategory } from "@/shared/types";
import type { BudgetPlan } from "../../types";

vi.mock("@/shared/hooks/useCategories");

const categories: BudgetCategory[] = [
  { id: "c1", name: "Salary", type: "Income", group: "Employment", groupEmoji: "💼" },
  { id: "c2", name: "Freelance", type: "Income", group: "Side Hustle", groupEmoji: "💻" },
  { id: "c3", name: "Rent", type: "Expenses", group: "Housing", groupEmoji: "🏠" },
];

const budgetPlans: BudgetPlan[] = [
  { categoryId: "c1", year: 2026, months: { 1: 4000, 2: 4000, 3: 4000 } },
  { categoryId: "c2", year: 2026, months: { 1: 1000 } },
];

const defaultProps = {
  type: "Income" as const,
  categories,
  budgetPlans,
  onAmountChange: vi.fn(),
};

// Wrap in table context since BudgetSection renders TableRows
function renderInTable(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>
  );
}

describe("BudgetSection", () => {
  it("renders category rows for matching type", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Freelance")).toBeInTheDocument();
  });

  it("does not render categories of other types", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
  });

  it("displays section header with type name", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    expect(screen.getByText("Income")).toBeInTheDocument();
  });

  it("shows monthly totals in the Total row", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    // Month 1 total: 4000 + 1000 = 5000.00
    expect(screen.getByText("5000.00")).toBeInTheDocument();
  });

  it("displays Liabilities label for Debt type", () => {
    const debtCategories: BudgetCategory[] = [
      { id: "d1", name: "Loan", type: "Debt", group: "Loans", groupEmoji: "" },
    ];
    renderInTable(
      <BudgetSection
        {...defaultProps}
        type="Debt"
        categories={debtCategories}
        budgetPlans={[]}
      />
    );
    expect(screen.getByText("Liabilities")).toBeInTheDocument();
  });

  it("shows group name in Category column", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    expect(screen.getByText("Employment")).toBeInTheDocument();
    expect(screen.getByText("Side Hustle")).toBeInTheDocument();
  });

  it("shows add entry button", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    expect(screen.getByText("+ Add entry")).toBeInTheDocument();
  });

  it("renders header and total even when no categories match the type", () => {
    renderInTable(
      <BudgetSection {...defaultProps} type="Savings" />
    );
    // Section still renders with header and total row (shows all dashes)
    expect(screen.getByText("Savings")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });
});
