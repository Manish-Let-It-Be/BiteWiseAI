import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Zap, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { fetchProfile } from "@/lib/queries";
import { aiBudgetOptimize } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/budget")({ component: BudgetPage });

type Result = {
  swaps: { instead_of: string; swap_to: string; saves: number; why: string }[];
  bulk_buys: { item: string; qty: string; price: number; lasts: string }[];
  weekly_template: { meal: string; items: string; cost: number }[];
  tips: string[];
};

function BudgetPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const profileQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });

  const [budget, setBudget] = useState("2500");
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const fn = useServerFn(aiBudgetOptimize);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await fn({ data: {
        budget: Number(budget),
        days: Number(days),
        diet: profileQ.data?.dietary_preference ?? "vegetarian",
      }});
      setResult(r as Result);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Budget Optimizer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Maximize nutrition per rupee — smart swaps, bulk buys, and optimized templates
        </p>
      </header>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label htmlFor="b">Budget (₹)</Label>
          <Input id="b" type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-32" />
        </div>
        <div>
          <Label htmlFor="d">Days</Label>
          <select
            id="d"
            value={days}
            onChange={e => setDays(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm w-32"
          >
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
          Optimize
        </Button>
      </div>

      {!result && !loading && (
        <div className="text-center py-20 bg-card border rounded-2xl">
          <div className="text-5xl mb-3">💸</div>
          <p className="text-muted-foreground">Enter your budget and click Optimize</p>
        </div>
      )}
      {loading && (
        <div className="text-center py-20 bg-card border rounded-2xl">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
        </div>
      )}

      {result && (
        <div className="grid lg:grid-cols-2 gap-4">
          <section className="bg-card border rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-3">🔄 Smart swaps</h2>
            <ul className="space-y-3">
              {result.swaps?.map((s, i) => (
                <li key={i} className="text-sm border-b pb-3 last:border-0">
                  <div><b>{s.instead_of}</b> → <b className="text-primary">{s.swap_to}</b></div>
                  <div className="text-xs text-muted-foreground mt-1">{s.why}</div>
                  <div className="text-xs text-emerald-700 mt-1">Saves ₹{s.saves}</div>
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-card border rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-3">🛒 Bulk buys</h2>
            <ul className="space-y-3">
              {result.bulk_buys?.map((b, i) => (
                <li key={i} className="text-sm border-b pb-3 last:border-0">
                  <div className="flex justify-between"><b>{b.item}</b><span className="text-amber-700">₹{b.price}</span></div>
                  <div className="text-xs text-muted-foreground">{b.qty} · lasts {b.lasts}</div>
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-card border rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-3">📋 Weekly template</h2>
            <ul className="space-y-2">
              {result.weekly_template?.map((w, i) => (
                <li key={i} className="text-sm flex justify-between border-b pb-2 last:border-0">
                  <div><b className="capitalize">{w.meal}:</b> {w.items}</div>
                  <span className="text-amber-700">₹{w.cost}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-card border rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-3">💡 Tips</h2>
            <ul className="space-y-2 text-sm list-disc pl-5">
              {result.tips?.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
