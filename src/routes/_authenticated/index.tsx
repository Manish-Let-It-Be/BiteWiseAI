import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import {
  fetchProfile, fetchDishes, fetchTodayLogs, fetchMonthLogs,
  sumCalories, sumPrice, type Dish,
} from "@/lib/queries";
import { BudgetBar } from "@/components/BudgetBar";
import { CalorieBar } from "@/components/CalorieBar";
import { DishCard } from "@/components/DishCard";
import { LogMealModal } from "@/components/LogMealModal";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({ component: HomePage });

const MOODS = [
  "Spicy craving", "Want something light", "Feeling unhealthy",
  "Treat myself", "Quick & cheap", "Surprise me",
];

function HomePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [logTarget, setLogTarget] = useState<Dish | null>(null);

  const profileQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });
  const dishesQ = useQuery({ queryKey: ["dishes"], queryFn: fetchDishes, enabled: !!userId });
  const todayQ = useQuery({ queryKey: ["logs-today", userId], queryFn: () => fetchTodayLogs(userId), enabled: !!userId });
  const monthQ = useQuery({ queryKey: ["logs-month", userId], queryFn: () => fetchMonthLogs(userId), enabled: !!userId });

  const profile = profileQ.data;
  const spentMonth = sumPrice(monthQ.data ?? []);
  const calToday = sumCalories(todayQ.data ?? []);
  const dishes = dishesQ.data ?? [];
  const suggested = dishes.slice(0, 6);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const name = profile?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl font-bold">
          {greeting}, {name}.
        </h1>
        <p className="text-muted-foreground mt-1">What are we eating today?</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <BudgetBar
          spent={spentMonth}
          budget={Number(profile?.monthly_budget ?? 3000)}
        />
        <CalorieBar
          consumed={calToday}
          target={Number(profile?.daily_calorie_target ?? 2000)}
        />
      </div>

      <section className="bg-card rounded-3xl p-5 sm:p-6 border shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-widest font-semibold text-primary">Mood engine</span>
        </div>
        <h2 className="font-display text-xl font-bold mb-1">How are you feeling?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          AI recommendations are coming soon. For now, pick a mood for inspiration and browse your library.
        </p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button
              key={m}
              className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> From your library
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dishes">All dishes <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
        {dishesQ.isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : suggested.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No dishes yet. <Link to="/dishes" className="text-primary underline">Add your first dish 🍛</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggested.map(d => (
              <DishCard key={d.id} dish={d} onLog={setLogTarget} />
            ))}
          </div>
        )}
      </section>

      {todayQ.data && todayQ.data.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold mb-3">Today so far</h2>
          <ul className="bg-card rounded-2xl border divide-y">
            {todayQ.data.map(l => (
              <li key={l.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.dish_name}</div>
                  {l.mood_at_time && <div className="text-xs text-muted-foreground italic truncate">"{l.mood_at_time}"</div>}
                </div>
                <div className="text-sm text-right shrink-0 ml-3">
                  <div className="font-semibold">₹{Number(l.price)}</div>
                  <div className="text-xs text-muted-foreground">{l.calories} kcal</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <LogMealModal
        open={!!logTarget}
        onOpenChange={(o) => !o && setLogTarget(null)}
        dish={logTarget}
        userId={userId}
        onLogged={() => { todayQ.refetch(); monthQ.refetch(); }}
      />
    </div>
  );
}
