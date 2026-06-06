import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listShopItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shop_items")
      .select("*, equipment(*)")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return { items: data ?? [] };
  });

export const purchaseItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ shopItemId: z.string().uuid(), quantity: z.number().int().min(1).max(99).default(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const [itemRes, profileRes] = await Promise.all([
      supabaseAdmin.from("shop_items").select("*, equipment(*)").eq("id", data.shopItemId).single(),
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
    ]);
    if (itemRes.error) throw itemRes.error;
    if (profileRes.error) throw profileRes.error;
    const item = itemRes.data;
    const profile = profileRes.data;
    if (!item || !profile) throw new Error("Item or profile not found");

    const totalCost = item.price * data.quantity;
    const balanceField = item.currency === "pact_seals" ? "pact_seals" : "gems";
    const balance = profile[balanceField] as number;
    if (balance < totalCost) throw new Error(`Insufficient ${item.currency}. Need ${totalCost}, have ${balance}.`);

    // Deduct currency
    await supabaseAdmin.from("profiles").update({ [balanceField]: balance - totalCost }).eq("id", userId);

    // Apply effect
    if (item.effect_type === "heal_hp") {
      const newHp = Math.min(profile.max_hp, profile.hp + (item.effect_value ?? 15) * data.quantity);
      await supabaseAdmin.from("profiles").update({ hp: newHp }).eq("id", userId);
    } else if (item.effect_type === "armoire") {
      // Random armoire reward
      const roll = Math.random();
      if (roll < 0.4) {
        // Equipment
        const { data: armoireGear } = await supabaseAdmin.from("equipment").select("*").eq("is_armoire_exclusive", true);
        if (armoireGear && armoireGear.length > 0) {
          const gear = armoireGear[Math.floor(Math.random() * armoireGear.length)];
          await supabaseAdmin.from("user_equipment").insert({ user_id: userId, equipment_id: gear.id });
          return { ok: true, reward: { type: "equipment", name: gear.name, item: gear } };
        }
      } else if (roll < 0.7) {
        // Food
        await supabaseAdmin.from("inventory").upsert(
          { user_id: userId, item_type: "food", item_name: "Mystery Meat", quantity: 1 },
          { onConflict: "user_id,item_type,item_name" },
        );
        return { ok: true, reward: { type: "food", name: "Mystery Meat" } };
      } else {
        // XP
        const { applyXp } = await import("./engine.server");
        const xpGain = 50 + Math.floor(Math.random() * 100);
        const lvl = applyXp(profile, xpGain);
        await supabaseAdmin.from("profiles").update({ level: lvl.level, xp: lvl.xp, hp: lvl.hp }).eq("id", userId);
        return { ok: true, reward: { type: "xp", name: `${xpGain} XP` } };
      }
    } else if (item.equipment_id) {
      for (let i = 0; i < data.quantity; i++) {
        await supabaseAdmin.from("user_equipment").insert({ user_id: userId, equipment_id: item.equipment_id });
      }
    } else {
      // Add consumable to inventory
      const existing = await supabaseAdmin.from("inventory")
        .select("*").eq("user_id", userId).eq("item_type", item.effect_type ?? "potion").eq("item_name", item.name).maybeSingle();
      if (existing.data) {
        await supabaseAdmin.from("inventory").update({ quantity: existing.data.quantity + data.quantity }).eq("id", existing.data.id);
      } else {
        await supabaseAdmin.from("inventory").insert({
          user_id: userId, item_type: item.effect_type ?? "potion", item_name: item.name, quantity: data.quantity,
        });
      }
    }

    await supabaseAdmin.from("purchases").insert({ user_id: userId, shop_item_id: data.shopItemId, quantity: data.quantity, total_cost: totalCost });
    return { ok: true, reward: { type: item.effect_type, name: item.name } };
  });

export const listEquipment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_equipment")
      .select("*, equipment(*)")
      .order("obtained_at", { ascending: false });
    if (error) throw error;
    return { equipment: data ?? [] };
  });

export const equipItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userEquipmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: ue } = await supabaseAdmin.from("user_equipment").select("*, equipment(*)").eq("id", data.userEquipmentId).eq("user_id", userId).single();
    if (!ue) throw new Error("Equipment not found");

    const slot = ue.equipment.slot as string;
    const profileField = `equipped_${slot}` as string;

    // Unequip current in same slot
    await supabaseAdmin.from("user_equipment").update({ is_equipped: false }).eq("user_id", userId).eq("is_equipped", true);

    // Equip new
    await supabaseAdmin.from("user_equipment").update({ is_equipped: true }).eq("id", data.userEquipmentId);
    await supabaseAdmin.from("profiles").update({ [profileField]: ue.equipment_id }).eq("id", userId);

    // Recalculate stats
    const { data: equipped } = await supabaseAdmin.from("user_equipment").select("equipment(*)").eq("user_id", userId).eq("is_equipped", true);
    let str = 0, int_ = 0, con = 0, per = 0;
    const { data: prof } = await supabaseAdmin.from("profiles").select("class").eq("id", userId).single();
    const playerClass = prof?.class ?? "none";

    for (const e of equipped ?? []) {
      const eq = e.equipment as { str_bonus: number; int_bonus: number; con_bonus: number; per_bonus: number; class_affinity: string | null };
      const classBonus = eq.class_affinity === playerClass ? 1.5 : 1;
      str += Math.round(eq.str_bonus * classBonus);
      int_ += Math.round(eq.int_bonus * classBonus);
      con += Math.round(eq.con_bonus * classBonus);
      per += Math.round(eq.per_bonus * classBonus);
    }

    await supabaseAdmin.from("profiles").update({ str_stat: str, int_stat: int_, con_stat: con, per_stat: per }).eq("id", userId);
    return { ok: true };
  });
