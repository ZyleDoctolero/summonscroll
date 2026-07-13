# SummonScroll — Companion Game (Godot 4.4)

The "Throne State": watch the monsters your real-life habits earned go fight.
Plan + architecture: see `GAME_PLAN.md`. MVP = Login → Sanctum → Expedition → Loot.

## First run (checklist)
1. Install Godot 4.4+ (standard build): https://godotengine.org/download
2. Open Godot → Import → select this folder's `project.godot`.
3. Press F5. You should see the login screen (M0 = zero parse errors).
4. Sign in with your SummonScroll web-app email/password (M1).
5. Your roster loads from Supabase; the web app's island team is pre-selected (M2).
6. "Begin Expedition" spends stamina via the same server RPC the web app uses,
   then plays the battle log and shows the real loot (M3).

Notes
- The game stores only a refresh token, in Godot's `user://` folder.
- All outcomes are server-decided; the fight you watch is a deterministic
  replay seeded from the result (see `sim/expedition_sim.gd`).
- No stamina? Complete tasks in the web app — that's the whole point.
