import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listRealms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("realms").select("*").order("sort_order");
    if (error) throw error;
    return { realms: data ?? [] };
  });

export const listAllMonsters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("monsters")
      .select("*, realms(name, icon)")
      .order("realm_id")
      .order("rarity");
    if (error) throw error;
    return { monsters: data ?? [] };
  });

export const listMyMonsters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_monsters")
      .select("*, monster:monsters(*, realms(name, icon))")
      .order("obtained_at", { ascending: false });
    if (error) throw error;
    return { userMonsters: data ?? [] };
  });

export const getMonsterDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userMonsterId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: um, error } = await context.supabase
      .from("user_monsters")
      .select("*, monster:monsters(*, realms(name, icon, element))")
      .eq("id", data.userMonsterId)
      .single();
    if (error) throw error;
    return { userMonster: um };
  });

export const updateTeamSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userMonsterId: z.string().uuid(),
      slot: z.number().int().min(1).max(5).nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    if (data.slot !== null) {
      // Clear existing monster from this slot
      await supabaseAdmin
        .from("user_monsters")
        .update({ is_on_team: false, team_slot: null })
        .eq("user_id", userId)
        .eq("team_slot", data.slot);
    }

    // Assign or remove
    await supabaseAdmin
      .from("user_monsters")
      .update({
        is_on_team: data.slot !== null,
        team_slot: data.slot,
      })
      .eq("id", data.userMonsterId)
      .eq("user_id", userId);

    return { ok: true };
  });
