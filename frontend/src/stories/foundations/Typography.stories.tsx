import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundations/Typography",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Pearl type system uses **Syne** for display/headings (bold, geometric) and **DM Sans** for body text (clean, readable). Both are loaded from Google Fonts.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-widest text-[#7a849e]">
      {children}
    </p>
  );
}

function TypographyPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f8] p-8">
      <div className="mb-8">
        <p className="mb-1 font-display text-xs font-bold uppercase tracking-widest text-[#7a849e]">
          Foundations
        </p>
        <h1 className="font-display text-4xl font-extrabold text-[#1a1f35]">Typography</h1>
        <p className="mt-2 text-[#7a849e]">
          Two typefaces. One for structure, one for reading.
        </p>
      </div>

      {/* Display / Headings — Syne */}
      <div className="mb-10 rounded-2xl border border-[#dde3f0] bg-white p-8 shadow-sm">
        <p className="mb-6 font-display text-xs font-bold uppercase tracking-widest text-[#6c5ce7]">
          Syne · Display & Headings · font-display
        </p>

        <div className="space-y-6">
          <div>
            <Label>Display · 800 · 3rem</Label>
            <p className="font-display text-5xl font-extrabold leading-tight text-[#1a1f35]">
              Your Financial Future
            </p>
          </div>
          <div>
            <Label>H1 · 800 · 2.25rem</Label>
            <h1 className="font-display text-4xl font-extrabold text-[#1a1f35]">
              Budget Plan 2026
            </h1>
          </div>
          <div>
            <Label>H2 · 700 · 1.875rem</Label>
            <h2 className="font-display text-3xl font-bold text-[#1a1f35]">
              Monthly Overview
            </h2>
          </div>
          <div>
            <Label>H3 · 700 · 1.5rem</Label>
            <h3 className="font-display text-2xl font-bold text-[#1a1f35]">
              Income Breakdown
            </h3>
          </div>
          <div>
            <Label>H4 · 600 · 1.25rem</Label>
            <h4 className="font-display text-xl font-semibold text-[#1a1f35]">
              Salary & Freelance
            </h4>
          </div>
          <div>
            <Label>Section Label · 700 · 0.6875rem · tracked</Label>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a849e]">
              Budget Categories
            </p>
          </div>
        </div>
      </div>

      {/* Body — DM Sans */}
      <div className="mb-10 rounded-2xl border border-[#dde3f0] bg-white p-8 shadow-sm">
        <p className="mb-6 font-display text-xs font-bold uppercase tracking-widest text-[#6c5ce7]">
          DM Sans · Body · font-sans
        </p>

        <div className="space-y-6">
          <div>
            <Label>Body LG · 400 · 1.125rem</Label>
            <p className="text-lg text-[#1a1f35]">
              Track your income, expenses, and savings goals in one place. FinanceFlow
              gives you a clear picture of where your money goes every month.
            </p>
          </div>
          <div>
            <Label>Body · 400 · 1rem</Label>
            <p className="text-base text-[#1a1f35]">
              Track your income, expenses, and savings goals in one place. FinanceFlow
              gives you a clear picture of where your money goes every month.
            </p>
          </div>
          <div>
            <Label>Body · 500 · 1rem (medium)</Label>
            <p className="text-base font-medium text-[#1a1f35]">
              Track your income, expenses, and savings goals in one place.
            </p>
          </div>
          <div>
            <Label>Body SM · 400 · 0.875rem</Label>
            <p className="text-sm text-[#1a1f35]">
              Track your income, expenses, and savings goals in one place. FinanceFlow
              gives you a clear picture of where your money goes every month.
            </p>
          </div>
          <div>
            <Label>Caption · 400 · 0.75rem · muted</Label>
            <p className="text-xs text-[#7a849e]">
              Last updated: April 2026 · Data refreshed every 24 hours
            </p>
          </div>
          <div>
            <Label>Mono / Amount · 700 · 1.5rem</Label>
            <p className="font-display text-2xl font-bold text-[#10b981]">£4,800.00</p>
          </div>
        </div>
      </div>

      {/* Color roles */}
      <div className="rounded-2xl border border-[#dde3f0] bg-white p-8 shadow-sm">
        <p className="mb-6 font-display text-xs font-bold uppercase tracking-widest text-[#6c5ce7]">
          Text Color Roles
        </p>
        <div className="space-y-3">
          {[
            { label: "Foreground — primary text",         cls: "text-[#1a1f35]",  sample: "Monthly net: £1,533" },
            { label: "Muted foreground — secondary text", cls: "text-[#7a849e]",  sample: "Housing · Rent" },
            { label: "Income — positive amounts",         cls: "text-[#10b981]",  sample: "+£4,800" },
            { label: "Expense — outflows",                cls: "text-[#ec4899]",  sample: "−£2,445" },
            { label: "Savings — savings amounts",         cls: "text-[#6c5ce7]",  sample: "£900 saved" },
            { label: "Debt — liabilities",                cls: "text-[#0ea5e9]",  sample: "£350 / mo" },
            { label: "Warning — alerts",                  cls: "text-[#f59e0b]",  sample: "£1,270 remaining" },
          ].map(({ label, cls, sample }) => (
            <div key={label} className="flex items-center gap-6">
              <p className="w-72 text-sm text-[#7a849e]">{label}</p>
              <p className={`font-display text-base font-bold ${cls}`}>{sample}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const AllTypography: Story = {
  name: "All Typography",
  render: () => <TypographyPage />,
};
