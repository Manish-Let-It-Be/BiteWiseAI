import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { aiChat, clearChat } from "@/lib/ai.functions";
import { fetchProfile } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({ component: ChatPage });

const SUGGESTIONS = [
  "What can I eat under ₹80?",
  "High protein vegetarian meals?",
  "Cheapest healthy breakfast?",
  "Meal plan for hostel student?",
  "Foods to avoid for weight loss?",
];

type Message = { id: string; role: "user" | "assistant"; content: string };

function ChatPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const sendFn = useServerFn(aiChat);
  const clearFn = useServerFn(clearChat);
  const profileQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    supabase.from("chat_messages")
      .select("id, role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as any) ?? []));
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);
    const tempId = crypto.randomUUID();
    setMessages(m => [...m, { id: tempId, role: "user", content: msg }]);
    try {
      const p = profileQ.data;
      const profileContext = p
        ? `Diet: ${p.dietary_preference ?? "n/a"}, goal: ${p.fitness_goal ?? "n/a"}, daily budget: ₹${Math.round(Number(p.monthly_budget ?? 0)/30)}, target cal: ${p.daily_calorie_target}`
        : undefined;
      const { reply } = await sendFn({ data: { message: msg, profileContext } });
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch (e: any) {
      toast.error(e.message);
      setMessages(m => m.filter(x => x.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear chat history?")) return;
    await clearFn({});
    setMessages([]);
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-10rem)]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Nutrition Assistant</h1>
          <p className="text-muted-foreground text-sm mt-1">Ask anything about meals, budget, or your nutrition goals</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={sending}
            className="px-3 py-1.5 rounded-full text-sm border bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 bg-card border rounded-2xl p-4 overflow-y-auto space-y-3 min-h-[300px]">
        {messages.length === 0 ? (
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm">Hi there! 👋 I'm BiteWise AI. Ask me anything about meals, nutrition, or budget!</p>
            <p className="text-sm mt-2">Try: "₹80 meal ideas?" or "High protein veg breakfast?"</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about meals, nutrition, budget..."
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
