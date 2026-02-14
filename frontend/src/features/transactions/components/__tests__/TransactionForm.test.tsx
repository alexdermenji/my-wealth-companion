import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "../TransactionForm";

const defaultForm = {
  date: "2026-01-15",
  amount: "100",
  details: "Test",
  accountId: "a1",
  budgetType: "" as const,
  budgetPositionId: "",
};

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  editing: false,
  form: defaultForm,
  onFormChange: vi.fn(),
  onSubmit: vi.fn(),
  onReset: vi.fn(),
  accounts: [
    { id: "a1", name: "Cash", type: "Cash" as const },
    { id: "a2", name: "Bank", type: "Bank" as const },
  ],
  filteredCategories: [
    { id: "c1", name: "Rent", type: "Expenses" as const, group: "Housing", groupEmoji: "🏠" },
  ],
};

describe("TransactionForm", () => {
  it("renders dialog title for new transaction", () => {
    render(<TransactionForm {...defaultProps} />);
    expect(screen.getByText("New Transaction")).toBeInTheDocument();
  });

  it("renders dialog title for editing", () => {
    render(<TransactionForm {...defaultProps} editing={true} />);
    expect(screen.getByText("Edit Transaction")).toBeInTheDocument();
  });

  it("renders form fields", () => {
    render(<TransactionForm {...defaultProps} />);
    expect(screen.getByDisplayValue("2026-01-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
  });

  it("calls onSubmit when submit button clicked", async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm {...defaultProps} onSubmit={onSubmit} />);
    const buttons = screen.getAllByText("Add Transaction");
    // Submit button is the last one (inside dialog), trigger button is first
    await userEvent.click(buttons[buttons.length - 1]);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("shows Update Transaction button when editing", () => {
    render(<TransactionForm {...defaultProps} editing={true} />);
    expect(screen.getByText("Update Transaction")).toBeInTheDocument();
  });
});
