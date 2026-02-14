import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import SettingsPage from "../SettingsPage";
import { renderWithProviders } from "@/test/test-utils";
import { useAccounts } from "@/shared/hooks/useAccounts";
import { useCategories } from "@/shared/hooks/useCategories";
import { useSettings } from "../hooks";

vi.mock("@/shared/hooks/useAccounts");
vi.mock("@/shared/hooks/useCategories");
vi.mock("../hooks");
vi.mock("@/shared/api/categoriesApi");

const mockAccounts = [
  { id: "a1", name: "Cash Wallet", type: "Cash" },
  { id: "a2", name: "Chase Bank", type: "Bank" },
];

const mockCategories = [
  { id: "c1", name: "Rent", type: "Expenses", group: "Housing", groupEmoji: "🏠" },
  { id: "c2", name: "Salary", type: "Income", group: "Employment", groupEmoji: "💼" },
  { id: "c3", name: "Emergency Fund", type: "Savings", group: "Savings", groupEmoji: "🏦" },
];

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as ReturnType<typeof useCategories>);
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "$" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
  });

  it("renders the page title", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("displays General settings section", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("$")).toBeInTheDocument();
  });

  it("displays accounts table", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Cash Wallet")).toBeInTheDocument();
    expect(screen.getByText("Chase Bank")).toBeInTheDocument();
  });

  it("displays category blocks for all types", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Income Categories")).toBeInTheDocument();
    expect(screen.getByText("Expenses Categories")).toBeInTheDocument();
    expect(screen.getByText("Savings Categories")).toBeInTheDocument();
    expect(screen.getByText("Debt Categories")).toBeInTheDocument();
  });

  it("shows categories in correct blocks", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
  });
});
