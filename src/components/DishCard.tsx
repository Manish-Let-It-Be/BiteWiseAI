import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Dish } from "@/lib/queries";

const TYPE_EMOJI = { healthy: "🥗", moderate: "🍛", indulgent: "🍟" } as const;
const TYPE_STYLE = {
  healthy: "bg-sage/15 text-sage border-sage/30",
  moderate: "bg-secondary text-secondary-foreground border-secondary",
  indulgent: "bg-primary/10 text-primary border-primary/30",
} as const;

interface Props {
  dish: Dish;
  onLog?: (d: Dish) => void;
  onEdit?: (d: Dish) => void;
  onDelete?: (d: Dish) => void;
  ownedByUser?: boolean;
}

export function DishCard({ dish, onLog, onEdit, onDelete, ownedByUser }: Props) {
  return (
    <div className="group bg-card rounded-2xl border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden>{TYPE_EMOJI[dish.type]}</span>
            <div className="min-w-0">
              <h3 className="font-display font-semibold truncate">{dish.name}</h3>
              {dish.place_name && (
                <p className="text-xs text-muted-foreground truncate">{dish.place_name}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={`${TYPE_STYLE[dish.type]} text-[10px] uppercase tracking-wider shrink-0`}>
            {dish.type}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-3 text-sm">
          <span className="font-display font-bold text-lg">₹{Number(dish.price)}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{dish.calories} kcal</span>
        </div>

        {dish.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {dish.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          {onLog && (
            <Button size="sm" className="flex-1" onClick={() => onLog(dish)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Log meal
            </Button>
          )}
          {ownedByUser && onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(dish)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {ownedByUser && onDelete && (
            <Button size="sm" variant="outline" onClick={() => onDelete(dish)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
