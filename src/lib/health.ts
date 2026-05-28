// Health / nutrition calculations

export type Gender = "male" | "female" | "other";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  if (!weightKg || !heightCm || !age) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "female" ? base - 161 : base + 5);
}

export function calcTDEE(bmr: number, activity: Activity): number {
  return Math.round(bmr * (ACTIVITY_FACTOR[activity] ?? 1.2));
}

export function calcBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function bmiLabel(bmi: number): string {
  if (!bmi) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function dailyBudget(monthly: number): number {
  return Math.round((monthly || 0) / 30);
}
