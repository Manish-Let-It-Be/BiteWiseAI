import { Wallet } from "lucide-react";

interface Props {
  spent: number;
  budget: number;
}

export function BudgetBar({ spent, budget }: Props) {
  const remaining = Math.max(0, budget - spent);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const remainingPct = 100 - pct;

  const tone =
    remainingPct > 50 ? "bg-sage" :
    remainingPct > 20 ? "bg-warning" :
    "bg-destructive";

  return (
    <div className="bg-card rounded-2xl p-4 border shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Wallet className="h-4 w-4" />
          Monthly food budget
        </div>
        <div className="text-sm font-display font-semibold">
          ₹{remaining.toLocaleString("en-IN")} <span className="text-muted-foreground font-normal">left</span>
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${tone} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>₹{spent.toLocaleString("en-IN")} spent</span>
        <span>of ₹{budget.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
