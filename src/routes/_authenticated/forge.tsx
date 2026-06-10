import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile } from "@/lib/game/supabase-api";

export const Route = createFileRoute("/_authenticated/forge")({
  head: () => ({ meta: [{ title: "The Forge — SummonScroll" }] }),
  component: ForgePage,
});

const CRAFTABLE_ITEMS = [
  { id: "iron_sword", name: "Iron Sword", slot: "weapon", str: 5, int: 0, con: 0, per: 0, rarity: "common", cost: { "Iron Ore": 5, gold: 100 } },
  { id: "shadow_cloak", name: "Shadow Cloak", slot: "armor", str: 0, int: 0, con: 2, per: 5, rarity: "rare", cost: { "Shadow Essence": 3, gold: 300 } },
  { id: "void_staff", name: "Void Staff", slot: "weapon", str: 0, int: 8, con: 0, per: 0, rarity: "epic", cost: { "Void Core": 1, "Shadow Essence": 5, gold: 1000 } },
];

function ForgePage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const invQ = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("inventory").select("*").eq("user_id", user!.id);
      return data ?? [];
    }
  });

  const craftMut = useMutation({
    mutationFn: async (item: typeof CRAFTABLE_ITEMS[0]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const inv = invQ.data ?? [];
      const profile = profileQ.data?.profile;
      if (!profile) throw new Error("Profile not loaded");

      if (profile.gold < item.cost.gold) throw new Error("Not enough gold.");

      const deducts: { id: string, newQ: number }[] = [];
      for (const [matName, qty] of Object.entries(item.cost)) {
        if (matName === "gold") continue;
        const mat = inv.find(i => i.item_name === matName);
        if (!mat || mat.quantity < qty) throw new Error(`Not enough ${matName}.`);
        deducts.push({ id: mat.id, newQ: mat.quantity - qty });
      }

      // Deduct materials
      for (const d of deducts) {
        if (d.newQ <= 0) await supabase.from("inventory").delete().eq("id", d.id);
        else await supabase.from("inventory").update({ quantity: d.newQ }).eq("id", d.id);
      }
      
      // Deduct gold
      await supabase.from("profiles").update({ gold: profile.gold - item.cost.gold }).eq("id", user.id);

      // We don't have equipment pre-populated, let's just insert it into equipment first if it doesn't exist
      const { data: eqExists } = await supabase.from("equipment").select("id").eq("name", item.name).maybeSingle();
      let eqId = eqExists?.id;
      if (!eqId) {
        const { data: newEq } = await supabase.from("equipment").insert({
          name: item.name, slot: item.slot as any, str_bonus: item.str, int_bonus: item.int, con_bonus: item.con, per_bonus: item.per, rarity: item.rarity
        }).select("id").single();
        eqId = newEq!.id;
      }

      // Give to user
      await supabase.from("user_equipment").insert({ user_id: user.id, equipment_id: eqId, is_equipped: false });
      return item;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`Crafted ${item.name}!`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invMap = (invQ.data ?? []).reduce((acc, i) => ({ ...acc, [i.item_name]: i.quantity }), {} as Record<string, number>);
  const gold = profileQ.data?.profile.gold ?? 0;

  return (
    <AppShell profile={profileQ.data?.profile as any}>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>The Forge</h1>
          <p className="text-sm" style={{ color: "#A09D96" }}>Craft equipment using materials found from completing tasks.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CRAFTABLE_ITEMS.map(item => {
            const canAfford = item.cost.gold <= gold && Object.entries(item.cost).every(([k, v]) => k === "gold" || (invMap[k] ?? 0) >= v);
            return (
              <div key={item.id} className="p-4 rounded-xl border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.08)" }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>{item.name}</h3>
                <div className="text-xs mb-3 text-[#A09D96]">
                  {item.str > 0 && <span className="mr-2">+{item.str} STR</span>}
                  {item.int > 0 && <span className="mr-2">+{item.int} INT</span>}
                  {item.con > 0 && <span className="mr-2">+{item.con} CON</span>}
                  {item.per > 0 && <span className="mr-2">+{item.per} PER</span>}
                </div>
                <div className="bg-[#0C0E14] p-3 rounded-md mb-4 border border-white/5">
                  <div className="text-xs font-bold mb-2 text-[#A09D96] uppercase tracking-wider">Required Materials</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between" style={{ color: gold >= item.cost.gold ? "#5FAD41" : "#E05252" }}>
                      <span>Gold</span>
                      <span>{item.cost.gold}</span>
                    </div>
                    {Object.entries(item.cost).filter(([k]) => k !== "gold").map(([k, v]) => (
                      <div key={k} className="flex justify-between" style={{ color: (invMap[k] ?? 0) >= v ? "#5FAD41" : "#E05252" }}>
                        <span>{k}</span>
                        <span>{invMap[k] ?? 0} / {v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  disabled={!canAfford || craftMut.isPending}
                  onClick={() => craftMut.mutate(item)}
                  className="w-full py-2 rounded font-bold transition-all disabled:opacity-50"
                  style={{ background: canAfford ? "#C89A3E" : "#333", color: canAfford ? "#0C0E14" : "#A09D96" }}
                >
                  {craftMut.isPending ? "Crafting..." : "Craft"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
