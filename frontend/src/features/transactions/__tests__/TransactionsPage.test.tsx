import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionsPage from "../TransactionsPage";
import { renderWithProviders } from "@/test/test-utils";
import { useTransactions, useCreateTransaction } from "../hooks";
import { useAccounts } from "@/shared/hooks/useAccounts";
import { useCategories } from "@/shared/hooks/useCategories";
import { useSettings } from "@/features/settings/hooks";
import type { FormValues } from "../components/TransactionForm";

vi.mock("../hooks");
vi.mock("@/shared/hooks/useAccounts");
vi.mock("@/shared/hooks/useCategories");
vi.mock("@/features/settings/hooks");

vi.mock("../components/TransactionForm", () => ({
  TransactionForm: ({ open, onOpenChange, onSubmit }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: FormValues) => void;
  }) => (
    <>
      <button onClick={() => onOpenChange(true)}>Add Transaction</button>
      {open && (
        <button
          data-testid="mock-submit"
          onClick={() =>
            onSubmit({
              date: "2026-01-15",
              amount: 50,
              details: "Groceries",
              accountId: "a1",
              budgetType: "Expenses",
              budgetPositionId: "c2",
            })
          }
        >
          Submit Form
        </button>
      )}
    </>
  ),
}));

const mockTransactions = [
  {
    id: "t1",
    date: "2026-01-15",
    amount: 3500,
    details: "Salary",
    accountId: "a1",
    budgetType: "Income",
    budgetPositionId: "c1",
  },
  {
    id: "t2",
    date: "2026-01-20",
    amount: -85.5,
    details: "Groceries",
    accountId: "a2",
    budgetType: "Expenses",
    budgetPositionId: "c2",
  },
];

const mockAccounts = [
  { id: "a1", name: "Cash Wallet", type: "Cash" },
  { id: "a2", name: "Chase Bank", type: "Bank" },
];

const mockCategories = [
  { id: "c1", name: "Employment (Net)", type: "Income", group: "Employment" },
  { id: "c2", name: "Food & Dining", type: "Expenses", group: "Food" },
];

describe("TransactionsPage", () => {
  beforeEach(() => {
    vi.mocked(useTransactions).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    } as ReturnType<typeof useTransactions>);
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as ReturnType<typeof useCategories>);
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "$" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
  });

  it("renders the page title", () => {
    renderWithProviders(<TransactionsPage />);
    expect(screen.getByText("Transactions")).toBeInTheDocument();
  });

  it("shows transaction count", () => {
    renderWithProviders(<TransactionsPage />);
    expect(screen.getByText("2 transactions recorded")).toBeInTheDocument();
  });

  it("renders transaction details", () => {
    renderWithProviders(<TransactionsPage />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("resolves account names", () => {
    renderWithProviders(<TransactionsPage />);
    expect(screen.getByText("Cash Wallet")).toBeInTheDocument();
    expect(screen.getByText("Chase Bank")).toBeInTheDocument();
  });

  it("resolves category names", () => {
    renderWithProviders(<TransactionsPage />);
    expect(screen.getByText("Employment (Net)")).toBeInTheDocument();
    expect(screen.getByText("Food & Dining")).toBeInTheDocument();
  });

  it("formats currency values", () => {
    renderWithProviders(<TransactionsPage />);
    expect(screen.getByText("$3,500.00")).toBeInTheDocument();
    expect(screen.getByText("($85.50)")).toBeInTheDocument();
  });

  it("applies negative sign for Expenses and calls createTransaction.mutate", async () => {
    const mutateFn = vi.fn();
    vi.mocked(useCreateTransaction).mockReturnValue({
      mutate: mutateFn,
    } as unknown as ReturnType<typeof useCreateTransaction>);

    renderWithProviders(<TransactionsPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /add transaction/i }));
    await user.click(screen.getByTestId("mock-submit"));

    expect(mutateFn).toHaveBeenCalledTimes(1);
    expect(mutateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -50,
        accountId: "a1",
        budgetType: "Expenses",
      })
    );
  });
});
