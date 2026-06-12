import { supabase } from "@/integrations/supabase/client";
import { PULL_RATES, type BannerType, type Rarity } from "./gacha.constants";
import { CURRENT_RELEASED_MAX } from "./constants";

export async function listBanners() {
  const { data, error } = await supabase.from("banners").select("*, realms(*), featured_monster:monsters(*)").eq("is_active", true).order("created_at");
  if (error) throw error;
  return { banners: data ?? [] };
}

export async function pullBanner(bannerId: string, count: 1 | 10) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [bannerRes, profileRes] = await Promise.all([
    supabase.from("banners").select("*").eq("id", bannerId).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  const banner = bannerRes.data!;
  const profile = profileRes.data!;

  const isPactSeal = banner.banner_type === "pact_seal";
  const cost1 = isPactSeal ? (banner.pull_cost_seals ?? 1) : banner.pull_cost_crystals;
  const cost10 = isPactSeal ? (banner.pull_cost_seals ?? 1) * 10 : banner.pull_cost_10_crystals;
  
  // Check if this is the user's first pull EVER (free first pull for onboarding)
  const { count: pullCount } = await supabase
    .from("pulls")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  
  const isFirstPull = (pullCount ?? 0) === 0;
  const totalCost = isFirstPull ? 0 : (count === 1 ? cost1 : cost10);
  
  const balance = isPactSeal ? profile.pact_seals : profile.crystals;
  if (balance < totalCost) throw new Error(`Insufficient ${isPactSeal ? "Pact Seals" : "Crystals"}. Need ${totalCost}, have ${balance}.`);

  // Load monsters for banner
  const monstersQuery = supabase.from("monsters").select("*").lte("bestiary_id", CURRENT_RELEASED_MAX);
  if (banner.realm_id) monstersQuery.eq("realm_id", banner.realm_id);
  const { data: monsters } = await monstersQuery;
  if (!monsters?.length) throw new Error("No monsters available");

  const { data: ownedMonsters } = await supabase.from("user_monsters").select("monster_id");
  const ownedSet = new Set((ownedMonsters ?? []).map((um) => um.monster_id));

  const bannerType = banner.banner_type as BannerType;
  const results: Array<{ monster: typeof monsters[0]; isNew: boolean; transcendenceStone: boolean }> = [];

  for (let i = 0; i < count; i++) {
    let rolledRarity = rollRarity(bannerType);
    
    // First pull guarantee: ensure at least one Rare in the first 10-pull
    if (isFirstPull && i === 0 && count === 10) {
      rolledRarity = "rare";
    }

    if (rolledRarity === "ex" && bannerType !== "pact_seal" && bannerType !== "streak") rolledRarity = "mythic";

    const pool = monsters.filter((m) => m.rarity === rolledRarity);
    const monster = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : monsters[Math.floor(Math.random() * monsters.length)];
    const isNew = !ownedSet.has(monster.id);

    results.push({ monster, isNew, transcendenceStone: monster.is_ex && !isNew });
    ownedSet.add(monster.id);
  }

  // DB updates
  const currencyUpdate = isPactSeal ? { pact_seals: profile.pact_seals - totalCost } : { crystals: profile.crystals - totalCost };
  await supabase.from("profiles").update(currencyUpdate).eq("id", user.id);

  const newInserts = results.filter((r) => r.isNew).map((r) => ({ user_id: user.id, monster_id: r.monster.id }));
  if (newInserts.length > 0) await supabase.from("user_monsters").insert(newInserts);

  // Dupes: +10 bond, +1 star
  for (const dupe of results.filter((r) => !r.isNew && !r.transcendenceStone)) {
    const { data: existing } = await supabase.from("user_monsters").select("id, bond_percent, star_level").eq("monster_id", dupe.monster.id).maybeSingle();
    if (existing) await supabase.from("user_monsters").update({ bond_percent: Math.min(100, existing.bond_percent + 10) }).eq("id", existing.id);
  }

  await supabase.from("pulls").insert(results.map((r) => ({
    user_id: user.id, banner_id: bannerId, monster_id: r.monster.id, rarity: r.monster.rarity,
    is_new: r.isNew, transcendence_stone: r.transcendenceStone,
    currency_spent: isPactSeal ? "pact_seals" : "gems", amount_spent: Math.round(totalCost / count),
  })));

  return {
    results: results.map((r) => ({
      monster: { id: r.monster.id, name: r.monster.name, rarity: r.monster.rarity as Rarity, role: r.monster.role, element: r.monster.element, artUrl: r.monster.art_url, realmSkill: r.monster.realm_skill },
      isNew: r.isNew, transcendenceStone: r.transcendenceStone,
    })),
    newBalance: isPactSeal ? { pactSeals: profile.pact_seals - totalCost } : { crystals: profile.crystals - totalCost },
  };
}

function rollRarity(bannerType: BannerType): Rarity {
  const rates = PULL_RATES[bannerType];
  const roll = Math.random();
  let cum = 0;
  for (const rarity of ["ex", "mythic", "legendary", "epic", "elite", "rare", "uncommon", "common"] as Rarity[]) {
    cum += rates[rarity];
    if (roll < cum) return rarity;
  }
  return "common";
}
