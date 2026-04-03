import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetCell } from "../BudgetCell";

describe("BudgetCell", () => {
  it("displays formatted value as text when not editing", () => {
    render(<BudgetCell value={500} onChange={vi.fn()} />);
    expect(screen.getByText("500.00")).toBeInTheDocument();
  });

  it("displays '-' when value is 0", () => {
    render(<BudgetCell value={0} onChange={vi.fn()} />);
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("switches to input on click and calls onChange on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BudgetCell value={100} onChange={onChange} />);

    // Click the span to start editing
    await user.click(screen.getByText("100.00"));
    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "200");
    await user.tab();
    expect(onChange).toHaveBeenCalledWith("200");
  });

  it("does not call onChange on blur when value unchanged", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BudgetCell value={100} onChange={onChange} />);

    await user.click(screen.getByText("100.00"));
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("syncs display when prop value changes", () => {
    const { rerender } = render(<BudgetCell value={100} onChange={vi.fn()} />);
    expect(screen.getByText("100.00")).toBeInTheDocument();
    rerender(<BudgetCell value={200} onChange={vi.fn()} />);
    expect(screen.getByText("200.00")).toBeInTheDocument();
  });

  it("reverts to span after blur", async () => {
    const user = userEvent.setup();
    render(<BudgetCell value={100} onChange={vi.fn()} />);

    await user.click(screen.getByText("100.00"));
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.getByText("100.00")).toBeInTheDocument();
  });
});
