import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Finance/Status Bar",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The summary strip at the bottom of the Budget Plan page. Shows monthly averages for each section and the net remaining figure with a directional indicator.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

interface StatusItem {
  label: string;
  amount: string;
  color: string;
}

interface StatusBarProps {
  items: StatusItem[];
  net: { label: string; amount: string; positive: boolean };
}

function Divider() {
  return <div className="h-5 w-px bg-[#dde3f0]" />;
}

function StatusBarDemo({ items, net }: StatusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl border border-[#dde3f0] bg-white px-5 py-3.5 shadow-sm">
      {items.map(({ label, amount, color }, i) => (
        <React.Fragment key={label}>
          {i > 0 && <Divider />}
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs text-[#7a849e]">{label}</span>
            <span className="font-amount text-sm font-bold" style={{ color }}>{amount}</span>
          </div>
        </React.Fragment>
      ))}
      <Divider />
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-[#7a849e]">{net.label}</span>
        <span
          className="font-amount text-sm font-bold"
          style={{ color: net.positive ? "#10b981" : "#ec4899" }}
        >
          {net.amount} {net.positive ? "↑" : "↓"}
        </span>
      </div>
    </div>
  );
}

const DEFAULT_ITEMS: StatusItem[] = [
  { label: "Income",      amount: "£5,167/mo", color: "#10b981" },
  { label: "Expenses",    amount: "£2,434/mo", color: "#ec4899" },
  { label: "Savings",     amount: "£850/mo",   color: "#6c5ce7" },
  { label: "Liabilities", amount: "£350/mo",   color: "#0ea5e9" },
];

export const Default: Story = {
  render: () => (
    <div className="bg-[#f0f2f8] p-6">
      <StatusBarDemo
        items={DEFAULT_ITEMS}
        net={{ label: "Net remaining (avg)", amount: "£1,533/mo", positive: true }}
      />
    </div>
  ),
};

export const OverBudget: Story = {
  name: "Over Budget",
  parameters: {
    docs: {
      description: { story: "Net remaining turns pink when spending exceeds income." },
    },
  },
  render: () => (
    <div className="bg-[#f0f2f8] p-6">
      <StatusBarDemo
        items={[
          { label: "Income",      amount: "£3,200/mo", color: "#10b981" },
          { label: "Expenses",    amount: "£2,800/mo", color: "#ec4899" },
          { label: "Savings",     amount: "£500/mo",   color: "#6c5ce7" },
          { label: "Liabilities", amount: "£300/mo",   color: "#0ea5e9" },
        ]}
        net={{ label: "Net remaining (avg)", amount: "£400/mo", positive: false }}
      />
    </div>
  ),
};

export const QuarterView: Story = {
  name: "Q1 View",
  parameters: {
    docs: {
      description: { story: "When viewing a single quarter, averages reflect only those 3 months." },
    },
  },
  render: () => (
    <div className="bg-[#f0f2f8] p-6">
      <StatusBarDemo
        items={[
          { label: "Income (Q1)",      amount: "£4,933/mo", color: "#10b981" },
          { label: "Expenses (Q1)",    amount: "£2,427/mo", color: "#ec4899" },
          { label: "Savings (Q1)",     amount: "£900/mo",   color: "#6c5ce7" },
          { label: "Liabilities (Q1)", amount: "£350/mo",   color: "#0ea5e9" },
        ]}
        net={{ label: "Net (Q1 avg)", amount: "£1,256/mo", positive: true }}
      />
    </div>
  ),
};

export const FullPage: Story = {
  name: "Full Page Context",
  parameters: {
    docs: {
      description: {
        story: "The status bar in context — shown below the budget table as it would appear on the Budget Plan page.",
      },
    },
  },
  render: () => (
    <div className="min-h-screen bg-[#f0f2f8] p-6 flex flex-col gap-4">
      {/* Year nav mock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-extrabold text-[#1a1f35]">FinanceFlow</span>
          <span className="rounded-full border border-[#c4b5fd] bg-[#ede9fe] px-3 py-0.5 font-display text-[11px] font-bold uppercase tracking-widest text-[#6c5ce7]">
            Budget Plan
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-[#dde3f0] bg-white px-4 py-1.5 shadow-sm">
          <button className="text-[#7a849e]">‹</button>
          <span className="font-display text-base font-bold text-[#1a1f35]">2026</span>
          <button className="text-[#7a849e]">›</button>
        </div>
      </div>

      {/* Table placeholder */}
      <div className="flex-1 rounded-xl border border-[#dde3f0] bg-white shadow-md flex items-center justify-center min-h-80">
        <p className="text-sm text-[#7a849e]">← Budget table here →</p>
      </div>

      {/* Status bar */}
      <StatusBarDemo
        items={DEFAULT_ITEMS}
        net={{ label: "Net remaining (avg)", amount: "£1,533/mo", positive: true }}
      />
    </div>
  ),
};
