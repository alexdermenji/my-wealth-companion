import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionTable } from "../TransactionTable";
import type { Transaction } from "../../types";

const mockTransactions: Transaction[] = [
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

const defaultProps = {
  transactions: mockTransactions,
  getAccountName: (id: string) => (id === "a1" ? "Cash" : "Bank"),
  getCategoryName: (id: string) => (id === "c1" ? "Employment" : "Food"),
  formatCurrency: (val: number) => `$${Math.abs(val).toFixed(2)}`,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("TransactionTable", () => {
  it("renders transaction rows", () => {
    render(<TransactionTable {...defaultProps} />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    render(<TransactionTable {...defaultProps} />);
    expect(screen.getByText("15-Jan-26")).toBeInTheDocument();
    expect(screen.getByText("20-Jan-26")).toBeInTheDocument();
  });

  it("formats currency with parentheses for negative amounts", () => {
    render(<TransactionTable {...defaultProps} />);
    expect(screen.getByText("$3500.00")).toBeInTheDocument();
    expect(screen.getByText("($85.50)")).toBeInTheDocument();
  });

  it("displays empty state when no transactions", () => {
    render(<TransactionTable {...defaultProps} transactions={[]} />);
    expect(screen.getByText(/No transactions yet/)).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<TransactionTable {...defaultProps} onEdit={onEdit} />);
    const editButtons = screen.getAllByRole("button");
    // First edit button (Pencil icon buttons are odd-indexed, first one is index 0)
    await userEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<TransactionTable {...defaultProps} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole("button");
    // Second button for first row is the delete button
    await userEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith("t1");
  });
});
