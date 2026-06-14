import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Compute dynamic score for a template
function scoreTemplate(template: any, profile: any, userMonsters: any[]) {
  let score = template.base_score;
  
  // Example dynamic checks
  if (template.requires_crystals_min && profile.crystals < template.requires_crystals_min) {
    return -1; // impossible
  }

  // Favor realms where user has a bonded monster
  if (template.realm_id) {
    const hasRealm = userMonsters.some(m => m.monster.realm_id === template.realm_id);
    if (hasRealm) score += 50;
  }

  // Add RNG variance
  score += Math.floor(Math.random() * 40);

  return score;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Auth Header" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const today = new Date().toISOString().slice(0, 10);
    
    // 1. Run core daily reset math
    const { data: resetResult, error: resetError } = await supabase.rpc("run_daily_reset", {
      p_user_id: user.id,
      p_today: today
    });

    if (resetError) {
      return new Response(JSON.stringify({ error: resetError.message }), { status: 400, headers: corsHeaders });
    }

    // 2. Generate new Dynamic Side Quests if this was a fresh day
    if (resetResult?.ran) {
      const [profileRes, monstersRes, templatesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_monsters").select("*, monster:monsters(realm_id)").eq("user_id", user.id),
        supabase.from("side_quest_templates").select("*")
      ]);

      if (profileRes.data && templatesRes.data) {
        const templates = templatesRes.data;
        const profile = profileRes.data;
        const userMonsters = monstersRes.data || [];

        // Clean up old side quests
        await supabase.from("tasks").delete().eq("user_id", user.id).eq("category", "side_quest");

        // Score all templates
        const scored = templates.map(t => ({
          template: t,
          score: scoreTemplate(t, profile, userMonsters)
        })).filter(t => t.score > 0);

        // Sort desc, pick top 4
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 4);

        if (top.length > 0) {
          const newTasks = top.map(t => ({
            user_id: user.id,
            title: t.template.title,
            notes: t.template.description,
            type: "todo",
            category: "side_quest",
            difficulty: "medium",
            realm_id: t.template.realm_id
          }));
          await supabase.from("tasks").insert(newTasks);
        }
      }
    }

    return new Response(JSON.stringify(resetResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
