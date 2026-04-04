import type { Meta, StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

const meta: Meta = {
  title: "Components/Dialog",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Radix UI Dialog modal. Used for confirmations, forms, and alerts. The Pearl variant uses `shadow-lg` and `rounded-2xl`.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const Confirmation: Story = {
  name: "Confirmation Dialog",
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive"><Trash2 className="mr-1 h-4 w-4" /> Delete Category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "Eating Out"?</DialogTitle>
          <DialogDescription>
            This will permanently remove the category and all its budget data.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const AddCategory: Story = {
  name: "Add Category Form",
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> Add Category</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new budget category. It will appear in your annual budget plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="e.g. Groceries" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select defaultValue="expenses">
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
          <div className="flex flex-col gap-1.5">
            <Label>Group (optional)</Label>
            <Input placeholder="e.g. Food" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
