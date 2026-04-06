import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "../TransactionForm";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  editing: false,
  accounts: [
    { id: "a1", name: "Cash", type: "Cash" as const, openingBalance: 0 },
    { id: "a2", name: "Bank", type: "Bank" as const, openingBalance: 0 },
  ],
  categories: [
    { id: "c1", name: "Rent", type: "Expenses" as const, group: "Housing", order: 0 },
  ],
  onSubmit: vi.fn(),
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

  it("pre-fills fields when defaultValues provided", () => {
    render(
      <TransactionForm
        {...defaultProps}
        defaultValues={{ date: "2026-01-15", amount: 100, details: "Test" }}
      />
    );
    expect(screen.getByDisplayValue("2026-01-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    render(<TransactionForm {...defaultProps} />);
    const buttons = screen.getAllByText("Add Transaction");
    await userEvent.click(buttons[buttons.length - 1]);
    expect(screen.getByText("Amount is required")).toBeInTheDocument();
    expect(screen.getByText("Details are required")).toBeInTheDocument();
    expect(screen.getByText("Account is required")).toBeInTheDocument();
  });

  it("shows Update Transaction button when editing", () => {
    render(<TransactionForm {...defaultProps} editing={true} />);
    expect(screen.getByText("Update Transaction")).toBeInTheDocument();
  });
});
