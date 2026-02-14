import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryBlock } from "../CategoryBlock";
import type { BudgetCategory } from "@/shared/types";

const mockCategories: BudgetCategory[] = [
  { id: "c1", name: "Rent", type: "Expenses", group: "Housing", groupEmoji: "🏠" },
  { id: "c2", name: "Groceries", type: "Expenses", group: "Food", groupEmoji: "🍕" },
];

const defaultProps = {
  type: "Expenses" as const,
  categories: mockCategories,
  onAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("CategoryBlock", () => {
  it("renders category names", () => {
    render(<CategoryBlock {...defaultProps} />);
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("renders type title", () => {
    render(<CategoryBlock {...defaultProps} />);
    expect(screen.getByText("Expenses Categories")).toBeInTheDocument();
  });

  it("displays group info with emoji", () => {
    render(<CategoryBlock {...defaultProps} />);
    expect(screen.getByText("🏠 Housing")).toBeInTheDocument();
    expect(screen.getByText("🍕 Food")).toBeInTheDocument();
  });

  it("shows empty state when no categories", () => {
    render(<CategoryBlock {...defaultProps} categories={[]} />);
    expect(screen.getByText("No categories yet")).toBeInTheDocument();
  });

  it("calls onAdd when add button is clicked", async () => {
    const onAdd = vi.fn();
    render(<CategoryBlock {...defaultProps} onAdd={onAdd} />);
    // The add button is the one in the header with Plus icon
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[0]); // First button is the add button in header
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
