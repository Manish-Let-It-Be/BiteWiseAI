import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DishCard } from "@/components/DishCard";
import { AddDishModal } from "@/components/AddDishModal";
import { LogMealModal } from "@/components/LogMealModal";
import { useAuth } from "@/lib/useAuth";
import { fetchDishes, type Dish } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dishes")({ component: DishesPage });

type Filter = "all" | "healthy" | "moderate" | "indulgent" | "mine";

function DishesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [logTarget, setLogTarget] = useState<Dish | null>(null);

  const q = useQuery({ queryKey: ["dishes"], queryFn: fetchDishes, enabled: !!userId });

  const filtered = useMemo(() => {
    const list = q.data ?? [];
    if (filter === "all") return list;
    if (filter === "mine") return list.filter(d => !d.is_default);
    return list.filter(d => d.type === filter);
  }, [q.data, filter]);

  const handleDelete = async (d: Dish) => {
    if (!confirm(`Delete "${d.name}"?`)) return;
    const { error } = await supabase.from("dishes").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Dish deleted");
    q.refetch();
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "healthy", label: "🥗 Healthy" },
    { key: "moderate", label: "🍛 Moderate" },
    { key: "indulgent", label: "🍟 Indulgent" },
    { key: "mine", label: "My dishes" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Dish library</h1>
          <p className="text-muted-foreground text-sm mt-1">Your personal food universe.</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add dish
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border">
          <p className="text-muted-foreground mb-3">No dishes match this filter.</p>
          <Button variant="outline" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add your first dish
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(d => (
            <DishCard
              key={d.id}
              dish={d}
              ownedByUser={!d.is_default && d.user_id === userId}
              onLog={setLogTarget}
              onEdit={(dish) => { setEditing(dish); setModalOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddDishModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        userId={userId}
        editing={editing}
        onSaved={() => q.refetch()}
      />
      <LogMealModal
        open={!!logTarget}
        onOpenChange={(o) => !o && setLogTarget(null)}
        dish={logTarget}
        userId={userId}
        onLogged={() => {}}
      />
    </div>
  );
}
