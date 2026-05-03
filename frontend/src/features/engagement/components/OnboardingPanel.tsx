import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { TaskData } from "../types";

interface Props {
  tasks: TaskData;
  onAddTransaction: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  cta: string;
  onAction: () => void;
}

export function OnboardingPanel({ tasks, onAddTransaction }: Props) {
  const navigate = useNavigate();

  const steps: OnboardingStep[] = [
    {
      id: "transaction",
      title: "Log your first transaction",
      description: "Start tracking your spending to build your streak.",
      done: tasks.daysSinceLastTransaction !== null,
      cta: "+ Add",
      onAction: onAddTransaction,
    },
    {
      id: "budget",
      title: "Set up your budget",
      description: "Plan your income, expenses and savings for the month.",
      done: tasks.nextMonthBudgetFilled,
      cta: "Set up →",
      onAction: () => navigate("/budget"),
    },
    {
      id: "net-worth",
      title: "Track your net worth",
      description: "Add your assets and liabilities to see the full picture.",
      done: tasks.currentMonthNetWorthFilled,
      cta: "Add →",
      onAction: () => navigate("/net-worth"),
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone = doneCount === steps.length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Getting started
        </p>
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              step.done && "opacity-50"
            )}
          >
            {/* Check circle */}
            <div
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                step.done
                  ? "bg-success border-success"
                  : "border-border"
              )}
            >
              {step.done && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-semibold leading-tight",
                step.done && "line-through text-muted-foreground"
              )}>
                {step.title}
              </p>
              {!step.done && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {step.description}
                </p>
              )}
            </div>

            {/* CTA */}
            {step.done ? (
              <span className="text-success text-sm flex-shrink-0">✓</span>
            ) : (
              <button
                onClick={step.onAction}
                className="text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 rounded px-2 py-1 flex-shrink-0 transition-colors cursor-pointer"
              >
                {step.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>{allDone ? "All set — you're ready! 🎉" : `${doneCount} of ${steps.length} completed`}</span>
          <span className="font-semibold text-primary">{Math.round((doneCount / steps.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(doneCount / steps.length) * 100}%`,
              background: allDone
                ? "hsl(var(--success))"
                : "linear-gradient(90deg, hsl(var(--primary)), #a78bfa)",
            }}
          />
        </div>
      </div>

      {/* Milestone prompt — shown only when all steps are done */}
      {allDone && (
        <button
          onClick={() => navigate("/timeline")}
          className="w-full flex items-center justify-between px-4 py-3 border-t border-border hover:bg-secondary/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg leading-none">🎯</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Set your first financial goal</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add a milestone to your timeline</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      )}
    </div>
  );
}
