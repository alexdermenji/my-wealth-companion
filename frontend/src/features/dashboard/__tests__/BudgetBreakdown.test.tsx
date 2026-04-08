import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BudgetBreakdown from "../components/BudgetBreakdown";
import { BudgetTypeBreakdown } from "../types";

const fmt = (v: number) => `£${v}`;

const mockBreakdown: BudgetTypeBreakdown[] = [
  {
    type: "Income",
    totalTracked: 0,
    totalBudget: 3761,
    items: [
      { categoryId: "i1", categoryName: "Space (Net)", group: "Employment", tracked: 0, budget: 2870, percentage: 0 },
      { categoryId: "i2", categoryName: "Interest", group: "Employment", tracked: 0, budget: 0, percentage: 0 },
    ],
  },
  {
    type: "Expenses",
    totalTracked: 1050,
    totalBudget: 1450,
    items: [
      { categoryId: "e1", categoryName: "Rent", group: "Housing", tracked: 900, budget: 900, percentage: 100 },
      { categoryId: "e2", categoryName: "Mama", group: "Family", tracked: 50, budget: 200, percentage: 25 },
      { categoryId: "e3", categoryName: "Gym", group: "Health", tracked: 100, budget: 350, percentage: 28 },
    ],
  },
  {
    type: "Savings",
    totalTracked: 200,
    totalBudget: 400,
    items: [
      { categoryId: "s1", categoryName: "Emergency Fund", group: "Savings", tracked: 200, budget: 400, percentage: 50 },
    ],
  },
  {
    type: "Debt",
    totalTracked: 0,
    totalBudget: 0,
    items: [],
  },
];

