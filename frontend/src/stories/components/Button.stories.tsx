import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Trash2, ArrowRight } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "The primary interactive element. Built on Radix UI Slot with CVA variants. Supports `variant`, `size`, `asChild`, and all native button props.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "Visual style of the button",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
      description: "Height and padding preset",
    },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: "Save changes", variant: "default" },
};

export const Variants: Story = {
  name: "All Variants",
  parameters: {
    docs: {
      description: { story: "Every visual variant in the Pearl palette." },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  name: "All Sizes",
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <Button size="lg">Large</Button>
      <Button size="default">Default</Button>
      <Button size="sm">Small</Button>
      <Button size="icon"><Plus /></Button>
    </div>
  ),
};

export const WithIcons: Story = {
  name: "With Icons",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button><Plus className="mr-1 h-4 w-4" /> Add Category</Button>
      <Button variant="outline"><Download className="mr-1 h-4 w-4" /> Export</Button>
      <Button variant="destructive"><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
      <Button variant="ghost">Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
    </div>
  ),
};

export const States: Story = {
  name: "Disabled States",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Primary disabled</Button>
      <Button variant="outline" disabled>Outline disabled</Button>
      <Button variant="secondary" disabled>Secondary disabled</Button>
    </div>
  ),
};

export const FinanceActions: Story = {
  name: "Finance Actions",
  parameters: {
    docs: {
      description: { story: "Common button patterns used throughout the finance UI." },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button className="bg-[#10b981] hover:bg-[#059669] text-white">
        <Plus className="mr-1 h-4 w-4" /> Add Income
      </Button>
      <Button className="bg-[#ec4899] hover:bg-[#db2777] text-white">
        <Plus className="mr-1 h-4 w-4" /> Add Expense
      </Button>
      <Button className="bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white">
        <Plus className="mr-1 h-4 w-4" /> Add Saving Goal
      </Button>
      <Button variant="outline" size="sm">+ Add category</Button>
    </div>
  ),
};
