import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const meta: Meta = {
  title: "Components/Table",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Base table primitives (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) used as the foundation for the Budget Plan, Transactions, and Allocations views.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const TRANSACTIONS = [
  { date: "Apr 3",  description: "Salary",          category: "Income",    type: "income",   amount: "+£4,200" },
  { date: "Apr 2",  description: "Tesco Metro",      category: "Groceries", type: "expense",  amount: "−£43.20" },
  { date: "Apr 2",  description: "Netflix",          category: "Subscriptions", type: "expense", amount: "−£15.99" },
  { date: "Apr 1",  description: "ISA Transfer",     category: "Savings",   type: "savings",  amount: "−£400" },
  { date: "Mar 31", description: "Credit Card",      category: "Debt",      type: "debt",     amount: "−£200" },
  { date: "Mar 30", description: "Freelance Invoice",category: "Freelance", type: "income",   amount: "+£600" },
];

const typeStyles: Record<string, { color: string; textColor: string }> = {
  income:  { color: "#10b981", textColor: "#065f46" },
  expense: { color: "#ec4899", textColor: "#9d174d" },
  savings: { color: "#6c5ce7", textColor: "#4c1d95" },
  debt:    { color: "#0ea5e9", textColor: "#0c4a6e" },
};

export const TransactionsTable: Story = {
  name: "Transactions Table",
  render: () => (
    <div className="rounded-xl border border-[#dde3f0] bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#f8faff] hover:bg-[#f8faff]">
            <TableHead className="font-display text-[10px] font-bold uppercase tracking-widest text-[#7a849e] w-20">Date</TableHead>
            <TableHead className="font-display text-[10px] font-bold uppercase tracking-widest text-[#7a849e]">Description</TableHead>
            <TableHead className="font-display text-[10px] font-bold uppercase tracking-widest text-[#7a849e]">Category</TableHead>
            <TableHead className="font-display text-[10px] font-bold uppercase tracking-widest text-[#7a849e] text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TRANSACTIONS.map(({ date, description, category, type, amount }) => {
            const style = typeStyles[type];
            return (
              <TableRow key={`${date}-${description}`} className="border-[#f0f2f8]">
                <TableCell className="text-xs text-[#7a849e]">{date}</TableCell>
                <TableCell className="text-sm font-medium text-[#1a1f35]">{description}</TableCell>
                <TableCell>
                  <Badge
                    className="text-[10px] font-semibold"
                    style={{ color: style.textColor, border: "none" }}
                  >
                    {category}
                  </Badge>
                </TableCell>
                <TableCell
                  className="text-right font-display text-sm font-bold"
                  style={{ color: style.color }}
                >
                  {amount}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  ),
};

export const BudgetHeaderRow: Story = {
  name: "Budget Section Header",
  parameters: {
    docs: {
      description: {
        story: "The sticky section header row pattern used in the annual budget table.",
      },
    },
  },
  render: () => (
    <div className="rounded-xl border border-[#dde3f0] bg-white shadow-md overflow-hidden">
      <Table>
        <TableBody>
          {[
            { label: "Income",      color: "#10b981", bg: "#d1fae5" },
            { label: "Expenses",    color: "#ec4899", bg: "#fce7f3" },
            { label: "Savings",     color: "#6c5ce7", bg: "#ede9fe" },
            { label: "Liabilities", color: "#0ea5e9", bg: "#e0f2fe" },
          ].map(({ label, color }) => (
            <TableRow key={label} style={{ background: "#f8faff" }} className="border-[#dde3f0]">
              <TableCell className="py-2.5 w-40">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span
                    className="font-display text-xs font-bold uppercase tracking-widest"
                    style={{ color }}
                  >
                    {label}
                  </span>
                </div>
              </TableCell>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                <TableCell
                  key={m}
                  className="py-2.5 text-center font-display text-[10px] font-bold uppercase tracking-wider text-[#7a849e]"
                >
                  {m}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
