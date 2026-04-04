import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetCell } from "../BudgetCell";
import { BudgetNavProvider } from "../BudgetNavContext";

function renderCell(props: Parameters<typeof BudgetCell>[0]) {
  return render(
    <BudgetNavProvider>
      <BudgetCell {...props} />
    </BudgetNavProvider>
  );
}

describe("BudgetCell", () => {
  it("displays formatted value as text when not editing", () => {
    renderCell({ value: 500, onChange: vi.fn() });
    expect(screen.getByText("500.00")).toBeInTheDocument();
  });

  it("formats large numbers with thousand separators", () => {
    renderCell({ value: 1234567.89, onChange: vi.fn() });
    expect(screen.getByText("1,234,567.89")).toBeInTheDocument();
  });

  it("does not shift layout when switching to input — span stays in DOM", async () => {
    const user = userEvent.setup();
    renderCell({ value: 100, onChange: vi.fn() });
    const span = screen.getByText("100.00");
    await user.click(span);
    // Span still in DOM (invisible), input overlays it
    expect(span).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("displays '-' when value is 0", () => {
    renderCell({ value: 0, onChange: vi.fn() });
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("switches to input on click and calls onChange on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderCell({ value: 100, onChange });

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
    renderCell({ value: 100, onChange });

    await user.click(screen.getByText("100.00"));
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("syncs display when prop value changes", () => {
    const { rerender } = renderCell({ value: 100, onChange: vi.fn() });
    expect(screen.getByText("100.00")).toBeInTheDocument();
    rerender(
      <BudgetNavProvider>
        <BudgetCell value={200} onChange={vi.fn()} />
      </BudgetNavProvider>
    );
    expect(screen.getByText("200.00")).toBeInTheDocument();
  });

  it("reverts to span after blur", async () => {
    const user = userEvent.setup();
    renderCell({ value: 100, onChange: vi.fn() });

    await user.click(screen.getByText("100.00"));
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.getByText("100.00")).toBeInTheDocument();
  });

  describe("keyboard navigation", () => {
    it("Tab navigates right", async () => {
      const user = userEvent.setup();
      const navigate = vi.fn();
      // Render two cells so Tab can activate the next one
      render(
        <BudgetNavProvider>
          <BudgetCell value={100} onChange={vi.fn()} rowKey="Income-cat1" colIndex={1} />
          <BudgetCell value={200} onChange={vi.fn()} rowKey="Income-cat1" colIndex={2} />
        </BudgetNavProvider>
      );
      await user.click(screen.getByText("100.00"));
      await user.keyboard("{Tab}");
      // After Tab, second cell should be in edit mode
      expect(screen.getByDisplayValue("200")).toBeInTheDocument();
    });

    it("Shift+Tab navigates left", async () => {
      const user = userEvent.setup();
      render(
        <BudgetNavProvider>
          <BudgetCell value={100} onChange={vi.fn()} rowKey="Income-cat1" colIndex={1} />
          <BudgetCell value={200} onChange={vi.fn()} rowKey="Income-cat1" colIndex={2} />
        </BudgetNavProvider>
      );
      await user.click(screen.getByText("200.00"));
      await user.keyboard("{Shift>}{Tab}{/Shift}");
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    });

    it("Escape cancels editing without calling onChange", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderCell({ value: 100, onChange });

      await user.click(screen.getByText("100.00"));
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "999");
      await user.keyboard("{Escape}");

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    });
  });
});
