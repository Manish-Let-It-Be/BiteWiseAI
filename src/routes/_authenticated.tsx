import { useEffect, useState } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        // Soft redirect to login
        window.location.href = "/login";
        return;
      }
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 md:pb-10 pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
