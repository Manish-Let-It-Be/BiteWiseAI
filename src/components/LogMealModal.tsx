import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Dish } from "@/lib/queries";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  dish: Dish | null;
  userId: string;
  onLogged: () => void;
}

export function LogMealModal({ open, onOpenChange, dish, userId, onLogged }: Props) {
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);

  if (!dish) return null;

  const handleLog = async () => {
    setSaving(true);
    const { error } = await supabase.from("meal_logs").insert({
      user_id: userId,
      dish_id: dish.id,
      dish_name: dish.name,
      price: dish.price,
      calories: dish.calories,
      type: dish.type,
      mood_at_time: mood.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Logged ${dish.name}`);
    setMood("");
    onLogged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Log this meal?</DialogTitle>
          <DialogDescription>Adds to today's calories and your monthly spend.</DialogDescription>
        </DialogHeader>
        <div className="bg-muted rounded-xl p-4">
          <div className="font-display font-semibold">{dish.name}</div>
          {dish.place_name && <div className="text-xs text-muted-foreground">{dish.place_name}</div>}
          <div className="mt-2 text-sm">
            <span className="font-semibold">₹{Number(dish.price)}</span> · {dish.calories} kcal
          </div>
        </div>
        <div>
          <Label htmlFor="mood">How are you feeling? (optional)</Label>
          <Input id="mood" value={mood} onChange={e => setMood(e.target.value)} placeholder="craving spicy, stressed..." />
        </div>
        <Button onClick={handleLog} disabled={saving}>
          {saving ? "Logging..." : "Log meal"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
