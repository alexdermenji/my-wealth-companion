import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";

const meta: Meta = {
  title: "Finance/Budget Section",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The annual budget table section. Each `BudgetSection` renders a colour-coded header row, one row per category, and a totals footer. Use the controls to switch between section types.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ─── Design tokens per section type ──────────────────────────────────────────
const SECTION_CONFIG = {
  Income: {
    color:     "#10b981",
    headerBg:  "#d1fae5",
    headerText:"#065f46",
    totalBg:   "#f0fdf8",
    categories: [
      { group: "Employment",  name: "Salary",     values: [4200,4200,4200,4200,4200,4200,4200,4200,4200,4200,4200,4200] },
      { group: "Employment",  name: "Bonus",      values: [0,0,0,0,0,1500,0,0,0,0,0,2000] },
      { group: "Side Income", name: "Freelance",  values: [600,800,500,700,600,0,900,600,700,800,500,600] },
      { group: "Investments", name: "Dividends",  values: [0,0,120,0,0,280,0,0,120,0,0,280] },
    ],
  },
  Expenses: {
    color:     "#ec4899",
    headerBg:  "#fce7f3",
    headerText:"#9d174d",
    totalBg:   "#fdf2f8",
    categories: [
      { group: "Housing",   name: "Rent",          values: [1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500] },
      { group: "Housing",   name: "Utilities",     values: [180,175,160,140,130,120,115,120,135,155,170,185] },
      { group: "Food",      name: "Groceries",     values: [380,360,370,355,340,360,380,370,360,375,390,420] },
      { group: "Food",      name: "Eating Out",    values: [200,180,220,200,240,280,260,240,200,210,230,280] },
      { group: "Transport", name: "Travel",        values: [120,120,120,120,120,120,120,120,120,120,120,120] },
      { group: "Lifestyle", name: "Subscriptions", values: [65,65,65,65,65,65,65,65,65,65,65,65] },
    ],
  },
  Savings: {
    color:     "#6c5ce7",
    headerBg:  "#ede9fe",
    headerText:"#4c1d95",
    totalBg:   "#f5f3ff",
    categories: [
      { group: "Emergency",  name: "Emergency Fund", values: [300,300,300,300,300,300,300,300,300,300,300,300] },
      { group: "Goals",      name: "Holiday",        values: [200,200,200,200,200,0,0,0,200,200,200,200] },
      { group: "Investment", name: "ISA / Stocks",   values: [400,400,400,400,400,400,400,400,400,400,400,400] },
    ],
  },
  Liabilities: {
    color:     "#0ea5e9",
    headerBg:  "#e0f2fe",
    headerText:"#0c4a6e",
    totalBg:   "#f0f9ff",
    categories: [
      { group: "Credit", name: "Credit Card",  values: [200,200,200,200,200,200,200,200,200,200,200,200] },
      { group: "Loans",  name: "Student Loan", values: [150,150,150,150,150,150,150,150,150,150,150,150] },
    ],
  },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (v: number) => v > 0 ? `£${new Intl.NumberFormat("en-US").format(v)}` : "—";

interface SectionProps {
  type: keyof typeof SECTION_CONFIG;
}

function BudgetSectionDemo({ type }: SectionProps) {
  const cfg = SECTION_CONFIG[type];
  const totals = MONTHS.map((_, mi) =>
    cfg.categories.reduce((s, c) => s + c.values[mi], 0)
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-[#dde3f0] bg-white shadow-md">
      <table className="min-w-[960px] w-full border-collapse text-sm">
        {/* Section header */}
        <thead>
          <tr style={{ background: "#f8faff" }}>
            <th
              className="sticky left-0 z-10 w-40 py-2.5 pl-4 text-left"
              style={{ background: "#f8faff", borderLeft: `3px solid ${cfg.color}` }}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
                <span
                  className="font-display text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: cfg.color }}
                >
                  {type}
                </span>
              </div>
            </th>
            {MONTHS.map((m) => (
              <th
                key={m}
                className="py-2.5 text-center font-display text-[10px] font-bold uppercase tracking-wider text-[#7a849e]"
              >
                {m}
              </th>
            ))}
          </tr>
          {/* Gradient accent line */}
          <tr style={{ background: "#f8faff" }} aria-hidden>
            <td
              colSpan={13}
              className="p-0 h-px"
              style={{
                background: `linear-gradient(to right, ${cfg.color}, ${cfg.color}80 30%, transparent 70%)`,
              }}
            />
          </tr>
        </thead>

        <tbody>
          {/* Category rows */}
          {cfg.categories.map((cat) => (
            <tr key={cat.name} className="group/row border-t border-[#f0f2f8] hover:bg-[#fafbff]">
              <td
                className="sticky left-0 z-10 w-40 bg-white py-2"
                style={{ borderLeft: "3px solid transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = cfg.color; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; }}
              >
                <div className="flex flex-col px-4">
                  <span className="text-[10px] italic text-[#7a849e]">{cat.group}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-[#1a1f35]">{cat.name}</span>
                    <button className="flex items-center text-[#7a849e] hover:text-[#1a1f35] opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button className="flex items-center text-[#ec4899] opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </td>
              {cat.values.map((v, mi) => (
                <td key={mi} className="border-r border-[#f0f2f8] px-1 py-1">
                  <Input
                    className="w-20 border-transparent bg-transparent text-right text-xs font-medium focus-visible:border-[#dde3f0]"
                    style={{ "--tw-ring-color": cfg.color } as React.CSSProperties}
                    defaultValue={v > 0 ? v : ""}
                    placeholder="—"
                  />
                </td>
              ))}
            </tr>
          ))}

          {/* Total row */}
          <tr style={{ background: cfg.totalBg }} className="border-t border-[#dde3f0]">
            <td
              className="sticky left-0 z-10 py-2.5 pl-4"
              style={{ background: cfg.totalBg }}
            >
              <span
                className="font-display text-[11px] font-bold uppercase tracking-wider"
                style={{ color: cfg.color }}
              >
                Total {type}
              </span>
            </td>
            {totals.map((v, mi) => (
              <td key={mi} className="px-1 py-2 text-center">
                <span className="font-display text-xs font-bold" style={{ color: cfg.color }}>
                  {fmt(v)}
                </span>
              </td>
            ))}
          </tr>

          {/* Add category button */}
          <tr className="border-t border-[#f0f2f8]">
            <td className="py-2 pl-4">
              <button
                className="rounded-md border border-dashed border-[#dde3f0] px-3 py-1.5 text-xs font-medium text-[#7a849e] transition-all hover:border-[#6c5ce7] hover:text-[#6c5ce7]"
              >
                + Add category
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export const IncomeSection: Story = {
  name: "Income",
  render: () => <BudgetSectionDemo type="Income" />,
};

export const ExpensesSection: Story = {
  name: "Expenses",
  render: () => <BudgetSectionDemo type="Expenses" />,
};

export const SavingsSection: Story = {
  name: "Savings",
  render: () => <BudgetSectionDemo type="Savings" />,
};

export const LiabilitiesSection: Story = {
  name: "Liabilities",
  render: () => <BudgetSectionDemo type="Liabilities" />,
};

export const AllSections: Story = {
  name: "All Sections",
  parameters: {
    docs: {
      description: {
        story: "All four section types stacked — approximates the full Budget Plan page layout.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-3 bg-[#f0f2f8] p-6">
      {(["Income", "Expenses", "Savings", "Liabilities"] as const).map((t) => (
        <BudgetSectionDemo key={t} type={t} />
      ))}
    </div>
  ),
};
