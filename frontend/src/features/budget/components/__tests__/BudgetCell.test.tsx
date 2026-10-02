import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetCell } from "../BudgetCell";

describe("BudgetCell", () => {
  it("shows updated saved data after focus is restored without submitting a stale draft", () => {
    const onChange = vi.fn();
    const { rerender } = render(<BudgetCell value={800} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "2500" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("2500");
    onChange.mockClear();
    fireEvent.focus(input);
    rerender(<BudgetCell value={2500} onChange={onChange} />);
    expect(input).toHaveValue("2,500.00");
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("preserves unfinished input when saved data refreshes", () => {
    const onChange = vi.fn();
    const { rerender } = render(<BudgetCell value={100} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "350" } });
    rerender(<BudgetCell value={200} onChange={onChange} />);
    expect(input).toHaveValue("350");
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("350");
  });

  it("displays formatted value when not focused", () => {
    render(<BudgetCell value={500} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("500.00")).toBeInTheDocument();
  });

  it("formats large numbers with thousand separators", () => {
    render(<BudgetCell value={1234567.89} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("1,234,567.89")).toBeInTheDocument();
  });

  it("is always an input element (no span overlay)", () => {
    render(<BudgetCell value={100} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows empty string when value is 0", () => {
    render(<BudgetCell value={0} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("—")).toBeInTheDocument();
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
  });

  it("calls onChange on blur when value changed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BudgetCell value={100} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.clear(input);
    await user.type(input, "200");
    await user.tab();
    expect(onChange).toHaveBeenCalledWith("200");
  });

  it("does not call onChange on blur when value unchanged", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BudgetCell value={100} onChange={onChange} />);

    await user.click(screen.getByRole("textbox"));
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("syncs display when prop value changes", () => {
    const { rerender } = render(<BudgetCell value={100} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("100.00")).toBeInTheDocument();
    rerender(<BudgetCell value={200} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("200.00")).toBeInTheDocument();
  });

  it("shows formatted value after blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BudgetCell value={100} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.tab();
    expect(screen.getByDisplayValue("100.00")).toBeInTheDocument();
  });
});
