import { supabase } from "@/integrations/supabase/client";

export async function getMyGuild() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { guild: null, members: [], quest: null, myRole: null };

  const { data: membership } = await supabase
    .from("guild_members")
    .select("*, guild:guilds(*)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { guild: null, members: [], quest: null, myRole: null };

  const [membersRes, questRes] = await Promise.all([
    supabase
      .from("guild_members")
      .select("*, profile:profiles(display_name, level, class)")
      .eq("guild_id", membership.guild_id)
      .order("role"),
    supabase
      .from("guild_quests")
      .select("*, quest_template:quest_templates(*)")
      .eq("guild_id", membership.guild_id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  return {
    guild: membership.guild,
    myRole: membership.role,
    members: membersRes.data ?? [],
    quest: questRes.data,
  };
}

export async function listGuilds() {
  const { data, error } = await supabase
    .from("guilds")
    .select("*, guild_members(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { guilds: data ?? [] };
}

export async function createGuild(name: string, description?: string, privacy = "open") {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("guild_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) throw new Error("Already in a guild.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("crystals")
    .eq("id", user.id)
    .single();
  if (!profile || profile.crystals < 500) throw new Error("Need 500 Crystals.");
  await supabase
    .from("profiles")
    .update({ crystals: profile.crystals - 500 })
    .eq("id", user.id);

  const { data: guild, error } = await supabase
    .from("guilds")
    .insert({ name, description, leader_id: user.id, privacy })
    .select()
    .single();
  if (error) throw error;
  await supabase
    .from("guild_members")
    .insert({ guild_id: guild.id, user_id: user.id, role: "leader" });
  return { guild };
}

export async function joinGuild(guildId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: existing } = await supabase
    .from("guild_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) throw new Error("Already in a guild.");
  await supabase
    .from("guild_members")
    .insert({ guild_id: guildId, user_id: user.id, role: "member" });
  return { ok: true };
}

export async function leaveGuild() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase.from("guild_members").delete().eq("user_id", user.id);
  return { ok: true };
}

export async function getAvailableScrolls() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("inventory")
    .select("*")
    .eq("user_id", user.id)
    .eq("item_type", "quest_scroll")
    .gt("quantity", 0);
  return { scrolls: data ?? [] };
}

export async function listQuestTemplates() {
  const { data, error } = await supabase.from("quest_templates").select("*").order("difficulty");
  if (error) throw error;
  return { templates: data ?? [] };
}

export async function startQuest(questTemplateId: string, consumeScrollName: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("guild_members")
    .select("guild_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) throw new Error("Not in a guild.");

  const { data: active } = await supabase
    .from("guild_quests")
    .select("id")
    .eq("guild_id", membership.guild_id)
    .eq("status", "active")
    .maybeSingle();
  if (active) throw new Error("A quest is already active.");

  const { data: template } = await supabase
    .from("quest_templates")
    .select("*")
    .eq("id", questTemplateId)
    .single();
  if (!template) throw new Error("Quest not found.");

  const { data: scroll } = await supabase
    .from("inventory")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("item_type", "quest_scroll")
    .eq("item_name", consumeScrollName)
    .maybeSingle();
  if (!scroll || scroll.quantity < 1)
    throw new Error(`You need a ${consumeScrollName} to start this quest.`);

  if (scroll.quantity === 1) {
    await supabase.from("inventory").delete().eq("id", scroll.id);
  } else {
    await supabase
      .from("inventory")
      .update({ quantity: scroll.quantity - 1 })
      .eq("id", scroll.id);
  }

  const { data: quest } = await supabase
    .from("guild_quests")
    .insert({
      guild_id: membership.guild_id,
      quest_template_id: questTemplateId,
      started_by: user.id,
      boss_hp_remaining: template.boss_hp,
    })
    .select()
    .single();

  const { data: members } = await supabase
    .from("guild_members")
    .select("user_id")
    .eq("guild_id", membership.guild_id);
  if (members)
    await supabase
      .from("quest_participants")
      .insert(members.map((m) => ({ guild_quest_id: quest!.id, user_id: m.user_id })));
  return { quest };
}
