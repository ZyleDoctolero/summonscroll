import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PromotionRequirement = {
  stones: { name: string; qty: number };
  materials: Array<{ name: string; qty: number }>;
  bondRequired: number;
  levelRequired: number;
  goldRequired: number;
  dupesRequired: number;
  newStarLevel: number;
  unlocks?: string;
  locked?: { reason: string };
};

export type PromotionCheck = {
  canPromote: boolean;
  reason?: string;
  requirement: PromotionRequirement;
  have: { stones: number; materials: Record<string, number>; bond: number; level: number; gold: number; dupes: number };
};

// ─── Mapping ────────────────────────────────────────────────────────────────

// Role → stone the monster needs to promote
export function stoneForRole(role: string): string {
  switch (role) {
    case "attacker":
      return "Strength Stone";
    case "tank":
      return "Hearth Stone";
    case "healer":
      return "Hearth Stone";
    case "support":
      return "Sage Stone";
    case "debuffer":
      return "Wayfarer Stone";
    default:
      return "Strength Stone";
  }
}

// Role → rare material that drops in matching expedition
function materialForRole(role: string): string {
  switch (role) {
    case "attacker":
      return "Iron Shard";
    case "tank":
      return "Granite Core";
    case "healer":
      return "Granite Core";
    case "support":
      return "Vellum Page";
    case "debuffer":
      return "Tome Shard";
    default:
      return "Iron Shard";
  }
}

// ─── Promotion table (1★ → 5★ for now; 6/7 locked) ──────────────────────────

export function requirementForPromotion(currentStar: number, role: string): PromotionRequirement {
  const stoneName = stoneForRole(role);
  const matName = materialForRole(role);

  if (currentStar === 1) {
    return {
      stones: { name: stoneName, qty: 5 },
      materials: [],
      bondRequired: 0,
      levelRequired: 1,
      goldRequired: 500,
      dupesRequired: 0,
      newStarLevel: 2,
      unlocks: "Star multiplier 1.15×",
    };
  }
  if (currentStar === 2) {
    return {
      stones: { name: stoneName, qty: 10 },
      materials: [],
      bondRequired: 20,
      levelRequired: 5,
      goldRequired: 1500,
      dupesRequired: 1,
      newStarLevel: 3,
      unlocks: "Star multiplier 1.35×",
    };
  }
  if (currentStar === 3) {
    return {
      stones: { name: stoneName, qty: 20 },
      materials: [{ name: matName, qty: 1 }],
      bondRequired: 40,
      levelRequired: 15,
      goldRequired: 3000,
      dupesRequired: 1,
      newStarLevel: 4,
      unlocks: "Second active skill slot",
    };
  }
  if (currentStar === 4) {
    return {
      stones: { name: stoneName, qty: 50 },
      materials: [{ name: matName, qty: 2 }],
      bondRequired: 60,
      levelRequired: 30,
      goldRequired: 5000,
      dupesRequired: 2,
      newStarLevel: 5,
      unlocks: "Awakening passive (deeds)",
    };
  }
  if (currentStar === 5) {
    return {
      stones: { name: stoneName, qty: 100 },
      materials: [{ name: matName, qty: 5 }],
      bondRequired: 80,
      levelRequired: 50,
      goldRequired: 10000,
      dupesRequired: 3,
      newStarLevel: 6,
      unlocks: "Realm Skill activates",
    };
  }
  if (currentStar === 6) {
    return {
      stones: { name: stoneName, qty: 100 },
      materials: [{ name: matName, qty: 5 }],
      bondRequired: 100,
      levelRequired: 70,
      goldRequired: 25000,
      dupesRequired: 5,
      newStarLevel: 7,
      unlocks: "Transcendent Title + portrait variant",
    };
  }
  return {
    stones: { name: stoneName, qty: 0 },
    materials: [],
    bondRequired: 100,
    levelRequired: 0,
    goldRequired: 0,
    dupesRequired: 0,
    newStarLevel: currentStar,
    locked: { reason: "Already at maximum Star Level." },
  };
}

// ─── Check + Promote ────────────────────────────────────────────────────────

