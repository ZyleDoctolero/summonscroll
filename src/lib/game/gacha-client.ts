import { supabase } from "@/integrations/supabase/client";
import { PULL_RATES, type BannerType, type Rarity } from "./gacha.constants";
import { CURRENT_RELEASED_MAX } from "./constants";

export async function listBanners() {
  const { data, error } = await supabase
    .from("banners")
    .select("*, realms(*), featured_monster:monsters(*)")
    .eq("is_active", true)
    .order("created_at");
  if (error) throw error;
  return { banners: data ?? [] };
}

export async function pullBanner(bannerId: string, count: 1 | 10) {
  const { data, error } = await supabase.rpc("pull_banner", {
    p_banner_id: bannerId,
    p_count: count,
  });

  if (error) {
    // Surface DB-level failures as something a player can act on rather
    // than a raw Postgres message.
    throw new Error(`The summon failed — ${error.message}`);
  }

  const shaped = data as { results?: unknown[] } | null;
  if (!shaped || !Array.isArray(shaped.results) || shaped.results.length === 0) {
    // A "successful" RPC with no results would otherwise render nothing
    // after the synthesizing cutscene — fail loudly instead.
    throw new Error("The summon returned no souls. Please try again.");
  }

  // The RPC returns { results: [...], newBalance: { pactSeals: ... } | { crystals: ... } }
  // We need to type-cast or shape it appropriately for the frontend.
  const response = data as unknown as {
    results: Array<{
      monster: {
        id: string;
        name: string;
        rarity: Rarity;
        role: string;
        element: string;
        artUrl: string;
        realmSkill: string | null;
      };
      isNew: boolean;
      transcendenceStone: boolean;
    }>;
    newBalance: { pactSeals?: number; crystals?: number };
  };

  return response;
}
