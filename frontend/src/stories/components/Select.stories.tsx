import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const meta: Meta = {
  title: "Components/Select",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Radix UI Select with Pearl styling. Used for currency, month, category type, and group pickers throughout the app.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="income">Income</SelectItem>
        <SelectItem value="expenses">Expenses</SelectItem>
        <SelectItem value="savings">Savings</SelectItem>
        <SelectItem value="debt">Liabilities</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  name: "With Label",
  render: () => (
    <div className="flex flex-col gap-1.5 w-56">
      <Label>Category type</Label>
      <Select defaultValue="income">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expenses">Expenses</SelectItem>
          <SelectItem value="savings">Savings</SelectItem>
          <SelectItem value="debt">Liabilities</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroups: Story = {
  name: "Grouped Options",
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Income</SelectLabel>
          <SelectItem value="salary">Salary</SelectItem>
          <SelectItem value="freelance">Freelance</SelectItem>
          <SelectItem value="dividends">Dividends</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Expenses</SelectLabel>
          <SelectItem value="rent">Rent</SelectItem>
          <SelectItem value="groceries">Groceries</SelectItem>
          <SelectItem value="transport">Transport</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Savings</SelectLabel>
          <SelectItem value="emergency">Emergency Fund</SelectItem>
          <SelectItem value="holiday">Holiday</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const CurrencyPicker: Story = {
  name: "Currency Picker",
  render: () => (
    <div className="flex flex-col gap-1.5 w-40">
      <Label>Currency</Label>
      <Select defaultValue="gbp">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[
            { value: "gbp", label: "£ GBP" },
            { value: "usd", label: "$ USD" },
            { value: "eur", label: "€ EUR" },
            { value: "rub", label: "₽ RUB" },
          ].map(({ value, label }) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
};