export async function checkPromotionEligibility(userMonsterId: string): Promise<PromotionCheck> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: um } = await supabase
    .from("user_monsters")
    .select("id, star_level, bond_percent, level, monster_id, monster:monsters(role, name)")
    .eq("id", userMonsterId)
    .single();
  if (!um) throw new Error("Monster not found");
  const m = um.monster as unknown as { role: string; name: string };

  const req = requirementForPromotion(um.star_level, m.role);

  // Aggregate user inventory of the required stone + each material
  const stoneName = req.stones.name;
  const materialNames = req.materials.map((mat) => mat.name);
  const allItemNames = [stoneName, ...materialNames];

  const { data: invRows } = await supabase
    .from("inventory")
    .select("item_name, quantity")
    .eq("user_id", user.id)
    .in("item_name", allItemNames);

  const have: Record<string, number> = {};
  for (const row of invRows ?? []) {
    have[row.item_name] = (have[row.item_name] ?? 0) + row.quantity;
  }

  const { count: dupesCount } = await supabase
    .from("user_monsters")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)
    .eq("monster_id", um.monster_id)
    .neq("id", userMonsterId);

  const { data: profile } = await supabase.from("profiles").select("gold").eq("id", user.id).single();
  const gold = profile?.gold ?? 0;
  const dupes = dupesCount ?? 0;

  // Reasons for refusal, in order
  if (req.locked)
    return {
      canPromote: false,
      reason: req.locked.reason,
      requirement: req,
      have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level, gold, dupes },
    };

  if (um.bond_percent < req.bondRequired) {
    return {
      canPromote: false,
      reason: `Bond too low (${Math.round(um.bond_percent)}% / ${req.bondRequired}%).`,
      requirement: req,
      have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level, gold, dupes },
    };
  }
  if (um.level < req.levelRequired) {
    return {
      canPromote: false,
      reason: `Level too low (${um.level} / ${req.levelRequired}).`,
      requirement: req,
      have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level, gold, dupes },
    };
  }
  if (gold < req.goldRequired) {
    return {
      canPromote: false,
      reason: `Need ${req.goldRequired} Gold — have ${gold}.`,
      requirement: req,
      have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level, gold, dupes },
    };
  }
  if (dupes < req.dupesRequired) {
    return {
      canPromote: false,
      reason: `Need ${req.dupesRequired} duplicate copies — have ${dupes}.`,
      requirement: req,
      have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level, gold, dupes },
    };
  }

  if ((have[stoneName] ?? 0) < req.stones.qty) {
    return {
      canPromote: false,
      reason: `Need ${req.stones.qty} ${stoneName} — have ${have[stoneName] ?? 0}.`,
      requirement: req,
      have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level, gold, dupes },
    };
  }
  for (const mat of req.materials) {
    if ((have[mat.name] ?? 0) < mat.qty) {
      return {
        canPromote: false,
        reason: `Need ${mat.qty} ${mat.name} — have ${have[mat.name] ?? 0}.`,
        requirement: req,
        have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level, gold, dupes },
      };
    }
  }

  return {
    canPromote: true,
    requirement: req,
    have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level, gold, dupes },
  };
}

export async function promoteMonster(
  userMonsterId: string,
): Promise<{ from: number; to: number; unlocks?: string }> {
  const check = await checkPromotionEligibility(userMonsterId);
  if (!check.canPromote) throw new Error(check.reason ?? "Cannot promote.");

  const { data, error } = await supabase.rpc("ascend_monster", {
    p_user_monster_id: userMonsterId
  });

  if (error) throw error;
  
  const res = data as any;
  if (!res.success) throw new Error("Ascension failed on server.");

  return { from: res.from, to: res.to, unlocks: check.requirement.unlocks };
}

async function consumeInventory(userId: string, itemName: string, qty: number) {
  let remaining = qty;
  const { data: rows } = await supabase
    .from("inventory")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("item_name", itemName)
    .order("quantity", { ascending: false });

  for (const row of rows ?? []) {
    if (remaining <= 0) break;
    const consume = Math.min(remaining, row.quantity);
    const newQty = row.quantity - consume;
    if (newQty === 0) {
      await supabase.from("inventory").delete().eq("id", row.id);
    } else {
      await supabase.from("inventory").update({ quantity: newQty }).eq("id", row.id);
    }
    remaining -= consume;
  }

  if (remaining > 0) {
    throw new Error(`Not enough ${itemName} after race condition. Try again.`);
  }
}
