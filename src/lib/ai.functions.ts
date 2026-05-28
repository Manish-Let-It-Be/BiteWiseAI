import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

type Msg = { role: "system" | "user" | "assistant"; content: any };

async function callGateway(messages: Msg[], opts?: { json?: boolean; model?: string }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const body: any = {
    model: opts?.model ?? "gemini-2.5-flash",
    messages,
  };
  if (opts?.json) body.response_format = { type: "json_object" };

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Plain chat with persistence
export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string; profileContext?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);

    const system = `You are BiteWise AI, a friendly Indian nutrition & budget coach.
Give concise practical answers in plain language, prefer Indian foods, mention rough ₹ prices when relevant.Do not use star symbols to make the output bold.
${data.profileContext ? `User context: ${data.profileContext}` : ""}`;

    const messages: Msg[] = [
      { role: "system", content: system },
      ...(history ?? []).map(m => ({ role: m.role as any, content: m.content })),
      { role: "user", content: data.message },
    ];
    const reply = await callGateway(messages);

    await supabase.from("chat_messages").insert([
      { user_id: userId, role: "user", content: data.message },
      { user_id: userId, role: "assistant", content: reply },
    ]);
    return { reply };
  });

// Meal planner — returns structured JSON
export const aiMealPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    range: "daily" | "weekly";
    budget: number;
    targetCal: number;
    goal: string;
    diet: string;
  }) => d)
  .handler(async ({ data }) => {
    const sys = `You are an Indian nutrition planner. Return ONLY valid JSON, no markdown.`;
    const user = `Generate a ${data.range} Indian meal plan.
Constraints:
- Daily budget: ₹${data.budget}
- Target calories per day: ${data.targetCal} kcal
- Goal: ${data.goal}
- Diet: ${data.diet}

Return JSON of shape:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        { "type": "breakfast"|"lunch"|"snack"|"dinner", "name": string, "calories": number, "price": number, "protein_g": number, "notes": string }
      ],
      "total_calories": number,
      "total_price": number
    }
  ]
}
${data.range === "daily" ? "Return exactly 1 day." : "Return 7 days (Mon-Sun)."}`;

    const raw = await callGateway([
      { role: "system", content: sys },
      { role: "user", content: user },
    ], { json: true });
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("AI returned invalid JSON, please try again.");
    }
  });

// Budget optimizer
export const aiBudgetOptimize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { budget: number; days: number; diet: string }) => d)
  .handler(async ({ data }) => {
    const sys = `You are an Indian food budget optimizer. Return ONLY valid JSON.`;
    const user = `Optimize ₹${data.budget} for ${data.days} days of ${data.diet} eating.
Return JSON:
{
  "swaps": [{ "instead_of": string, "swap_to": string, "saves": number, "why": string }],
  "bulk_buys": [{ "item": string, "qty": string, "price": number, "lasts": string }],
  "weekly_template": [{ "meal": string, "items": string, "cost": number }],
  "tips": [string]
}`;
    const raw = await callGateway([
      { role: "system", content: sys },
      { role: "user", content: user },
    ], { json: true });
    try { return JSON.parse(raw); }
    catch { throw new Error("AI returned invalid JSON, please try again."); }
  });

// Analyze food photo
export const aiAnalyzePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageBase64: string }) => d)
  .handler(async ({ data }) => {
    const sys = `You analyze Indian food photos. Return ONLY valid JSON.`;
    const messages: Msg[] = [
      { role: "system", content: sys },
      {
        role: "user",
        content: [
          { type: "text", text: `Identify the dish and estimate nutrition. Return JSON:
{ "name": string, "calories": number, "protein_g": number, "estimated_price": number }` },
          { type: "image_url", image_url: { url: data.imageBase64 } },
        ],
      },
    ];
    const raw = await callGateway(messages, { json: true });
    try { return JSON.parse(raw); }
    catch { throw new Error("Couldn't analyze that photo. Try a clearer image."); }
  });

export const clearChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("chat_messages").delete().eq("user_id", context.userId);
    return { ok: true };
  });
