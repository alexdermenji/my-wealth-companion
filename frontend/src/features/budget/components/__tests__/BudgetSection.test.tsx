import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetSection } from "../BudgetSection";
import type { BudgetCategory } from "@/shared/types";
import type { BudgetPlan } from "../../types";

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
  currency: "$",
  year: 2026,
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

  it("shows yearly total for a category", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    // Salary: 4000*3 = 12000
    expect(screen.getByText("$12,000")).toBeInTheDocument();
    // Freelance: 1000
    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("shows monthly totals in the Total row", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    // Month 1 total: 4000 + 1000 = 5000
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });

  it("shows grand total for the year", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    // Grand total: 4000*3 + 1000 = 13000
    expect(screen.getByText("$13,000")).toBeInTheDocument();
  });

  it("returns null when no categories match the type", () => {
    const { container } = renderInTable(
      <BudgetSection {...defaultProps} type="Debt" />
    );
    // Only the wrapping tbody should exist, no actual content rows
    expect(container.querySelector("tbody")?.children).toHaveLength(0);
  });
});
