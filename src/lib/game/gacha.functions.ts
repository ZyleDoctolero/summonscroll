import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  PULL_RATES,
  PITY_THRESHOLDS,
  RARITY_ORDER,
  SOFT_PITY_START,
  SOFT_PITY_RATE_BOOST,
  type BannerType,
  type Rarity,
} from "./gacha.constants";

// ─── List active banners ────────────────────────────────────────────────────

export const listBanners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("banners")
      .select("*, realms(*), featured_monster:monsters(*)")
      .eq("is_active", true)
      .order("created_at");
    if (error) throw error;
    return { banners: data ?? [] };
  });

// ─── Get pity counter for a banner ──────────────────────────────────────────

export const getPity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ bannerId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: pity } = await context.supabase
      .from("pity_counters")
      .select("*")
      .eq("banner_id", data.bannerId)
      .maybeSingle();
    return {
      pity: pity ?? {
        rare_pity: 0, elite_pity: 0, epic_pity: 0,
        legendary_pity: 0, mythic_pity: 0, ex_pity: 0,
        total_pulls: 0,
      },
    };
  });

// ─── Pull x1 or x10 ────────────────────────────────────────────────────────

export const pullBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      bannerId: z.string().uuid(),
      count: z.union([z.literal(1), z.literal(10)]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Load banner + profile + pity in parallel
    const [bannerRes, profileRes, pityRes] = await Promise.all([
      supabaseAdmin.from("banners").select("*").eq("id", data.bannerId).single(),
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
      supabaseAdmin
        .from("pity_counters")
        .select("*")
        .eq("user_id", userId)
        .eq("banner_id", data.bannerId)
        .maybeSingle(),
    ]);

    if (bannerRes.error) throw bannerRes.error;
    if (profileRes.error) throw profileRes.error;
    const banner = bannerRes.data;
    const profile = profileRes.data;
    if (!banner || !profile) throw new Error("Banner or profile not found");
    if (!banner.is_active) throw new Error("Banner is not active");

    // Calculate cost
    const isPactSeal = banner.banner_type === "pact_seal";
    const costPer1 = isPactSeal ? (banner.pull_cost_seals ?? 1) : banner.pull_cost_gems;
    const costPer10 = isPactSeal ? (banner.pull_cost_seals ?? 1) * 10 : banner.pull_cost_10_gems;
    const totalCost = data.count === 1 ? costPer1 : costPer10;
    const currency = isPactSeal ? "pact_seals" : "gems";
    const balance = isPactSeal ? profile.pact_seals : profile.gems;

    if (balance < totalCost) {
      throw new Error(`Insufficient ${isPactSeal ? "Pact Seals" : "Spirit Crystals"}. Need ${totalCost}, have ${balance}.`);
    }

    // Load monsters for this banner's realm (or all if standard)
    const monstersQuery = supabaseAdmin.from("monsters").select("*");
    if (banner.realm_id) {
      monstersQuery.eq("realm_id", banner.realm_id);
    }
    const { data: monsters, error: monstersErr } = await monstersQuery;
    if (monstersErr) throw monstersErr;
    if (!monsters || monsters.length === 0) throw new Error("No monsters available for this banner");

    // Check what user already owns
    const { data: ownedMonsters } = await supabaseAdmin
      .from("user_monsters")
      .select("monster_id")
      .eq("user_id", userId);
    const ownedSet = new Set((ownedMonsters ?? []).map((um: { monster_id: string }) => um.monster_id));

    // Initialize pity counter
    let pity = pityRes.data ?? {
      rare_pity: 0, elite_pity: 0, epic_pity: 0,
      legendary_pity: 0, mythic_pity: 0, ex_pity: 0,
      total_pulls: 0,
    };

    const bannerType = banner.banner_type as BannerType;
    const results: Array<{
      monster: typeof monsters[0];
      isNew: boolean;
      isPity: boolean;
      transcendenceStone: boolean;
    }> = [];

    // Perform pulls
    for (let i = 0; i < data.count; i++) {
      // Determine rarity
      let rolledRarity = rollRarity(bannerType, pity);
      let wasPity = false;

      // Check pity guarantees
      for (const { rarity, every } of PITY_THRESHOLDS) {
        const pityKey = `${rarity}_pity` as keyof typeof pity;
        const counter = (pity[pityKey] as number) + 1;
        if (counter >= every && RARITY_ORDER[rarity] > RARITY_ORDER[rolledRarity]) {
          rolledRarity = rarity;
          wasPity = true;
        }
      }

      // EX can only come from pact_seal banners
      if (rolledRarity === "ex" && bannerType !== "pact_seal" && bannerType !== "streak") {
        rolledRarity = "mythic"; // downgrade
      }

      // Pick a random monster of the rolled rarity
      const pool = monsters.filter((m) => m.rarity === rolledRarity);
      const monster = pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : monsters[Math.floor(Math.random() * monsters.length)]; // fallback

      const isNew = !ownedSet.has(monster.id);
      const isExDupe = monster.is_ex && !isNew;

      results.push({
        monster,
        isNew,
        isPity: wasPity,
        transcendenceStone: isExDupe,
      });

      // Update owned set
      ownedSet.add(monster.id);

      // Update pity counters — reset counters for rarities at or below what we rolled,
      // increment counters for rarities above what we rolled (those are still building toward pity)
      for (const r of Object.keys(RARITY_ORDER) as Rarity[]) {
        const key = `${r}_pity` as keyof typeof pity;
        if (typeof pity[key] !== "number") continue;
        if (RARITY_ORDER[r] <= RARITY_ORDER[rolledRarity]) {
          // We got this rarity or better — reset its pity counter
          (pity as Record<string, number>)[key] = 0;
        } else {
          // Still building toward this higher rarity
          (pity as Record<string, number>)[key] = (pity[key] as number) + 1;
        }
      }
      pity.total_pulls = (pity.total_pulls as number) + 1;
    }

    // Batch DB operations
    // 1. Deduct currency
    const currencyUpdate = isPactSeal
      ? { pact_seals: profile.pact_seals - totalCost }
      : { gems: profile.gems - totalCost };
    await supabaseAdmin.from("profiles").update(currencyUpdate).eq("id", userId);

    // 2. Insert new monsters OR grant awakening XP for duplicates
    const newMonsterInserts = results
      .filter((r) => r.isNew)
      .map((r) => ({ user_id: userId, monster_id: r.monster.id }));
    if (newMonsterInserts.length > 0) {
      await supabaseAdmin.from("user_monsters").insert(newMonsterInserts);
    }

    // Duplicate pulls: +10 bond XP and +1 awakening star (up to 5) on the existing monster
    const dupes = results.filter((r) => !r.isNew && !r.transcendenceStone);
    for (const dupe of dupes) {
      const { data: existing } = await supabaseAdmin
        .from("user_monsters")
        .select("id, bond_percent, awakening_stars")
        .eq("user_id", userId)
        .eq("monster_id", dupe.monster.id)
        .maybeSingle();
      if (existing) {
        await supabaseAdmin.from("user_monsters").update({
          bond_percent: Math.min(100, existing.bond_percent + 10),
          awakening_stars: Math.min(5, existing.awakening_stars + 1),
        }).eq("id", existing.id);
      }
    }

    // 3. Insert pull records
    const pullInserts = results.map((r) => ({
      user_id: userId,
      banner_id: data.bannerId,
      monster_id: r.monster.id,
      rarity: r.monster.rarity,
      is_new: r.isNew,
      is_pity: r.isPity,
      transcendence_stone: r.transcendenceStone,
      currency_spent: currency,
      amount_spent: data.count === 1 ? costPer1 : Math.round(costPer10 / data.count),
    }));
    await supabaseAdmin.from("pulls").insert(pullInserts);

    // 4. Upsert pity counter
    await supabaseAdmin
      .from("pity_counters")
      .upsert({
        user_id: userId,
        banner_id: data.bannerId,
        ...pity,
      }, { onConflict: "user_id,banner_id" });

    return {
      results: results.map((r) => ({
        monster: {
          id: r.monster.id,
          name: r.monster.name,
          rarity: r.monster.rarity as Rarity,
          role: r.monster.role,
          element: r.monster.element,
          artUrl: r.monster.art_url,
          realmSkill: r.monster.realm_skill,
        },
        isNew: r.isNew,
        isPity: r.isPity,
        transcendenceStone: r.transcendenceStone,
      })),
      newBalance: isPactSeal
        ? { pactSeals: profile.pact_seals - totalCost }
        : { gems: profile.gems - totalCost },
    };
  });

// ─── Get pull history ───────────────────────────────────────────────────────

export const getPullHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pulls")
      .select("*, monster:monsters(name, rarity, art_url, element)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { pulls: data ?? [] };
  });

// ─── Internal: Roll rarity based on rates ───────────────────────────────────

function rollRarity(bannerType: BannerType, pity: { legendary_pity: number }): Rarity {
  const rates = { ...PULL_RATES[bannerType] };

  // Soft pity: boost legendary+ rate after pull 80
  if (pity.legendary_pity >= SOFT_PITY_START) {
    const boost = (pity.legendary_pity - SOFT_PITY_START + 1) * SOFT_PITY_RATE_BOOST;
    rates.legendary = Math.min(1, rates.legendary + boost);
  }

  const roll = Math.random();
  let cumulative = 0;

  const rarities: Rarity[] = ['ex', 'mythic', 'legendary', 'epic', 'elite', 'rare', 'uncommon', 'common'];
  for (const rarity of rarities) {
    cumulative += rates[rarity];
    if (roll < cumulative) return rarity;
  }

  return 'common';
}
