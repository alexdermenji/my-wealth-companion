import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetCell } from "../BudgetCell";

describe("BudgetCell", () => {
  it("displays the value", () => {
    render(<BudgetCell value={500} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("500")).toBeInTheDocument();
  });

  it("displays empty string when value is 0", () => {
    render(<BudgetCell value={0} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("calls onChange on blur when value changed", async () => {
    const onChange = vi.fn();
    render(<BudgetCell value={100} onChange={onChange} />);
    const input = screen.getByDisplayValue("100");
    await userEvent.clear(input);
    await userEvent.type(input, "200");
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledWith("200");
  });

  it("does not call onChange on blur when value unchanged", async () => {
    const onChange = vi.fn();
    render(<BudgetCell value={100} onChange={onChange} />);
    const input = screen.getByDisplayValue("100");
    await userEvent.click(input);
    await userEvent.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("syncs local state when prop value changes", async () => {
    const { rerender } = render(<BudgetCell value={100} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    rerender(<BudgetCell value={200} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("200")).toBeInTheDocument();
  });
});
