import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { fetchProfile } from "@/lib/queries";
import { aiMealPlan } from "@/lib/ai.functions";
import { calcBMR, calcTDEE, dailyBudget, type Gender, type Activity } from "@/lib/health";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planner")({ component: PlannerPage });

type Meal = { type: string; name: string; calories: number; price: number; protein_g: number; notes: string };
type Day = { day: string; meals: Meal[]; total_calories: number; total_price: number };
type Plan = { days: Day[] };

function PlannerPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const profileQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });
  const planFn = useServerFn(aiMealPlan);

  const [range, setRange] = useState<"daily" | "weekly">("daily");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const p = profileQ.data;
  const bmr = calcBMR(Number(p?.weight_kg ?? 0), Number(p?.height_cm ?? 0), Number(p?.age ?? 0), (p?.gender as Gender) ?? "male");
  const tdee = calcTDEE(bmr, (p?.activity_level as Activity) ?? "light");
  const targetCal = tdee || Number(p?.daily_calorie_target ?? 2000);
  const dayBudget = dailyBudget(Number(p?.monthly_budget ?? 3000));

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const res = await planFn({ data: {
        range,
        budget: dayBudget,
        targetCal,
        goal: p?.fitness_goal ?? "maintain",
        diet: p?.dietary_preference ?? "vegetarian",
      }});
      setPlan(res as Plan);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">AI Meal Planner</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalized Indian meal plans optimized for your budget & goals
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-secondary p-1">
          {(["daily", "weekly"] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {r === "daily" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[260px] flex flex-wrap gap-4 text-sm bg-card border rounded-full px-4 py-2">
          <span className="text-muted-foreground">Daily Budget: <b className="text-foreground">₹{dayBudget}</b></span>
          <span className="text-muted-foreground">Target Cal: <b className="text-foreground">{targetCal}</b></span>
          <span className="text-muted-foreground">Goal: <b className="text-foreground capitalize">{p?.fitness_goal ?? "—"}</b></span>
          <span className="text-muted-foreground">Diet: <b className="text-foreground capitalize">{p?.dietary_preference ?? "—"}</b></span>
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate
        </Button>
      </div>

      {!plan && !loading && (
        <div className="text-center py-20 bg-card border rounded-2xl">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="text-muted-foreground">Click Generate to create your personalized plan</p>
        </div>
      )}
      {loading && (
        <div className="text-center py-20 bg-card border rounded-2xl">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground mt-3">Crafting your plan...</p>
        </div>
      )}

      {plan && (
        <div className="space-y-4">
          {plan.days?.map((d, i) => (
            <div key={i} className="bg-card rounded-2xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xl font-bold">{d.day}</h3>
                <div className="text-sm text-muted-foreground">
                  <b className="text-foreground">{d.total_calories} kcal</b> · <b className="text-foreground">₹{d.total_price}</b>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {d.meals?.map((m, j) => (
                  <div key={j} className="bg-muted/50 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-primary">{m.type}</div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m.notes}</div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span>{m.calories} kcal</span>
                      <span className="text-amber-700">₹{m.price}</span>
                      <span className="text-emerald-700">{m.protein_g}g protein</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
