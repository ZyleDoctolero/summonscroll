# SummonScroll — Godot Game Plan (10× Optimized)

The plan below started as "build the RPG" and was re-optimized ten times.
Each iteration names the flaw it kills. The result is a small, honest MVP
that plays to what the game uniquely adds — spectacle — while the web app
keeps doing what it already does well — management.

---

## The ten optimization passes

**v1 — naive:** Build the full RPG: 12 explorable realms, real-time combat,
evolution trees, world bosses.
*Flaw: multi-year scope; nothing shippable for months.*

**v2 — cut to the unique value:** The web app already covers tasks, gacha,
fusion, shop, profile. The ONLY thing the game adds that the web can't is
the **Throne State**: watching your investment fight. MVP = Expedition
Viewer (login → team → expedition → results), nothing else.
*Flaw killed: duplicate feature surface.*

**v3 — one owner per state:** The game persists NOTHING game-authoritative.
Supabase is the single source of truth; game stats are **derived at load**
from `user_monsters` (level, bond_percent, ascension) exactly like the web
derives them. The game writes only through EXISTING RPCs.
*Flaw killed: two-store sync bugs (the classic companion-app death).*

**v4 — server-authoritative outcomes, client-side spectacle:** The live DB
already has `run_expedition` (spends stamina, rolls loot, returns results).
The game calls it, receives the authoritative outcome, then **renders a
cinematic battle log seeded from that outcome**. The fight you watch is
deterministic dressing around a result the server already decided — so the
game cannot be a cheating vector and needs zero new endpoints.
*Flaw killed: client-rolled loot + new backend surface.*

**v5 — schema truth over doc truth:** The design doc's GDScript reference
(13-mechanics-and-sync.md) targets tables that don't exist (`user_data`,
`realm_progress`, `rank E–S`, `bond_level`). Every call in this project is
written against the REAL schema: `profiles`, `monsters`, `user_monsters`
(bond_percent, level, ascension_level), rarity enum `common…ex`, RPCs
`run_expedition`, `score_task`, `pull_banner`.
*Flaw killed: coding against fiction. (Doc drift noted, not silently fixed.)*

**v6 — four scenes, no more:**
1. `Boot` — restore session from `user://session.cfg`, route to Login/Sanctum.
2. `Login` — email+password → GoTrue password grant; store refresh token
   locally only (never in repo).
3. `Sanctum` — profile header (level/HP/crystals) + monster roster with
   derived stats; pick up to 4; one button: *Begin Expedition*.
4. `Expedition` — timeline playback of the generated log (floor cards, HP
   bars, intervention-style flavor), then a loot results panel.
*Flaw killed: UI scope creep. Everything else is post-MVP.*

**v7 — pure, seedable simulation:** `ExpeditionSim` is a `RefCounted` class
with no scene dependencies: `(team_stats, realm, seed, outcome) → Array of
events`. Same inputs, same log — replayable, unit-testable later with GUT,
and reusable when the highlight-reel feature arrives.
*Flaw killed: untestable logic welded into UI nodes.*

**v8 — art without an art pipeline:** MVP renders monsters as element-tinted
cards with name + stat bars, and *optionally* streams the exact same WebP
art the web app uses (art_url is a full path; base URL configurable).
Missing art falls back to the tinted card. No bundled sprites, no loading
wall.
*Flaw killed: blocking the game on the 31-monster art backlog.*

**v9 — failure modes designed up front:**
- 401 → one silent token refresh → else back to Login with a message.
- Offline / RPC error → expedition doesn't start; roster stays; readable error.
- No stamina → `run_expedition` raises; surface the server's message as-is.
- Session file corrupt → treat as logged out.
*Flaw killed: the demo that only works on the happy path.*

**v10 — numbered finish lines (Law: measure, don't eyeball):**
- **M0** Project opens in Godot 4.4+ with zero parse errors.
- **M1** Login round-trip: `access_token` acquired, profile row fetched,
  displayed name matches web app.
- **M2** Roster: `user_monsters?select=*,monster:monsters(*)` renders N ≥ 1
  cards with derived stats.
- **M3** Expedition: `run_expedition` returns 200; sim log plays ≥ 10
  events; loot panel shows the RPC's actual reward values; stamina visibly
  decreased on next Sanctum load.
- **M4 (post-MVP)** Highlight reel: pull the day's `task_events` and splice
  “intervention” beats into the log — the docs' Round 8 moment.
*Flaw killed: "done" as a feeling.*

---

## Architecture (final)

```
game/
  project.godot            Godot 4.4, autoloads, main scene = Boot
  autoloads/
    Config.gd              Supabase URL + anon (publishable) key, art base URL
    Sb.gd                  auth (password grant + refresh), REST/RPC helpers (await-based)
  sim/
    expedition_sim.gd      pure deterministic log generator (RefCounted)
  scenes/
    boot.tscn/.gd          session restore + routing
    login.tscn/.gd         email/password sign-in
    sanctum.tscn/.gd       profile + roster + team picker
    expedition.tscn/.gd    log playback + loot results
```

Security notes: the anon key is publishable by design (it ships in the web
bundle) — committing it is fine. Access/refresh tokens live only in
`user://session.cfg`. Nothing else touches disk.

## What is deliberately NOT in the MVP
Realms as explorable spaces, manual combat, evolution UI, artifacts, world
boss, interventions (needs M4 + web hooks), controller support, audio.
Each becomes its own milestone after M3 proves the loop.
