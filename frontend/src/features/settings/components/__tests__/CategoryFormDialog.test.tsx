import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFormDialog } from "../CategoryFormDialog";
import { renderWithProviders } from "@/test/test-utils";
import { useCreateCategory, useUpdateCategory } from "@/shared/hooks/useCategories";

vi.mock("@/shared/hooks/useCategories");

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

beforeEach(() => {
  mockCreate.mockReset();
  mockUpdate.mockReset();
  vi.mocked(useCreateCategory).mockReturnValue({ mutate: mockCreate, isPending: false } as ReturnType<typeof useCreateCategory>);
  vi.mocked(useUpdateCategory).mockReturnValue({ mutate: mockUpdate, isPending: false } as ReturnType<typeof useUpdateCategory>);
});

describe("CategoryFormDialog", () => {
  it("renders add dialog with correct title", () => {
    renderWithProviders(
      <CategoryFormDialog open onOpenChange={vi.fn()} defaultType="Expenses" existingGroups={[]} />
    );
    expect(screen.getByText("New Expenses Category")).toBeInTheDocument();
  });

  it("renders edit dialog with pre-filled fields", () => {
    const cat = { id: "c1", name: "Rent", type: "Expenses" as const, group: "Housing" };
    renderWithProviders(
      <CategoryFormDialog open onOpenChange={vi.fn()} editingCategory={cat} existingGroups={[]} />
    );
    expect(screen.getByText("Edit Expenses Category")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Rent")).toBeInTheDocument();
  });

  it("calls createCategory on submit with name and group", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryFormDialog open onOpenChange={vi.fn()} defaultType="Income" existingGroups={[]} />
    );
    await user.type(screen.getAllByRole("textbox")[0], "Salary");
    // Open GroupCombobox (first combobox) and type group
    await user.click(screen.getAllByRole("combobox")[0]);
    await user.type(screen.getByPlaceholderText("Search or type new group..."), "Work");
    await user.click(screen.getByText("Add"));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Salary", group: "Work", type: "Income" }),
      expect.any(Object),
    );
  });

  it("does not submit when name is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryFormDialog open onOpenChange={vi.fn()} defaultType="Expenses" existingGroups={[]} />
    );
    await user.click(screen.getByText("Add"));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("calls updateCategory when editing", async () => {
    const user = userEvent.setup();
    const cat = { id: "c1", name: "Rent", type: "Expenses" as const, group: "Housing" };
    renderWithProviders(
      <CategoryFormDialog open onOpenChange={vi.fn()} editingCategory={cat} existingGroups={["Housing"]} />
    );
    const nameInput = screen.getAllByRole("textbox")[0];
    await user.clear(nameInput);
    await user.type(nameInput, "Mortgage");
    await user.click(screen.getByText("Update"));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1", data: expect.objectContaining({ name: "Mortgage" }) }),
      expect.any(Object),
    );
  });

  it("disables submit button while pending", () => {
    vi.mocked(useCreateCategory).mockReturnValue({ mutate: mockCreate, isPending: true } as ReturnType<typeof useCreateCategory>);
    renderWithProviders(
      <CategoryFormDialog open onOpenChange={vi.fn()} defaultType="Expenses" existingGroups={[]} />
    );
    expect(screen.getByText("Add")).toBeDisabled();
  });
});
