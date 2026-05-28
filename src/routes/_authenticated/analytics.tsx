import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, Cell, LabelList,
} from "recharts";
import { useAuth } from "@/lib/useAuth";
import { fetchProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { calcBMI, bmiLabel, dailyBudget } from "@/lib/health";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const profileQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });

  const weekStart = subDays(new Date(), 6);
  const logsQ = useQuery({
    queryKey: ["analytics-week", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", format(weekStart, "yyyy-MM-dd"))
        .order("logged_at", { ascending: false });
      return data ?? [];
    },
  });

  const p = profileQ.data;
  const target = Number(p?.daily_calorie_target ?? 2000);
  const dayBudget = dailyBudget(Number(p?.monthly_budget ?? 3000));
  const bmi = calcBMI(Number(p?.weight_kg ?? 0), Number(p?.height_cm ?? 0));

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, "yyyy-MM-dd");
      const list = (logsQ.data ?? []).filter((l: any) => l.log_date === key);
      const cal = list.reduce((s, l: any) => s + Number(l.calories ?? 0), 0);
      const pr = list.reduce((s, l: any) => s + Number(l.price ?? 0), 0);
      const pro = list.reduce((s, l: any) => s + Number(l.protein_g ?? 0), 0);
      return { day: format(d, "EEE"), key, cal, pr, pro };
    });
  }, [logsQ.data]);

  const totalSpent = days.reduce((s, d) => s + d.pr, 0);
  const totalCal = days.reduce((s, d) => s + d.cal, 0);
  const totalPro = days.reduce((s, d) => s + d.pro, 0);
  const meals = logsQ.data?.length ?? 0;
  const avgCal = meals ? Math.round(totalCal / 7) : 0;
  const avgPro = meals ? Math.round(totalPro / 7) : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Nutrition Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Weekly nutrition & spending overview — powered by your food log data
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat label="Avg daily calories" value={`${avgCal}`} suffix="kcal" tone="text-amber-600" />
        <Stat label="Weekly spend" value={`₹${totalSpent}`} suffix="" tone="text-rose-500" />
        <Stat label="Avg protein" value={`${avgPro}g`} suffix="" tone="text-blue-600" />
        <Stat label="BMI" value={`${bmi || "—"}`} suffix={bmiLabel(bmi)} tone="text-emerald-600" />
        <Stat label="Meals logged" value={`${meals}`} suffix="total" tone="text-purple-600" />
      </div>

      <section className="bg-card border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Weekly calories vs target</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">FROM LOGS</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={days} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
            <YAxis hide />
            <Tooltip />
            <ReferenceLine y={target} stroke="var(--primary)" strokeDasharray="4 4" />
            <Bar dataKey="cal" radius={[6, 6, 0, 0]}>
              {days.map((d, i) => (
                <Cell key={i} fill={d.cal > target ? "var(--destructive)" : "var(--primary)"} />
              ))}
              <LabelList dataKey="cal" position="top" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-muted-foreground mt-2 flex gap-3">
          <span>▮ Actual</span><span>--- Target ({target})</span>
        </div>
      </section>

      <section className="bg-card border rounded-2xl p-5">
        <h2 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
          Daily spend vs budget (₹{dayBudget}/day)
        </h2>
        <div className="space-y-3">
          {days.map(d => {
            const pct = Math.min(100, (d.pr / Math.max(1, dayBudget)) * 100);
            const over = d.pr > dayBudget;
            return (
              <div key={d.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{d.day}</span>
                  <span className={over ? "text-rose-500" : "text-emerald-600"}>₹{d.pr} / ₹{dayBudget}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${over ? "bg-rose-400" : "bg-emerald-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-card border rounded-2xl p-5">
        <h2 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
          Protein intake (g/day)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={days} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="pro" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="pro" position="top" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {(logsQ.data ?? []).length > 0 && (
        <section className="bg-card border rounded-2xl p-5">
          <h2 className="font-display font-bold mb-3">📸 Recent food log summary</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(logsQ.data ?? []).slice(0, 6).map((l: any) => (
              <div key={l.id} className="border rounded-xl p-3">
                <div className="font-semibold truncate">{l.dish_name}</div>
                <div className="flex justify-between text-sm mt-1">
                  <span>{l.calories} kcal</span>
                  <span className="text-amber-700">₹{Number(l.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, suffix, tone }: { label: string; value: string; suffix: string; tone: string }) {
  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${tone}`}>
        {value} {suffix && <span className="text-xs text-muted-foreground font-normal">{suffix}</span>}
      </div>
    </div>
  );
}
