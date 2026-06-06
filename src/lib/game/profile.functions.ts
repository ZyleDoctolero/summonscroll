import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runCronIfNeeded } = await import("./engine.server");
    const cron = await runCronIfNeeded(supabaseAdmin, context.userId);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Profile not found");
    return { profile: data, cron };
  });
