import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupCombobox } from "../GroupCombobox";

describe("GroupCombobox", () => {
  it("shows current value on the trigger button", () => {
    render(<GroupCombobox value="Housing" onChange={vi.fn()} existingGroups={[]} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Housing");
  });

  it("shows placeholder when value is empty", () => {
    render(<GroupCombobox value="" onChange={vi.fn()} existingGroups={[]} placeholder="Pick a group" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Pick a group");
  });

  it("opens dropdown and shows existing groups", async () => {
    const user = userEvent.setup();
    render(
      <GroupCombobox value="" onChange={vi.fn()} existingGroups={["Housing", "Food", "Transport"]} />
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
  });

  it("calls onChange when an existing group is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <GroupCombobox value="" onChange={onChange} existingGroups={["Housing", "Food"]} />
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Housing"));
    expect(onChange).toHaveBeenCalledWith("Housing");
  });

  it("calls onChange as user types a new group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GroupCombobox value="" onChange={onChange} existingGroups={[]} />);
    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search or type new group..."), "Gym");
    expect(onChange).toHaveBeenLastCalledWith("Gym");
  });

  it("shows empty message when no groups match", async () => {
    const user = userEvent.setup();
    render(<GroupCombobox value="" onChange={vi.fn()} existingGroups={["Housing"]} />);
    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search or type new group..."), "zzz");
    expect(screen.getByText("Press Enter or click away to use this value")).toBeInTheDocument();
  });
});
