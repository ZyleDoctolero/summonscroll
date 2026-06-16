import { supabase } from "@/integrations/supabase/client";
import { CURRENT_RELEASED_MAX } from "./constants";

export async function listRealms() {
  const { data, error } = await supabase.from("realms").select("*").order("sort_order");
  if (error) throw error;
  return { realms: data ?? [] };
}

export async function listAllMonsters() {
  const { data, error } = await supabase
    .from("monsters")
    .select("*, realms(name, icon)")
    .lte("bestiary_id", CURRENT_RELEASED_MAX)
    .order("realm_id")
    .order("rarity");
  if (error) throw error;
  return { monsters: data ?? [] };
}

export async function listMyMonsters() {
  const { data, error } = await supabase
    .from("user_monsters")
    .select("*, monster:monsters(*, realms(name, icon))")
    .order("obtained_at", { ascending: false });
  if (error) throw error;
  return { userMonsters: data ?? [] };
}

export async function updateTeamSlot(userMonsterId: string, slot: number | null) {
  if (slot !== null) {
    await supabase
      .from("user_monsters")
      .update({ is_on_team: false, team_slot: null })
      .eq("team_slot", slot);
  }
  await supabase
    .from("user_monsters")
    .update({ is_on_team: slot !== null, team_slot: slot })
    .eq("id", userMonsterId);
  return { ok: true };
}

export async function getTeam() {
  const { data, error } = await supabase
    .from("user_monsters")
    .select("*, monster:monsters(*)")
    .eq("is_on_team", true)
    .order("team_slot");
  if (error) throw error;
  return { team: data ?? [] };
}
export async function synthesizeMonster(targetId: string, fodderIds: string[], useFragments: boolean = false) {
  const { data, error } = await supabase.rpc('synthesize_monster', {
    p_target_id: targetId,
    p_fodder_ids: fodderIds,
    p_use_fragments: useFragments
  });
  if (error) throw error;
  return data;
}
