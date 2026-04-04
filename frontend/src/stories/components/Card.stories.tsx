import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "The primary container component. `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` compose the full anatomy. Use `shadow-sm` for regular cards, `shadow-md` for the main table panel.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
        <CardDescription>April 2026 · All categories</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your finances are on track. Net remaining this month is above average.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline">View details</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatCards: Story = {
  name: "Stat Cards",
  parameters: {
    docs: {
      description: {
        story: "KPI cards used on the dashboard. Each uses a finance semantic color.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: "Total Income",    amount: "£5,167", change: "+3.2%", icon: TrendingUp,   color: "#10b981", bg: "#d1fae5", textColor: "#065f46" },
        { label: "Total Expenses",  amount: "£2,434", change: "+1.1%", icon: TrendingDown, color: "#ec4899", bg: "#fce7f3", textColor: "#9d174d" },
        { label: "Savings",         amount: "£850",   change: "Goal",  icon: PiggyBank,    color: "#6c5ce7", bg: "#ede9fe", textColor: "#4c1d95" },
        { label: "Net Remaining",   amount: "£1,533", change: "↑ avg", icon: Wallet,       color: "#0ea5e9", bg: "#e0f2fe", textColor: "#0c4a6e" },
      ].map(({ label, amount, change, icon: Icon, color, bg, textColor }) => (
        <Card key={label} className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 font-display text-2xl font-bold" style={{ color }}>
                  {amount}
                </p>
              </div>
              <div className="rounded-lg p-2" style={{ background: bg }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            </div>
            <div className="mt-3">
              <Badge
                className="text-[10px]"
                style={{ background: bg, color: textColor, border: "none" }}
              >
                {change}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const WithAccentBorder: Story = {
  name: "Accent Left-Border",
  parameters: {
    docs: {
      description: { story: "Finance cards with a coloured left border — used in lists and summaries." },
    },
  },
  render: () => (
    <div className="flex flex-col gap-3 w-96">
      {[
        { label: "Salary",       sub: "Employment", amount: "£4,200", color: "#10b981" },
        { label: "Freelance",    sub: "Side Income", amount: "£600",  color: "#10b981" },
        { label: "Rent",         sub: "Housing",     amount: "£1,500", color: "#ec4899" },
        { label: "Emergency Fund", sub: "Savings",   amount: "£300",  color: "#6c5ce7" },
      ].map(({ label, sub, amount, color }) => (
        <Card key={label} className="overflow-hidden">
          <div className="flex">
            <div className="w-1 shrink-0" style={{ background: color }} />
            <CardContent className="flex flex-1 items-center justify-between py-3 pl-4 pr-4">
              <div>
                <p className="text-[10px] italic text-muted-foreground">{sub}</p>
                <p className="text-sm font-medium">{label}</p>
              </div>
              <p className="font-display text-sm font-bold" style={{ color }}>{amount}</p>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  ),
};
