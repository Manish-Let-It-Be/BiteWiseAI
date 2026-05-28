import { Link } from "@tanstack/react-router";
import { Home, Calendar, Camera, Sparkles, BarChart3 } from "lucide-react";

const items = [
  { to: "/" as const, label: "Home", icon: Home, exact: true },
  { to: "/planner" as const, label: "Planner", icon: Calendar, exact: false },
  { to: "/foodlog" as const, label: "Log", icon: Camera, exact: false },
  { to: "/chat" as const, label: "Chat", icon: Sparkles, exact: false },
  { to: "/analytics" as const, label: "Stats", icon: BarChart3, exact: false },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground"
            activeProps={{ className: "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-primary" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
