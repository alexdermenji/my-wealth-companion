import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import SettingsPage from "../SettingsPage";
import { renderWithProviders } from "@/test/test-utils";
import { useAccounts } from "@/shared/hooks/useAccounts";
import { useSettings } from "../hooks";

vi.mock("@/shared/hooks/useAccounts");
vi.mock("../hooks");

const mockAccounts = [
  { id: "a1", name: "Cash Wallet", type: "Cash" },
  { id: "a2", name: "Chase Bank", type: "Bank" },
];

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
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

  it("only shows general and account management sections", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Manage accounts and preferences")).toBeInTheDocument();
    expect(screen.queryByText("Budget Categories")).not.toBeInTheDocument();
  });
});
