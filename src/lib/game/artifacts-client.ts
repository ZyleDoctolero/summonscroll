import { supabase } from "@/integrations/supabase/client";

export async function listMyArtifacts() {
  const { data, error } = await supabase
    .from("monster_artifacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { artifacts: data ?? [] };
}

export async function equipArtifact(artifactId: string, monsterId: string) {
  const { data, error } = await supabase
    .from("monster_artifacts")
    .update({ monster_id: monsterId })
    .eq("id", artifactId);
  if (error) throw error;
  return data;
}

export async function unequipArtifact(artifactId: string) {
  const { data, error } = await supabase
    .from("monster_artifacts")
    .update({ monster_id: null })
    .eq("id", artifactId);
  if (error) throw error;
  return data;
}
