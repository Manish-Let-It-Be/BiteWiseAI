import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Dish = Tables<"dishes">;
export type Profile = Tables<"profiles">;
export type MealLog = Tables<"meal_logs">;

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchDishes(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .order("is_default", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTodayLogs(userId: string): Promise<MealLog[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("logged_at", start.toISOString())
    .order("logged_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMonthLogs(userId: string): Promise<MealLog[]> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("logged_at", start.toISOString());
  if (error) throw error;
  return data ?? [];
}

export function sumPrice(logs: MealLog[]) {
  return logs.reduce((s, l) => s + Number(l.price), 0);
}
export function sumCalories(logs: MealLog[]) {
  return logs.reduce((s, l) => s + Number(l.calories), 0);
}
