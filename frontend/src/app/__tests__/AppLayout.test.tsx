import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { AppLayout } from "../AppLayout";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/shared/auth/AuthProvider", () => ({
  useAuth: () => ({
    logout: vi.fn(),
    userName: "test-user",
    authenticated: true,
    keycloak: {},
  }),
}));

describe("AppLayout", () => {
  it("renders the app title", () => {
    renderWithProviders(<AppLayout>Content</AppLayout>);
    expect(screen.getByText("FinanceFlow")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    renderWithProviders(<AppLayout>Content</AppLayout>);
    expect(screen.getAllByText("Dashboard")).toHaveLength(2); // desktop + mobile
    expect(screen.getAllByText("Transactions")).toHaveLength(2);
    expect(screen.getAllByText("Budget Plan")).toHaveLength(2);
    expect(screen.getAllByText("Settings")).toHaveLength(2);
  });

  it("renders children content", () => {
    renderWithProviders(<AppLayout><div>Test Content</div></AppLayout>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("highlights active route", () => {
    renderWithProviders(<AppLayout>Content</AppLayout>, {
      initialEntries: ["/transactions"],
    });
    // Desktop sidebar links
    const links = screen.getAllByText("Transactions");
    const desktopLink = links[0].closest("a");
    expect(desktopLink?.className).toContain("bg-primary");
  });
});
