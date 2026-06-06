import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyGuild = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: membership } = await supabaseAdmin
      .from("guild_members")
      .select("*, guild:guilds(*)")
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) return { guild: null, members: [], quest: null };

    const guildId = membership.guild_id;

    const [membersRes, questRes] = await Promise.all([
      supabaseAdmin.from("guild_members")
        .select("*, profile:profiles(display_name, level, class)")
        .eq("guild_id", guildId)
        .order("role"),
      supabaseAdmin.from("guild_quests")
        .select("*, quest_template:quest_templates(*)")
        .eq("guild_id", guildId)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    return {
      guild: membership.guild,
      myRole: membership.role,
      members: membersRes.data ?? [],
      quest: questRes.data,
    };
  });

export const listGuilds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("guilds")
      .select("*, guild_members(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { guilds: data ?? [] };
  });

export const createGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().trim().min(3).max(30),
      description: z.string().max(200).optional(),
      privacy: z.enum(["open", "apply", "invite"]).default("open"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Check if already in guild
    const { data: existing } = await supabaseAdmin.from("guild_members").select("id").eq("user_id", userId).maybeSingle();
    if (existing) throw new Error("You are already in a guild. Leave first.");

    // Deduct 500 gems
    const { data: profile } = await supabaseAdmin.from("profiles").select("gems").eq("id", userId).single();
    if (!profile || profile.gems < 500) throw new Error("Need 500 Spirit Crystals to create a guild.");
    await supabaseAdmin.from("profiles").update({ gems: profile.gems - 500 }).eq("id", userId);

    // Create guild
    const { data: guild, error } = await supabaseAdmin.from("guilds").insert({
      name: data.name,
      description: data.description ?? null,
      leader_id: userId,
      privacy: data.privacy,
    }).select().single();
    if (error) throw error;

    // Add creator as leader
    await supabaseAdmin.from("guild_members").insert({
      guild_id: guild.id,
      user_id: userId,
      role: "leader",
    });

    return { guild };
  });

export const joinGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ guildId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: existing } = await supabaseAdmin.from("guild_members").select("id").eq("user_id", userId).maybeSingle();
    if (existing) throw new Error("Already in a guild.");

    const { data: guild } = await supabaseAdmin.from("guilds").select("*, guild_members(count)").eq("id", data.guildId).single();
    if (!guild) throw new Error("Guild not found.");

    await supabaseAdmin.from("guild_members").insert({ guild_id: data.guildId, user_id: userId, role: "member" });
    return { ok: true };
  });

export const leaveGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("guild_members").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const startQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ questTemplateId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: membership } = await supabaseAdmin.from("guild_members").select("guild_id").eq("user_id", userId).maybeSingle();
    if (!membership) throw new Error("Not in a guild.");

    // Check no active quest
    const { data: active } = await supabaseAdmin.from("guild_quests").select("id").eq("guild_id", membership.guild_id).eq("status", "active").maybeSingle();
    if (active) throw new Error("A quest is already active.");

    const { data: template } = await supabaseAdmin.from("quest_templates").select("*").eq("id", data.questTemplateId).single();
    if (!template) throw new Error("Quest template not found.");

    const collectionProgress: Record<string, number> = {};
    if (template.collection_items) {
      for (const item of template.collection_items as Array<{ name: string }>) {
        collectionProgress[item.name] = 0;
      }
    }

    const { data: quest } = await supabaseAdmin.from("guild_quests").insert({
      guild_id: membership.guild_id,
      quest_template_id: data.questTemplateId,
      started_by: userId,
      boss_hp_remaining: template.boss_hp,
      collection_progress: Object.keys(collectionProgress).length > 0 ? collectionProgress : null,
    }).select().single();

    // Auto-join all guild members as participants
    const { data: members } = await supabaseAdmin.from("guild_members").select("user_id").eq("guild_id", membership.guild_id);
    if (members) {
      await supabaseAdmin.from("quest_participants").insert(
        members.map((m) => ({ guild_quest_id: quest!.id, user_id: m.user_id })),
      );
    }

    return { quest };
  });

export const listQuestTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("quest_templates").select("*").order("difficulty");
    if (error) throw error;
    return { templates: data ?? [] };
  });
