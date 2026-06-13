import { supabase } from "@/integrations/supabase/client";

export async function purchaseItem(shopItemId: string, quantity = 1) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [itemRes, profileRes] = await Promise.all([
    supabase.from("shop_items").select("*, equipment(*)").eq("id", shopItemId).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);
  const item = itemRes.data!;
  const profile = profileRes.data!;

  const totalCost = item.price * quantity;
  const field =
    item.currency === "pact_seals" ? "pact_seals" : item.currency === "gold" ? "gold" : "crystals";
  const balance = profile[field] as number;
  if (balance < totalCost)
    throw new Error(`Insufficient funds. Need ${totalCost}, have ${balance}.`);

  await supabase
    .from("profiles")
    .update({ [field]: balance - totalCost })
    .eq("id", user.id);

  if (item.effect_type === "heal_hp") {
    const newHp = Math.min(profile.max_hp, profile.hp + (item.effect_value ?? 15) * quantity);
    await supabase.from("profiles").update({ hp: newHp }).eq("id", user.id);
  } else if (item.effect_type === "streak_freeze") {
    const charges = ((profile.streak_freeze_charges as number) ?? 0) + quantity;
    await supabase.from("profiles").update({ streak_freeze_charges: charges }).eq("id", user.id);
  } else if (item.effect_type === "armoire") {
    const roll = Math.random();
    if (roll < 0.4) {
      const { data: gear } = await supabase
        .from("equipment")
        .select("*")
        .eq("is_armoire_exclusive", true);
      if (gear?.length) {
        const g = gear[Math.floor(Math.random() * gear.length)];
        await supabase.from("user_equipment").insert({ user_id: user.id, equipment_id: g.id });
        return { ok: true, reward: { type: "equipment", name: g.name } };
      }
    } else if (roll < 0.7) {
      await upsertInventory(user.id, "food", "Mystery Meat");
      return { ok: true, reward: { type: "food", name: "Mystery Meat" } };
    } else {
      const xpGain = 50 + Math.floor(Math.random() * 100);
      await supabase
        .from("profiles")
        .update({ xp: profile.xp + xpGain })
        .eq("id", user.id);
      return { ok: true, reward: { type: "xp", name: `${xpGain} XP` } };
    }
  } else if (item.equipment_id) {
    for (let i = 0; i < quantity; i++) {
      await supabase
        .from("user_equipment")
        .insert({ user_id: user.id, equipment_id: item.equipment_id });
    }
  } else {
    await upsertInventory(user.id, item.effect_type ?? "potion", item.name, quantity);
  }

  await supabase
    .from("purchases")
    .insert({ user_id: user.id, shop_item_id: shopItemId, quantity, total_cost: totalCost });
  return { ok: true, reward: { type: item.effect_type, name: item.name } };
}

export async function equipItem(userEquipmentId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: ue } = await supabase
    .from("user_equipment")
    .select("*, equipment(*)")
    .eq("id", userEquipmentId)
    .eq("user_id", user.id)
    .single();
  if (!ue) throw new Error("Equipment not found");

  const eq = ue.equipment as { slot: string };
  const slot = eq.slot;
  const profileField = `equipped_${slot}` as string;

  // Unequip current items
  await supabase
    .from("user_equipment")
    .update({ is_equipped: false })
    .eq("user_id", user.id)
    .eq("is_equipped", true);

  // Equip new
  await supabase.from("user_equipment").update({ is_equipped: true }).eq("id", userEquipmentId);
  await supabase
    .from("profiles")
    .update({ [profileField]: ue.equipment_id })
    .eq("id", user.id);

  // Recalculate stats
  const { data: equipped } = await supabase
    .from("user_equipment")
    .select("equipment(*)")
    .eq("user_id", user.id)
    .eq("is_equipped", true);

  const { data: prof } = await supabase.from("profiles").select("class").eq("id", user.id).single();
  const playerClass = prof?.class ?? "none";

  let str = 0,
    int_ = 0,
    con = 0,
    per = 0;
  for (const e of equipped ?? []) {
    const eqRow = e.equipment as {
      str_bonus: number;
      int_bonus: number;
      con_bonus: number;
      per_bonus: number;
      class_affinity: string | null;
    };
    const classBonus = eqRow.class_affinity === playerClass ? 1.5 : 1;
    str += Math.round(eqRow.str_bonus * classBonus);
    int_ += Math.round(eqRow.int_bonus * classBonus);
    con += Math.round(eqRow.con_bonus * classBonus);
    per += Math.round(eqRow.per_bonus * classBonus);
  }

  await supabase
    .from("profiles")
    .update({ str_stat: str, int_stat: int_, con_stat: con, per_stat: per })
    .eq("id", user.id);
  return { ok: true };
}

async function upsertInventory(userId: string, itemType: string, itemName: string, qty = 1) {
  const { data: existing } = await supabase
    .from("inventory")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_name", itemName)
    .maybeSingle();
  if (existing)
    await supabase
      .from("inventory")
      .update({ quantity: existing.quantity + qty })
      .eq("id", existing.id);
  else
    await supabase
      .from("inventory")
      .insert({ user_id: userId, item_type: itemType, item_name: itemName, quantity: qty });
}
