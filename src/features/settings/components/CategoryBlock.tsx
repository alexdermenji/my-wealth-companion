import { BudgetType, BudgetCategory } from '@/shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil } from 'lucide-react';

const TYPE_COLORS: Record<BudgetType, string> = {
  Income: 'text-income',
  Expenses: 'text-expense',
  Savings: 'text-savings',
  Debt: 'text-debt',
};

const TYPE_BG: Record<BudgetType, string> = {
  Income: 'bg-green-500/10 border-green-500/30',
  Expenses: 'bg-red-500/10 border-red-500/30',
  Savings: 'bg-blue-500/10 border-blue-500/30',
  Debt: 'bg-purple-500/10 border-purple-500/30',
};

interface CategoryBlockProps {
  type: BudgetType;
  categories: BudgetCategory[];
  onAdd: () => void;
  onEdit: (cat: BudgetCategory) => void;
  onDelete: (cat: BudgetCategory) => void;
}

export function CategoryBlock({
  type,
  categories,
  onAdd,
  onEdit,
  onDelete,
}: CategoryBlockProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className={`flex flex-row items-center justify-between border-b ${TYPE_BG[type]}`}>
        <CardTitle className={`font-display text-sm ${TYPE_COLORS[type]}`}>
          {type} Categories
        </CardTitle>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No categories yet</p>
        ) : (
          <div className="divide-y">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between px-3 py-2 group">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  {cat.group && (
                    <p className="text-xs text-muted-foreground truncate">{cat.groupEmoji ? `${cat.groupEmoji} ${cat.group}` : cat.group}</p>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(cat)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(cat)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
