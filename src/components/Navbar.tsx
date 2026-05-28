import { Link, useNavigate } from "@tanstack/react-router";
import { UtensilsCrossed, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const links = [
  { to: "/", label: "Home", exact: true },
  { to: "/dishes", label: "Dishes", exact: false },
  { to: "/planner", label: "Planner", exact: false },
  { to: "/foodlog", label: "Food Log", exact: false },
  { to: "/budget", label: "Budget", exact: false },
  { to: "/chat", label: "AI Chat", exact: false },
  { to: "/analytics", label: "Analytics", exact: false },
  { to: "/settings", label: "Settings", exact: false },
] as const;

export function Navbar() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-4 w-4" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg">Bitewise</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block">
              Eat smart
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="px-2.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
              activeProps={{ className: "px-2.5 py-2 rounded-lg text-sm font-medium text-foreground bg-accent whitespace-nowrap" }}
              activeOptions={{ exact: l.exact }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
