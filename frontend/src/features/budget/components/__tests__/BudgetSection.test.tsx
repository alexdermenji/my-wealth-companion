import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetSection } from "../BudgetSection";
import type { BudgetCategory } from "@/shared/types";
import type { BudgetPlan } from "../../types";

vi.mock("@/shared/hooks/useCategories");
vi.mock("@/features/settings/components/CategoryFormDialog", () => ({
  CategoryFormDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="category-dialog" /> : null,
}));

const categories: BudgetCategory[] = [
  { id: "c1", name: "Salary", type: "Income", group: "Employment", order: 0 },
  { id: "c2", name: "Freelance", type: "Income", group: "Side Hustle", order: 1 },
  { id: "c3", name: "Rent", type: "Expenses", group: "Housing", order: 0 },
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
    // Month 1 total: 4000 + 1000 = £5,000
    expect(screen.getByText("£5,000")).toBeInTheDocument();
  });

  it("displays Liabilities label for Debt type", () => {
    const debtCategories: BudgetCategory[] = [
      { id: "d1", name: "Loan", type: "Debt", group: "Loans", order: 0 },
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
    expect(screen.getByText("Add category")).toBeInTheDocument();
  });

  it("opens add dialog when Add category is clicked", async () => {
    const user = userEvent.setup();
    renderInTable(<BudgetSection {...defaultProps} />);
    await user.click(screen.getByText("Add category"));
    expect(screen.getByTestId("category-dialog")).toBeInTheDocument();
  });

  it("shows three-dot menu button on each category row", () => {
    renderInTable(<BudgetSection {...defaultProps} />);
    // At minimum, the salary row should have a dropdown trigger rendered
    const row = screen.getByText("Salary").closest("tr")!;
    expect(row.querySelector("button")).toBeInTheDocument();
  });

  it("shows delete confirmation dialog when delete is clicked via dropdown", async () => {
    const user = userEvent.setup();
    renderInTable(<BudgetSection {...defaultProps} />);
    // Open the dropdown on the first category row
    const row = screen.getByText("Salary").closest("tr")!;
    const menuBtn = row.querySelector("button")!;
    await user.click(menuBtn);
    const deleteItem = await screen.findByText("Delete");
    await user.click(deleteItem);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("formats totals with thousand separators", () => {
    const plans: BudgetPlan[] = [
      { categoryId: "c1", year: 2026, months: { 1: 10000 } },
    ];
    renderInTable(<BudgetSection {...defaultProps} budgetPlans={plans} />);
    expect(screen.getAllByText("£10,000").length).toBeGreaterThan(0);
  });

  it("renders header and total even when no categories match the type", () => {
    renderInTable(
      <BudgetSection {...defaultProps} type="Savings" />
    );
    // Section still renders with header and total row (shows all dashes)
    expect(screen.getByText("Savings")).toBeInTheDocument();
    expect(screen.getByText("Total Savings")).toBeInTheDocument();
  });

  it("marks the supplied current month column", () => {
    renderInTable(<BudgetSection {...defaultProps} currentMonth={4} />);
    expect(screen.getAllByText("Apr")[0]).toHaveAttribute("data-current-month", "true");
  });
});
