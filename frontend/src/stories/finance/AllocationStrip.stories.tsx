import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Finance/Allocation Strip",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The sticky header strip above the budget table. Shows `Remaining` — the difference between total income and total outflows (expenses + savings + liabilities) for each month. Positive = unallocated, Negative = over-budget, Zero = perfectly balanced. Values use the amount font for tighter numeric rhythm.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function valColor(v: number) {
  if (v < 0)  return "#ec4899";  // over budget — pink
  if (v > 0)  return "#10b981";  // unallocated — calm green
  return "#10b981";              // balanced — green
}

interface StripProps {
  values: number[];
}

function AllocationStripDemo({ values }: StripProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#dde3f0] bg-white p-4 shadow-sm">
      <table className="min-w-[900px] w-full border-collapse">
        <thead>
          <tr>
            <th className="pb-2 text-left font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a849e] w-36">
              Allocations
            </th>
            {MONTHS.map((m) => (
              <th
                key={m}
                className="pb-2 text-center font-display text-[10px] font-bold uppercase tracking-[0.06em] text-[#7a849e]"
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-xs font-semibold text-[#7a849e]">Remaining</td>
            {values.map((v, i) => (
              <td key={i} className="text-center">
                <span
                  className="font-amount text-sm font-bold"
                  style={{ color: valColor(v) }}
                >
                  {v === 0
                    ? "—"
                    : `${v > 0 ? "" : ""}£${Math.abs(v).toLocaleString("en-US")}`}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export const Positive: Story = {
  name: "Positive — Unallocated",
  parameters: {
    docs: {
      description: { story: "Green values mean income is higher than outflows — money is not yet allocated." },
    },
  },
  render: () => (
    <div className="bg-[#f0f2f8] p-6">
      <AllocationStripDemo
        values={[1105, 1350, 1135, 1270, 1155, 2485, 1610, 1335, 1390, 1325, 975, 880]}
      />
    </div>
  ),
};

export const Negative: Story = {
  name: "Negative — Over Budget",
  parameters: {
    docs: {
      description: { story: "Pink/red values mean spending exceeds income — the budget needs adjustment." },
    },
  },
  render: () => (
    <div className="bg-[#f0f2f8] p-6">
      <AllocationStripDemo
        values={[200, -150, 300, -80, 100, -430, 200, -90, 150, 300, -200, -100]}
      />
    </div>
  ),
};

export const Balanced: Story = {
  name: "Balanced",
  parameters: {
    docs: {
      description: { story: "Zero across all months means every pound of income is allocated. The ideal state." },
    },
  },
  render: () => (
    <div className="bg-[#f0f2f8] p-6">
      <AllocationStripDemo values={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} />
    </div>
  ),
};

export const Mixed: Story = {
  name: "Mixed — Real World",
  render: () => (
    <div className="bg-[#f0f2f8] p-6">
      <AllocationStripDemo
        values={[1105, 1350, 1135, -80, 1155, 2485, 1610, -90, 1390, 1325, -200, 880]}
      />
      <div className="mt-4 flex gap-6">
        {[
          { label: "Positive (green)",  desc: "Unallocated income",          color: "#10b981" },
          { label: "Negative (pink)",   desc: "Over budget — needs review",  color: "#ec4899" },
          { label: "Zero (green)",      desc: "Perfectly balanced",          color: "#10b981" },
        ].map(({ label, desc, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ background: color }} />
            <div>
              <p className="text-xs font-semibold text-[#1a1f35]">{label}</p>
              <p className="text-[10px] text-[#7a849e]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};
