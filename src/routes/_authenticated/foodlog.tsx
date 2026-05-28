import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FoodLogModal } from "@/components/FoodLogModal";
import { useAuth } from "@/lib/useAuth";
import { fetchProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { dailyBudget } from "@/lib/health";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/foodlog")({ component: FoodLogPage });

function FoodLogPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [open, setOpen] = useState(false);

  const profileQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });

  const logsQ = useQuery({
    queryKey: ["foodlog", userId, date],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", date)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = useMemo(() => {
    const list = logsQ.data ?? [];
    return {
      calories: list.reduce((s, l) => s + Number(l.calories ?? 0), 0),
      price: list.reduce((s, l) => s + Number(l.price ?? 0), 0),
      count: list.length,
    };
  }, [logsQ.data]);

  const dayBudget = dailyBudget(Number(profileQ.data?.monthly_budget ?? 3000));
  const calTarget = Number(profileQ.data?.daily_calorie_target ?? 2000);
  const calRemaining = Math.max(0, calTarget - totals.calories);

  const grouped = useMemo(() => {
    const g: Record<string, typeof logsQ.data> = {};
    (logsQ.data ?? []).forEach(l => {
      const k = (l as any).meal_type ?? "other";
      g[k] = [...(g[k] ?? []), l];
    });
    return g;
  }, [logsQ.data]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this log?")) return;
    await supabase.from("meal_logs").delete().eq("id", id);
    logsQ.refetch();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">📸 Food Snap Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Click a photo of what you ate → AI analyzes nutrition → Log it with price
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Log Food
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border rounded-2xl p-4">
          <Label htmlFor="dt" className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</Label>
          <Input id="dt" type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
        </div>
        <Stat label="Calories today" value={`${totals.calories}`} suffix="kcal" tone="text-emerald-600" />
        <Stat label="Spent today" value={`₹${totals.price}`} suffix={`/ ₹${dayBudget}`} tone={totals.price > dayBudget ? "text-rose-500" : "text-amber-600"} />
        <Stat label="Meals logged" value={`${totals.count}`} suffix="items" tone="text-blue-600" />
        <Stat label="Cal remaining" value={`${calRemaining}`} suffix="kcal left" tone="text-purple-600" />
      </div>

      {logsQ.isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : (logsQ.data ?? []).length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-2xl">
          <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No meals logged for this day yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([type, items]) => {
            const list = items ?? [];
            const cal = list.reduce((s, l) => s + Number(l.calories ?? 0), 0);
            const pr = list.reduce((s, l) => s + Number(l.price ?? 0), 0);
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{type}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{list.length} items</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">₹{pr}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{cal} kcal</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map(l => (
                    <div key={l.id} className="bg-card border rounded-2xl overflow-hidden">
                      <div className="aspect-video bg-muted grid place-items-center text-3xl">🍽️</div>
                      <div className="p-3">
                        <div className="font-semibold truncate">{l.dish_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(l.logged_at as any), "hh:mm a")}
                        </div>
                        <div className="flex gap-2 mt-2 items-center">
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">₹{Number(l.price)}</span>
                          {Number(l.calories) > 0 && (
                            <span className="text-xs text-muted-foreground">{l.calories} kcal</span>
                          )}
                          <button
                            onClick={() => handleDelete(l.id)}
                            className="ml-auto text-[10px] text-rose-500 hover:underline"
                          >
                            delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <FoodLogModal open={open} onOpenChange={setOpen} userId={userId} onLogged={() => logsQ.refetch()} />
    </div>
  );
}

function Stat({ label, value, suffix, tone }: { label: string; value: string; suffix: string; tone: string }) {
  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${tone}`}>{value} <span className="text-xs text-muted-foreground font-normal">{suffix}</span></div>
    </div>
  );
}
