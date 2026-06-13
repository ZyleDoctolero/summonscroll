import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PromotionRequirement = {
  stones: { name: string; qty: number };
  materials: Array<{ name: string; qty: number }>;
  bondRequired: number;
  levelRequired: number;
  newStarLevel: number;
  unlocks?: string;
  locked?: { reason: string };
};

export type PromotionCheck = {
  canPromote: boolean;
  reason?: string;
  requirement: PromotionRequirement;
  have: { stones: number; materials: Record<string, number>; bond: number; level: number };
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
      newStarLevel: 6,
      unlocks: "Realm Skill activates",
      locked: { reason: "Needs Epic Material — unlocked in Tower restructure (Step 9)." },
    };
  }
  if (currentStar === 6) {
    return {
      stones: { name: stoneName, qty: 100 },
      materials: [{ name: matName, qty: 5 }],
      bondRequired: 100,
      levelRequired: 70,
      newStarLevel: 7,
      unlocks: "Transcendent Title + portrait variant",
      locked: {
        reason: "Needs Tome of Reverse Heaven — only obtainable from Quarterly Goals (Step 7).",
      },
    };
  }
  return {
    stones: { name: stoneName, qty: 0 },
    materials: [],
    bondRequired: 100,
    levelRequired: 0,
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
    .select("id, star_level, bond_percent, level, monster:monsters(role, name)")
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

  // Reasons for refusal, in order
  if (req.locked)
    return {
      canPromote: false,
      reason: req.locked.reason,
      requirement: req,
      have: {
        stones: have[stoneName] ?? 0,
        materials: have,
        bond: um.bond_percent,
        level: um.level,
      },
    };

  if (um.bond_percent < req.bondRequired) {
    return {
      canPromote: false,
      reason: `Bond too low (${Math.round(um.bond_percent)}% / ${req.bondRequired}%).`,
      requirement: req,
      have: {
        stones: have[stoneName] ?? 0,
        materials: have,
        bond: um.bond_percent,
        level: um.level,
      },
    };
  }
  if (um.level < req.levelRequired) {
    return {
      canPromote: false,
      reason: `Level too low (${um.level} / ${req.levelRequired}).`,
      requirement: req,
      have: {
        stones: have[stoneName] ?? 0,
        materials: have,
        bond: um.bond_percent,
        level: um.level,
      },
    };
  }

  if ((have[stoneName] ?? 0) < req.stones.qty) {
    return {
      canPromote: false,
      reason: `Need ${req.stones.qty} ${stoneName} — have ${have[stoneName] ?? 0}.`,
      requirement: req,
      have: {
        stones: have[stoneName] ?? 0,
        materials: have,
        bond: um.bond_percent,
        level: um.level,
      },
    };
  }
  for (const mat of req.materials) {
    if ((have[mat.name] ?? 0) < mat.qty) {
      return {
        canPromote: false,
        reason: `Need ${mat.qty} ${mat.name} — have ${have[mat.name] ?? 0}.`,
        requirement: req,
        have: {
          stones: have[stoneName] ?? 0,
          materials: have,
          bond: um.bond_percent,
          level: um.level,
        },
      };
    }
  }

  return {
    canPromote: true,
    requirement: req,
    have: { stones: have[stoneName] ?? 0, materials: have, bond: um.bond_percent, level: um.level },
  };
}

export async function promoteMonster(
  userMonsterId: string,
): Promise<{ from: number; to: number; unlocks?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Re-check eligibility server-side-of-sorts (re-query to avoid TOCTOU)
  const check = await checkPromotionEligibility(userMonsterId);
  if (!check.canPromote) throw new Error(check.reason ?? "Cannot promote.");

  const req = check.requirement;
  const stoneName = req.stones.name;

  // Decrement stones from inventory (across rows if needed)
  await consumeInventory(user.id, stoneName, req.stones.qty);
  for (const mat of req.materials) {
    await consumeInventory(user.id, mat.name, mat.qty);
  }

  // Bump the star_level
  const { data: um } = await supabase
    .from("user_monsters")
    .select("star_level")
    .eq("id", userMonsterId)
    .single();
  if (!um) throw new Error("Monster vanished mid-ritual.");

  const fromStar = um.star_level;
  const toStar = req.newStarLevel;
  await supabase.from("user_monsters").update({ star_level: toStar }).eq("id", userMonsterId);

  // Log the attempt
  await supabase.from("promotion_attempts").insert({
    user_id: user.id,
    user_monster_id: userMonsterId,
    from_star: fromStar,
    to_star: toStar,
    stones_spent: [{ name: stoneName, qty: req.stones.qty }],
    materials_spent: req.materials,
  });

  return { from: fromStar, to: toStar, unlocks: req.unlocks };
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
