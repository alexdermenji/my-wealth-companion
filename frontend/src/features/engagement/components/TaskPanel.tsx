import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { EngagementTask, TaskData } from "../types";
import { buildTaskList } from "../taskOrdering";

const DOT_COLOR: Record<string, string> = {
  danger: "bg-expense",
  warning: "bg-warning",
  ok: "bg-success",
};

const TASK_ROUTE: Record<EngagementTask["id"], string> = {
  "transactions": "/transactions",
  "over-budget": "/budget",
  "next-budget": "/budget",
  "net-worth": "/net-worth",
};

interface Props {
  tasks: TaskData;
}

export function TaskPanel({ tasks }: Props) {
  const navigate = useNavigate();
  const taskList = buildTaskList(tasks);
  const doneCount = taskList.filter((t) => t.status === "done").length;
  const total = taskList.length;
  const allDone = doneCount === total;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Today's checklist
        </p>
      </div>

      {/* Task rows */}
      <div className="divide-y divide-border">
        {taskList.map((task) => {
          const isDone = task.status === "done";
          const isTransactions = task.id === "transactions";

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors",
                !isDone && task.severity === "danger" && "bg-destructive/5",
                !isDone && "hover:bg-secondary/50 cursor-pointer",
                isDone && "opacity-50"
              )}
              onClick={() => !isDone && navigate(TASK_ROUTE[task.id])}
            >
              {/* Status dot */}
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  isDone ? "bg-success" : DOT_COLOR[task.severity]
                )}
              />

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold leading-tight",
                  isDone && "line-through text-muted-foreground",
                  !isDone && task.severity === "danger" && "text-expense"
                )}>
                  {task.title}
                </p>
                {!isDone && (
                  <p className={cn(
                    "text-xs mt-0.5 leading-snug",
                    task.severity === "danger" ? "text-expense/80" : "text-muted-foreground"
                  )}>
                    {task.copy}
                  </p>
                )}
                {isDone && (
                  <p className="text-xs mt-0.5 text-muted-foreground">{task.copy}</p>
                )}
              </div>

              {/* CTA */}
              {isDone ? (
                <span className="text-success text-sm flex-shrink-0">✓</span>
              ) : isTransactions ? (
                <button
                  className="text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 rounded px-2 py-1 flex-shrink-0 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/transactions");
                  }}
                >
                  + Add
                </button>
              ) : (
                <span className="text-xs font-semibold text-primary flex-shrink-0">→</span>
              )}
            </div>
          );
        })}

      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>{allDone ? "All done today 🎉" : `${doneCount} of ${total} done`}</span>
          <span className="font-semibold text-primary">{Math.round((doneCount / total) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(doneCount / total) * 100}%`,
              background: allDone
                ? "hsl(var(--success))"
                : "linear-gradient(90deg, hsl(var(--primary)), #a78bfa)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
