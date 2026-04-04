import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetSection } from "../BudgetSection";
import { BudgetNavProvider } from "../BudgetNavContext";
import type { BudgetCategory } from "@/shared/types";
import type { BudgetPlan } from "../../types";

vi.mock("@/shared/hooks/useCategories");
vi.mock("@/features/settings/components/CategoryFormDialog", () => ({
  CategoryFormDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="category-dialog" /> : null,
}));

const categories: BudgetCategory[] = [
  { id: "c1", name: "Salary", type: "Income", group: "Employment" },
  { id: "c2", name: "Freelance", type: "Income", group: "Side Hustle" },
  { id: "c3", name: "Rent", type: "Expenses", group: "Housing" },
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
  currency: '$',
};

// Wrap in table context since BudgetSection renders TableRows
function renderInTable(ui: React.ReactElement) {
  return render(
    <BudgetNavProvider>
      <table>
        <tbody>{ui}</tbody>
      </table>
    </BudgetNavProvider>
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
    // Month 1 total: 4000 + 1000 = 5,000
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });

  it("displays Liabilities label for Debt type", () => {
    const debtCategories: BudgetCategory[] = [
      { id: "d1", name: "Loan", type: "Debt", group: "Loans" },
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
    expect(screen.getByText("+ Add category")).toBeInTheDocument();
  });

  it("opens add dialog when Add category is clicked", async () => {
    const user = userEvent.setup();
    renderInTable(<BudgetSection {...defaultProps} />);
    await user.click(screen.getByText("+ Add category"));
    expect(screen.getByTestId("category-dialog")).toBeInTheDocument();
  });

  it("shows edit and delete buttons on hover", async () => {
    const user = userEvent.setup();
    renderInTable(<BudgetSection {...defaultProps} />);
    const row = screen.getByText("Salary").closest("tr")!;
    await user.hover(row);
    expect(row.querySelector("[title='Edit entry']")).toBeInTheDocument();
    expect(row.querySelector("[title='Delete entry']")).toBeInTheDocument();
  });

  it("shows delete confirmation dialog when delete is clicked", async () => {
    const user = userEvent.setup();
    renderInTable(<BudgetSection {...defaultProps} />);
    const deleteBtn = screen.getAllByTitle("Delete entry")[0];
    await user.click(deleteBtn);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("formats totals with thousand separators", () => {
    const plans: BudgetPlan[] = [
      { categoryId: "c1", year: 2026, months: { 1: 10000 } },
    ];
    renderInTable(<BudgetSection {...defaultProps} budgetPlans={plans} />);
    expect(screen.getAllByText("$10,000").length).toBeGreaterThan(0);
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