describe("BudgetBreakdown", () => {
  describe("Navigator tiles", () => {
    it("renders all 4 section tiles", () => {
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      expect(screen.getByRole("button", { name: /income/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /expenses/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /savings/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /debt/i })).toBeInTheDocument();
    });

    it("shows total tracked and budget amounts in each tile", () => {
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      // fmt = (v) => `£${v}` — no locale formatting, so £1050 not £1,050
      expect(screen.getByRole("button", { name: /expenses/i })).toHaveTextContent("£1050");
      expect(screen.getByRole("button", { name: /expenses/i })).toHaveTextContent("£1450");
    });

    it("tile progress ring % shows one decimal place for section totals", () => {
      const breakdown: BudgetTypeBreakdown[] = [
        { type: "Income", totalTracked: 100, totalBudget: 350, items: [] },
      ];
      render(<BudgetBreakdown breakdown={breakdown} formatCurrency={fmt} />);
      const tile = screen.getByRole("button", { name: /income/i });
      expect(tile).toHaveTextContent("28.6%");
    });

    it("tile progress ring % omits trailing .0 for whole numbers", () => {
      const breakdown: BudgetTypeBreakdown[] = [
        { type: "Income", totalTracked: 681.09, totalBudget: 681.09, items: [] },
      ];
      render(<BudgetBreakdown breakdown={breakdown} formatCurrency={fmt} />);
      const tile = screen.getByRole("button", { name: /income/i });
      expect(tile).toHaveTextContent("100%");
      expect(tile).not.toHaveTextContent("100.0%");
    });
  });

  describe("Default selection", () => {
    it("shows the first section's detail panel on initial render", () => {
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      expect(screen.getByText("Space (Net)")).toBeInTheDocument();
    });

    it("does not show another section's categories initially", () => {
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      expect(screen.queryByText("Rent")).not.toBeInTheDocument();
    });
  });

  describe("Tile switching", () => {
    it("clicking a tile shows that section's categories in the detail panel", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);

      await user.click(screen.getByRole("button", { name: /expenses/i }));

      expect(screen.getByText("Rent")).toBeInTheDocument();
      expect(screen.getByText("Mama")).toBeInTheDocument();
      expect(screen.getByText("Gym")).toBeInTheDocument();
    });

    it("switching tiles hides the previously selected section's categories", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);

      await user.click(screen.getByRole("button", { name: /expenses/i }));

      expect(screen.queryByText("Space (Net)")).not.toBeInTheDocument();
    });

    it("switching to Savings shows Savings categories", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);

      await user.click(screen.getByRole("button", { name: /savings/i }));

      expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
    });
  });

  describe("Remaining column", () => {
    it("shows remaining amount when budget exceeds tracked", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      await user.click(screen.getByRole("button", { name: /expenses/i }));

      // Mama: tracked=50, budget=200 → remaining=150
      const rows = screen.getAllByRole("row");
      const mamaRow = rows.find(r => r.textContent?.includes("Mama"));
      expect(mamaRow).toHaveTextContent("£150");
    });

    it("shows — when tracked equals budget (nothing remaining)", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      await user.click(screen.getByRole("button", { name: /expenses/i }));

      // Rent: tracked=900, budget=900 → remaining=0 → shows —
      const rows = screen.getAllByRole("row");
      const rentRow = rows.find(r => r.textContent?.includes("Rent"));
      // remaining cell should be — (em dash)
      expect(rentRow?.querySelectorAll("td")[4]).toHaveTextContent("—");
    });
  });

  describe("Excess column", () => {
    it("shows excess amount when tracked exceeds budget", () => {
      const breakdownWithExcess: BudgetTypeBreakdown[] = [
        {
          type: "Expenses",
          totalTracked: 160,
          totalBudget: 140,
          items: [
            { categoryId: "e1", categoryName: "Food", group: "Food", tracked: 160, budget: 140, percentage: 114 },
          ],
        },
      ];
      render(<BudgetBreakdown breakdown={breakdownWithExcess} formatCurrency={fmt} />);

      // excess = 160 - 140 = 20
      const rows = screen.getAllByRole("row");
      const foodRow = rows.find(r => r.textContent?.includes("Food"));
      expect(foodRow?.querySelectorAll("td")[5]).toHaveTextContent("£20");
    });

    it("shows — in excess column when not over budget", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      await user.click(screen.getByRole("button", { name: /expenses/i }));

      const rows = screen.getAllByRole("row");
      const mamaRow = rows.find(r => r.textContent?.includes("Mama"));
      expect(mamaRow?.querySelectorAll("td")[5]).toHaveTextContent("—");
    });

    it("shows — in excess column when budget is zero", () => {
      const breakdown: BudgetTypeBreakdown[] = [
        {
          type: "Income",
          totalTracked: 500,
          totalBudget: 0,
          items: [
            { categoryId: "i1", categoryName: "Bonus", group: "Income", tracked: 500, budget: 0, percentage: 0 },
          ],
        },
      ];
      render(<BudgetBreakdown breakdown={breakdown} formatCurrency={fmt} />);

      const rows = screen.getAllByRole("row");
      const bonusRow = rows.find(r => r.textContent?.includes("Bonus"));
      expect(bonusRow?.querySelectorAll("td")[5]).toHaveTextContent("—");
    });
  });

  describe("Zero value display", () => {
    it("shows — for zero tracked amount", () => {
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);

      // Space (Net) has tracked=0 — should show — not £0
      const rows = screen.getAllByRole("row");
      const spaceRow = rows.find(r => r.textContent?.includes("Space (Net)"));
      expect(spaceRow?.querySelectorAll("td")[1]).toHaveTextContent("—");
    });

    it("shows — for zero budget amount", () => {
      // Need tracked > 0 so the row isn't filtered out, but budget = 0
      const breakdown: BudgetTypeBreakdown[] = [
        {
          type: "Income",
          totalTracked: 500,
          totalBudget: 0,
          items: [
            { categoryId: "i1", categoryName: "Bonus", group: "Income", tracked: 500, budget: 0, percentage: 0 },
          ],
        },
      ];
      render(<BudgetBreakdown breakdown={breakdown} formatCurrency={fmt} />);

      const rows = screen.getAllByRole("row");
      const bonusRow = rows.find(r => r.textContent?.includes("Bonus"));
      expect(bonusRow?.querySelectorAll("td")[2]).toHaveTextContent("—");
    });

    it("filters out rows where both tracked and budget are zero", () => {
      const breakdown: BudgetTypeBreakdown[] = [
        {
          type: "Income",
          totalTracked: 0,
          totalBudget: 0,
          items: [
            { categoryId: "i1", categoryName: "York Street Rent", group: "Rent", tracked: 0, budget: 0, percentage: 0 },
            { categoryId: "i2", categoryName: "Space (Net)", group: "Employment", tracked: 0, budget: 2870, percentage: 0 },
          ],
        },
      ];
      render(<BudgetBreakdown breakdown={breakdown} formatCurrency={fmt} />);

      expect(screen.queryByText("York Street Rent")).not.toBeInTheDocument();
      expect(screen.getByText("Space (Net)")).toBeInTheDocument();
    });
  });

  describe("Empty section", () => {
    it("shows empty state message when selected section has no items", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);

      await user.click(screen.getByRole("button", { name: /debt/i }));

      expect(screen.getByText("No data for this period")).toBeInTheDocument();
    });
  });

  describe("Total row", () => {
    it("shows section totals in the footer row", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      await user.click(screen.getByRole("button", { name: /expenses/i }));

      const totalRow = screen.getAllByRole("row").find(r => r.textContent?.startsWith("Total"));
      expect(totalRow).toHaveTextContent("£1050");
      expect(totalRow).toHaveTextContent("£1450");
    });

    it("total % shows one decimal place", () => {
      const breakdown: BudgetTypeBreakdown[] = [
        {
          type: "Expenses",
          totalTracked: 100,
          totalBudget: 350,
          items: [
            { categoryId: "e1", categoryName: "Gym", group: "Health", tracked: 100, budget: 350, percentage: 28 },
          ],
        },
      ];
      render(<BudgetBreakdown breakdown={breakdown} formatCurrency={fmt} />);

      const rows = screen.getAllByRole("row");
      const gymRow = rows.find(r => r.textContent?.includes("Gym") && !r.textContent?.includes("Total"));
      const totalRow = rows.find(r => r.textContent?.startsWith("Total"));

      // Item percentages still come from the backend, section totals are computed in the frontend.
      expect(gymRow).toHaveTextContent("28%");
      expect(totalRow).toHaveTextContent("28.6%");
    });

    it("total % omits trailing .0 for whole numbers", () => {
      const breakdown: BudgetTypeBreakdown[] = [
        {
          type: "Debt",
          totalTracked: 681.09,
          totalBudget: 681.09,
          items: [
            { categoryId: "d1", categoryName: "Admiral loan 7yrs", group: "Loans", tracked: 681.09, budget: 681.09, percentage: 100 },
          ],
        },
      ];

      render(<BudgetBreakdown breakdown={breakdown} formatCurrency={fmt} />);

      const totalRow = screen.getAllByRole("row").find(r => r.textContent?.startsWith("Total"));
      expect(totalRow).toHaveTextContent("100%");
      expect(totalRow).not.toHaveTextContent("100.0%");
    });

    it("total % shows small non-zero values instead of flooring to 0%", () => {
      const breakdown: BudgetTypeBreakdown[] = [
        {
          type: "Income",
          totalTracked: 6.21,
          totalBudget: 3806.5,
          items: [
            { categoryId: "i1", categoryName: "Interest", group: "Income", tracked: 6.21, budget: 6.21, percentage: 100 },
            { categoryId: "i2", categoryName: "Space", group: "Income", tracked: 0, budget: 3800.29, percentage: 0 },
          ],
        },
      ];

      render(<BudgetBreakdown breakdown={breakdown} formatCurrency={fmt} />);

      const totalRow = screen.getAllByRole("row").find(r => r.textContent?.startsWith("Total"));
      expect(totalRow).toHaveTextContent("0.2%");
    });

    it("does not render total row footer when section is empty", async () => {
      const user = userEvent.setup();
      render(<BudgetBreakdown breakdown={mockBreakdown} formatCurrency={fmt} />);
      await user.click(screen.getByRole("button", { name: /debt/i }));

      expect(screen.queryByText("Total")).not.toBeInTheDocument();
    });
  });
});
