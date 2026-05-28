import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { fetchProfile } from "@/lib/queries";
import { calcBMR, calcTDEE, calcBMI, bmiLabel, dailyBudget, type Gender, type Activity } from "@/lib/health";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function Select({ value, onChange, options, id }: {
  value: string; onChange: (v: string) => void; options: { v: string; l: string }[]; id: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
    >
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const q = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });

  const [form, setForm] = useState({
    name: "", age: "21", weight_kg: "65", height_cm: "170",
    gender: "male", activity_level: "light", fitness_goal: "maintain",
    dietary_preference: "vegetarian", monthly_budget: "3000",
    daily_calorie_target: "2000", city: "", allergies: "", lifestyle: "hostel_student",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q.data) {
      const d = q.data as any;
      setForm({
        name: d.name ?? "",
        age: String(d.age ?? 21),
        weight_kg: String(d.weight_kg ?? 65),
        height_cm: String(d.height_cm ?? 170),
        gender: d.gender ?? "male",
        activity_level: d.activity_level ?? "light",
        fitness_goal: d.fitness_goal ?? "maintain",
        dietary_preference: d.dietary_preference ?? "vegetarian",
        monthly_budget: String(d.monthly_budget ?? 3000),
        daily_calorie_target: String(d.daily_calorie_target ?? 2000),
        city: d.city ?? "",
        allergies: d.allergies ?? "",
        lifestyle: d.lifestyle ?? "hostel_student",
      });
    }
  }, [q.data]);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement> | string) =>
    setForm(f => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));

  const bmr = calcBMR(Number(form.weight_kg), Number(form.height_cm), Number(form.age), form.gender as Gender);
  const tdee = calcTDEE(bmr, form.activity_level as Activity);
  const bmi = calcBMI(Number(form.weight_kg), Number(form.height_cm));
  const dayBudget = dailyBudget(Number(form.monthly_budget));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name.trim() || null,
      age: Number(form.age) || null,
      weight_kg: Number(form.weight_kg) || null,
      height_cm: Number(form.height_cm) || null,
      gender: form.gender,
      activity_level: form.activity_level,
      fitness_goal: form.fitness_goal,
      dietary_preference: form.dietary_preference,
      monthly_budget: Number(form.monthly_budget),
      daily_calorie_target: tdee || Number(form.daily_calorie_target),
      city: form.city.trim() || null,
      allergies: form.allergies.trim() || null,
      lifestyle: form.lifestyle,
    }).eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    q.refetch();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill your details — BiteWise AI personalizes everything around you
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="n">Full name</Label>
            <Input id="n" value={form.name} onChange={upd("name")} placeholder="e.g. Ravi Sharma" />
          </div>
          <div>
            <Label htmlFor="a">Age</Label>
            <Input id="a" type="number" value={form.age} onChange={upd("age")} />
          </div>
          <div>
            <Label htmlFor="w">Weight (kg)</Label>
            <Input id="w" type="number" step="0.1" value={form.weight_kg} onChange={upd("weight_kg")} />
          </div>
          <div>
            <Label htmlFor="h">Height (cm)</Label>
            <Input id="h" type="number" value={form.height_cm} onChange={upd("height_cm")} />
          </div>
          <div>
            <Label htmlFor="g">Gender</Label>
            <Select id="g" value={form.gender} onChange={upd("gender")} options={[
              { v: "male", l: "Male" }, { v: "female", l: "Female" }, { v: "other", l: "Other" },
            ]} />
          </div>
          <div>
            <Label htmlFor="al">Activity level</Label>
            <Select id="al" value={form.activity_level} onChange={upd("activity_level")} options={[
              { v: "sedentary", l: "Sedentary (desk job)" },
              { v: "light", l: "Light (1-3 days/wk)" },
              { v: "moderate", l: "Moderate (3-5 days/wk)" },
              { v: "active", l: "Active (6-7 days/wk)" },
              { v: "very_active", l: "Very active (athlete)" },
            ]} />
          </div>
          <div>
            <Label htmlFor="fg">Fitness goal</Label>
            <Select id="fg" value={form.fitness_goal} onChange={upd("fitness_goal")} options={[
              { v: "lose", l: "Lose weight" },
              { v: "maintain", l: "Maintain" },
              { v: "gain", l: "Gain muscle" },
            ]} />
          </div>
          <div>
            <Label htmlFor="dp">Dietary preference</Label>
            <Select id="dp" value={form.dietary_preference} onChange={upd("dietary_preference")} options={[
              { v: "vegetarian", l: "Vegetarian" },
              { v: "vegan", l: "Vegan" },
              { v: "eggetarian", l: "Eggetarian" },
              { v: "non-vegetarian", l: "Non-vegetarian" },
              { v: "jain", l: "Jain" },
            ]} />
          </div>
          <div>
            <Label htmlFor="mb">Monthly budget (₹)</Label>
            <Input id="mb" type="number" value={form.monthly_budget} onChange={upd("monthly_budget")} />
          </div>
          <div>
            <Label htmlFor="c">City / State</Label>
            <Input id="c" value={form.city} onChange={upd("city")} placeholder="Gujarat" />
          </div>
          <div>
            <Label htmlFor="ag">Allergies / Avoid</Label>
            <Input id="ag" value={form.allergies} onChange={upd("allergies")} placeholder="e.g. peanuts, milk" />
          </div>
          <div>
            <Label htmlFor="ls">Lifestyle</Label>
            <Select id="ls" value={form.lifestyle} onChange={upd("lifestyle")} options={[
              { v: "hostel_student", l: "Hostel Student" },
              { v: "working_professional", l: "Working Professional" },
              { v: "homemaker", l: "Homemaker" },
              { v: "family", l: "Family" },
              { v: "other", l: "Other" },
            ]} />
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-5">
          <h2 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Calculated stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CalcCard label="BMR" value={`${bmr} kcal`} sub="Base metabolic rate" tone="text-blue-600" />
            <CalcCard label="TDEE" value={`${tdee} kcal`} sub="Total daily energy" tone="text-emerald-600" />
            <CalcCard label="BMI" value={`${bmi || "—"}`} sub={bmiLabel(bmi)} tone="text-emerald-600" />
            <CalcCard label="Daily Budget" value={`₹${dayBudget}`} sub="Per day" tone="text-amber-600" />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save & Continue →"}
        </Button>
      </form>

      <div className="bg-card rounded-2xl border p-4 text-sm">
        <span className="text-muted-foreground">Signed in as: </span>
        <span className="font-medium">{user?.email}</span>
      </div>
    </div>
  );
}

function CalcCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="border rounded-xl p-4 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${tone} mt-1`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
