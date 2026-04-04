import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../SettingsPage";
import { renderWithProviders } from "@/test/test-utils";
import { useAccounts } from "@/shared/hooks/useAccounts";
import { useCategories } from "@/shared/hooks/useCategories";
import { useSettings, useUpdateSettings } from "../hooks";

vi.mock("@/shared/hooks/useAccounts");
vi.mock("@/shared/hooks/useCategories");
vi.mock("../hooks");
vi.mock("@/shared/api/categoriesApi");

const mockAccounts = [
  { id: "a1", name: "Cash Wallet", type: "Cash" },
  { id: "a2", name: "Chase Bank", type: "Bank" },
];

const mockCategories = [
  { id: "c1", name: "Rent", type: "Expenses", group: "Housing" },
  { id: "c2", name: "Salary", type: "Income", group: "Employment" },
  { id: "c3", name: "Emergency Fund", type: "Savings", group: "Savings" },
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
    vi.mocked(useUpdateSettings).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateSettings>);
  });

  it("renders the page title", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("displays General settings section", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026")).toBeInTheDocument();
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

describe("SettingsPage — currency selector", () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.mocked(useAccounts).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useAccounts>);
    vi.mocked(useCategories).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useCategories>);
    vi.mocked(useUpdateSettings).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateSettings>);
  });

  it("shows the flag and ISO code of the current currency in the trigger", () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "£" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("🇬🇧 GBP")).toBeInTheDocument();
  });

  it("shows the flag and ISO code for $ USD", () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "$" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("🇺🇸 USD")).toBeInTheDocument();
  });

  it("shows all 10 currency options in the dropdown", async () => {
    const user = userEvent.setup();
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "$" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
    renderWithProviders(<SettingsPage />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("🇬🇧 GBP — £")).toBeInTheDocument();
    expect(screen.getByText("🇺🇸 USD — $")).toBeInTheDocument();
    expect(screen.getByText("🇪🇺 EUR — €")).toBeInTheDocument();
    expect(screen.getByText("🇸🇪 SEK — kr")).toBeInTheDocument();
    expect(screen.getByText("🇳🇴 NOK — kr")).toBeInTheDocument();
  });

  it("calls updateSettings with the new currency code when selecting from dropdown", async () => {
    const user = userEvent.setup();
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "$" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
    renderWithProviders(<SettingsPage />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("🇬🇧 GBP — £"));
    expect(mutate).toHaveBeenCalledWith({ startYear: 2026, startMonth: 1, currency: "£" });
  });

  it("calls updateSettings with kr-sek when selecting SEK", async () => {
    const user = userEvent.setup();
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "$" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
    renderWithProviders(<SettingsPage />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("🇸🇪 SEK — kr"));
    expect(mutate).toHaveBeenCalledWith({ startYear: 2026, startMonth: 1, currency: "kr-sek" });
  });
});
