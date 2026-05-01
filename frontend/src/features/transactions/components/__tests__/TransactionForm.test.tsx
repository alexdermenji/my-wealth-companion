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

  it("pre-fills date and amount when defaultValues provided", () => {
    render(
      <TransactionForm
        {...defaultProps}
        defaultValues={{ date: "2026-01-15", amount: 100 }}
      />
    );
    expect(screen.getByDisplayValue("2026-01-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
  });

  it("shows validation error when amount is missing", async () => {
    render(<TransactionForm {...defaultProps} />);
    const buttons = screen.getAllByText("Add Transaction");
    await userEvent.click(buttons[buttons.length - 1]);
    expect(screen.getByText("Amount is required")).toBeInTheDocument();
  });

  it("shows Update Transaction button when editing", () => {
    render(<TransactionForm {...defaultProps} editing={true} />);
    expect(screen.getByText("Update Transaction")).toBeInTheDocument();
  });

  it("pre-selects Expenses as the default budget type", () => {
    render(<TransactionForm {...defaultProps} />);
    // getAllByRole('combobox')[0] is the Budget Type trigger (first Select in the form)
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent("Expenses");
  });

  it("does not show a validation error when details is empty", async () => {
    render(<TransactionForm {...defaultProps} />);
    const buttons = screen.getAllByText("Add Transaction");
    await userEvent.click(buttons[buttons.length - 1]);
    expect(screen.queryByText("Details are required")).not.toBeInTheDocument();
  });

});
