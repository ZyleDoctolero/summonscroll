import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { whisper } from "@/components/game/WhisperFeed";

const META_VOICE_LINES = [
  "The Page receives what was offered.",
  "An ink-stroke added. The record grows.",
  "What was done today cannot be undone.",
  "The discipline was written. The Page remembers.",
];

export function useWhisperFeed() {
  const triggerWhisper = useCallback(async (growthTicks: any[], taskRealmId: number | null) => {
    // 30% chance minimum on all positive completions
    if (Math.random() > 0.3) return;

    let line: string;
    let monsterName: string = "The Page";

    if (growthTicks.length > 0) {
      // Monster-specific whisper
      const tick = growthTicks[0];
      monsterName = tick.monsterName;
      line = `${tick.monsterName} drew closer to your discipline.`;
    } else if (taskRealmId) {
      // Fetch from DB lore_lines
      const { data } = await supabase
        .from("realms")
        .select("lore_lines")
        .eq("id", taskRealmId)
        .single();
      const lines = data?.lore_lines ?? [];
      line =
        lines.length > 0
          ? lines[Math.floor(Math.random() * lines.length)]
          : META_VOICE_LINES[Math.floor(Math.random() * META_VOICE_LINES.length)];
    } else {
      // Metacosmology fallback - the Page itself speaks
      line = META_VOICE_LINES[Math.floor(Math.random() * META_VOICE_LINES.length)];
    }

    whisper({
      monsterName,
      line,
      tone: "calm",
    });
  }, []);

  return { triggerWhisper };
}
