import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Small labels for status, categorisation, and tagging. The base shadcn variants are extended with finance-specific color tokens.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
    children: { control: "text" },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "Badge", variant: "default" },
};

export const Variants: Story = {
  name: "Base Variants",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const FinanceBadges: Story = {
  name: "Finance Semantic",
  parameters: {
    docs: {
      description: {
        story: "Custom badges using Pearl finance color tokens for budget categories.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-[#d1fae5] text-[#065f46] border-[#a7f3d0] hover:bg-[#d1fae5]">
        Income
      </Badge>
      <Badge className="bg-[#fce7f3] text-[#9d174d] border-[#fbcfe8] hover:bg-[#fce7f3]">
        Expense
      </Badge>
      <Badge className="bg-[#ede9fe] text-[#4c1d95] border-[#ddd6fe] hover:bg-[#ede9fe]">
        Savings
      </Badge>
      <Badge className="bg-[#e0f2fe] text-[#0c4a6e] border-[#bae6fd] hover:bg-[#e0f2fe]">
        Liabilities
      </Badge>
      <Badge className="bg-[#fef9c3] text-[#854d0e] border-[#fde68a] hover:bg-[#fef9c3]">
        Warning
      </Badge>
    </div>
  ),
};

export const PriorityBadges: Story = {
  name: "Effort / Priority",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-[#d1fae5] text-[#065f46] border-transparent hover:bg-[#d1fae5]">Low effort</Badge>
      <Badge className="bg-[#fef9c3] text-[#854d0e] border-transparent hover:bg-[#fef9c3]">Medium</Badge>
      <Badge className="bg-[#fce7f3] text-[#9d174d] border-transparent hover:bg-[#fce7f3]">High effort</Badge>
    </div>
  ),
};
