import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, AlertCircle, CheckCircle } from "lucide-react";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Text input built on the native `<input>` element. Focus ring uses `--ring` (Pearl primary). Pairs with `Label` for accessible forms.",
      },
    },
  },
  argTypes: {
    placeholder: { control: "text" },
    disabled:    { control: "boolean" },
    type:        { control: "select", options: ["text", "email", "password", "number", "search"] },
  },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter value…" },
};

export const WithLabel: Story = {
  name: "With Label",
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <Label htmlFor="amount">Monthly budget</Label>
      <Input id="amount" type="number" placeholder="0.00" />
    </div>
  ),
};

export const States: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <div className="flex flex-col gap-1.5">
        <Label>Default</Label>
        <Input placeholder="Enter amount" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Filled</Label>
        <Input defaultValue="4200" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Disabled</Label>
        <Input placeholder="Not editable" disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Error state</Label>
        <div className="relative">
          <Input
            className="border-[#ec4899] pr-9 focus-visible:ring-[#ec4899]"
            defaultValue="abc"
          />
          <AlertCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-[#ec4899]" />
        </div>
        <p className="text-xs text-[#ec4899]">Please enter a valid number</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Success state</Label>
        <div className="relative">
          <Input
            className="border-[#10b981] pr-9 focus-visible:ring-[#10b981]"
            defaultValue="1500"
          />
          <CheckCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-[#10b981]" />
        </div>
      </div>
    </div>
  ),
};

export const WithIcon: Story = {
  name: "With Icon",
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search transactions…" />
      </div>
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">£</span>
        <Input className="pl-7" type="number" placeholder="0.00" />
      </div>
    </div>
  ),
};

export const BudgetCell: Story = {
  name: "Budget Table Cell",
  parameters: {
    docs: {
      description: {
        story: "The inline input used inside budget table cells — transparent background, right-aligned.",
      },
    },
  },
  render: () => (
    <div className="rounded-xl border border-[#dde3f0] bg-white p-4">
      <table className="w-full">
        <thead>
          <tr>
            <th className="pb-2 text-left font-display text-xs font-bold uppercase tracking-wider text-[#7a849e]">Category</th>
            <th className="pb-2 text-center font-display text-xs font-bold uppercase tracking-wider text-[#7a849e]">Jan</th>
            <th className="pb-2 text-center font-display text-xs font-bold uppercase tracking-wider text-[#7a849e]">Feb</th>
            <th className="pb-2 text-center font-display text-xs font-bold uppercase tracking-wider text-[#7a849e]">Mar</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Salary",  vals: ["4200", "4200", "4200"] },
            { name: "Bonus",   vals: ["",     "",     ""]     },
            { name: "Freelance", vals: ["600", "800", "500"] },
          ].map(({ name, vals }) => (
            <tr key={name} className="border-t border-[#dde3f0]">
              <td className="py-2 pr-4 text-sm font-medium text-[#1a1f35]">{name}</td>
              {vals.map((v, i) => (
                <td key={i} className="py-1 px-1">
                  <Input
                    className="w-24 border-transparent bg-transparent text-right text-sm focus-visible:border-[#dde3f0] focus-visible:ring-[#6c5ce7]"
                    defaultValue={v}
                    placeholder="—"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
