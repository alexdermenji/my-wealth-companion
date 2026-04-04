import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "@/components/ui/progress";

const meta: Meta<typeof Progress> = {
  title: "Components/Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Radix UI Progress primitive. Use to show budget utilisation, savings goal progress, or XP/streak bars. The fill colour can be customised with inline styles.",
      },
    },
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: { value: 45 },
};

export const Values: Story = {
  name: "Values",
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      {[0, 25, 50, 75, 100].map((v) => (
        <div key={v} className="flex items-center gap-3">
          <span className="w-8 text-right font-display text-xs font-bold text-[#7a849e]">{v}%</span>
          <Progress value={v} className="flex-1 h-2" />
        </div>
      ))}
    </div>
  ),
};

export const FinanceProgress: Story = {
  name: "Finance — Budget Usage",
  parameters: {
    docs: {
      description: {
        story: "Progress bars showing budget utilisation per category. Color changes with severity.",
      },
    },
  },
  render: () => (
    <div className="rounded-xl border border-[#dde3f0] bg-white p-6 w-96">
      <p className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-[#7a849e]">
        April Budget Usage
      </p>
      <div className="flex flex-col gap-4">
        {[
          { name: "Groceries",    used: 355, budget: 400, color: "#10b981" },
          { name: "Eating Out",   used: 280, budget: 300, color: "#f59e0b" },
          { name: "Subscriptions",used: 65,  budget: 65,  color: "#ec4899" },
          { name: "Travel",       used: 90,  budget: 120, color: "#10b981" },
          { name: "Rent",         used: 1500,budget: 1500,color: "#ec4899" },
        ].map(({ name, used, budget, color }) => {
          const pct = Math.min((used / budget) * 100, 100);
          return (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-[#1a1f35]">{name}</span>
                <span className="font-display text-xs font-bold" style={{ color }}>
                  £{used} / £{budget}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2f8]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ),
};

export const SavingsGoal: Story = {
  name: "Savings Goal",
  render: () => (
    <div className="rounded-xl border border-[#dde3f0] bg-white p-6 w-80">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-bold text-[#1a1f35]">Holiday Fund</p>
          <p className="text-xs text-[#7a849e]">Goal: £2,000</p>
        </div>
        <p className="font-display text-xl font-extrabold text-[#6c5ce7]">£1,400</p>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ede9fe]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: "70%", background: "linear-gradient(90deg, #6c5ce7, #0ea5e9)" }}
        />
      </div>
      <p className="mt-1.5 text-xs text-[#7a849e]">70% · £600 remaining</p>
    </div>
  ),
};
