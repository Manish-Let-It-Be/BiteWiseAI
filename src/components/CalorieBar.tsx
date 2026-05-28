import { Flame } from "lucide-react";

interface Props {
  consumed: number;
  target: number;
}

export function CalorieBar({ consumed, target }: Props) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const over = consumed > target;

  return (
    <div className="bg-card rounded-2xl p-4 border shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Flame className="h-4 w-4" />
          Today's calories
        </div>
        <div className="text-sm font-display font-semibold">
          {consumed.toLocaleString()} <span className="text-muted-foreground font-normal">/ {target.toLocaleString()} kcal</span>
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-[width] duration-500 ${over ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">
        {over
          ? `Over by ${(consumed - target).toLocaleString()} kcal`
          : `${(target - consumed).toLocaleString()} kcal remaining`}
      </div>
    </div>
  );
}
