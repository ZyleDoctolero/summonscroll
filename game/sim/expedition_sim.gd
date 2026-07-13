class_name ExpeditionSim
extends RefCounted
## Pure, seedable expedition log generator (GAME_PLAN.md v4/v7).
##
## The OUTCOME (loot, stamina) is decided server-side by run_expedition.
## This class only dresses that authoritative outcome in a floor-by-floor
## battle log for playback. Same inputs + seed => identical log.
##
## No scene dependencies. Testable headless.

const FLOORS := 5

const ENEMIES := {
	"iron_pits": ["Slag Crawler", "Hammer Wisp", "Pit Foreman", "Cinder Golem", "The Anvil-Bound"],
	"sage_wood": ["Page Moth", "Ink Sprite", "Lexicon Owl", "Margin Stalker", "The Unread"],
	"stone_heights": ["Cliff Kite", "Scree Imp", "Wind Carver", "Summit Warden", "The Steady One"],
	"crossroads": ["Way Rat", "Lantern Ghast", "Toll Keeper", "Path Weaver", "The Third Sign"],
}

const FLAVOR_HITS := [
	"%s strikes %s for %d!",
	"%s channels its element — %s takes %d!",
	"%s lunges. %s staggers for %d damage!",
]
const FLAVOR_HURT := [
	"%s claws back — %s loses %d HP.",
	"%s retaliates! %s takes %d.",
]


## team: Array of stat dicts from Sb.derive_stats().
## exp_type: iron_pits | sage_wood | stone_heights | crossroads.
## outcome: the run_expedition RPC result {newStamina, drops}.
## Returns Array[Dictionary] of events:
##   {kind:"floor", floor, enemy} | {kind:"hit"|"hurt", text, actor_index, hp_pct}
##   | {kind:"loot", drops} | {kind:"end", victory:true}
static func build_log(team: Array, exp_type: String, outcome: Dictionary, seed_value: int) -> Array:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value
	var events: Array = []
	if team.is_empty():
		return events

	var enemies: Array = ENEMIES.get(exp_type, ENEMIES["crossroads"])
	var team_hp: Array[float] = []
	for member in team:
		team_hp.append(1.0)

	for floor_i in range(FLOORS):
		var enemy: String = enemies[mini(floor_i, enemies.size() - 1)]
		events.append({"kind": "floor", "floor": floor_i + 1, "enemy": enemy})

		var rounds := 2 + rng.randi_range(0, 2)
		for r in range(rounds):
			var idx := rng.randi_range(0, team.size() - 1)
			var member: Dictionary = team[idx]
			var dmg := int(member.get("atk", 10) * rng.randf_range(0.8, 1.3))
			var tmpl: String = FLAVOR_HITS[rng.randi_range(0, FLAVOR_HITS.size() - 1)]
			events.append({
				"kind": "hit",
				"actor_index": idx,
				"text": tmpl % [member.get("name", "?"), enemy, dmg],
				"hp_pct": team_hp[idx],
			})
			# The server already decided we win, so damage taken is cosmetic
			# and never lethal: floor at 35% HP.
			if rng.randf() < 0.45:
				var back_idx := rng.randi_range(0, team.size() - 1)
				var victim: Dictionary = team[back_idx]
				var taken := int(maxf(1.0, victim.get("hp", 100) * rng.randf_range(0.04, 0.10)))
				team_hp[back_idx] = maxf(0.35, team_hp[back_idx] - rng.randf_range(0.05, 0.12))
				var tmpl2: String = FLAVOR_HURT[rng.randi_range(0, FLAVOR_HURT.size() - 1)]
				events.append({
					"kind": "hurt",
					"actor_index": back_idx,
					"text": tmpl2 % [enemy, victim.get("name", "?"), taken],
					"hp_pct": team_hp[back_idx],
				})

	events.append({"kind": "loot", "drops": outcome.get("drops", [])})
	events.append({"kind": "end", "victory": true})
	return events


## Stable seed so replaying the same outcome shows the same fight.
static func seed_from_outcome(user_id: String, exp_type: String, outcome: Dictionary) -> int:
	var basis := user_id + "|" + exp_type + "|" + JSON.stringify(outcome.get("drops", []))
	return hash(basis)
