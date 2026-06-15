import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // The System's Penalty Trap
    const { data: profile } = await supabase
      .from("profiles")
      .select("in_penalty_zone")
      .eq("id", data.user.id)
      .single();

    if (profile?.in_penalty_zone && location.pathname !== "/penalty-zone") {
      throw redirect({ to: "/penalty-zone" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
