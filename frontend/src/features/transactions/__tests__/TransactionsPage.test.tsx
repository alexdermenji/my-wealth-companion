import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionsPage from "../TransactionsPage";
import { renderWithProviders } from "@/test/test-utils";
import { useTransactions, useCreateTransaction } from "../hooks";
import { useAccounts } from "@/shared/hooks/useAccounts";
import { useCategories } from "@/shared/hooks/useCategories";
import { useSettings } from "@/features/settings/hooks";

vi.mock("../hooks");
vi.mock("@/shared/hooks/useAccounts");
vi.mock("@/shared/hooks/useCategories");
vi.mock("@/features/settings/hooks");

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
  { id: "c1", name: "Employment (Net)", type: "Income", group: "Employment", groupEmoji: "💼" },
  { id: "c2", name: "Food & Dining", type: "Expenses", group: "Food", groupEmoji: "🍕" },
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

  it("calls createTransaction.mutate when submitting with default account", async () => {
    const mutateFn = vi.fn();
    vi.mocked(useCreateTransaction).mockReturnValue({
      mutate: mutateFn,
    } as unknown as ReturnType<typeof useCreateTransaction>);

    renderWithProviders(<TransactionsPage />);
    const user = userEvent.setup();

    // Open dialog
    await user.click(screen.getByRole("button", { name: /add transaction/i }));

    // Fill amount (the only required field besides accountId and date which have defaults)
    const amountInput = screen.getByPlaceholderText("-100.00");
    await user.clear(amountInput);
    await user.type(amountInput, "-50");

    // Submit without explicitly selecting an account — should use the default
    await user.click(screen.getByRole("button", { name: /add transaction$/i }));

    expect(mutateFn).toHaveBeenCalledTimes(1);
    expect(mutateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "a1",
        amount: -50,
      })
    );
  });
});
