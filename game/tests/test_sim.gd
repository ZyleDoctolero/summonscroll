extends SceneTree
## Headless smoke test for ExpeditionSim (run: godot --headless -s test_sim.gd)

func _init() -> void:
	var team := [
		{"um_id": "a", "name": "Ash Knight", "element": "fire", "atk": 40, "hp": 300},
		{"um_id": "b", "name": "Frost Bug", "element": "water", "atk": 25, "hp": 220},
	]
	var outcome := {"newStamina": 3, "drops": [{"type": "stone", "name": "Sage Stone", "qty": 2}]}
	var seed_value := ExpeditionSim.seed_from_outcome("user-1", "sage_wood", outcome)
	var log1 := ExpeditionSim.build_log(team, "sage_wood", outcome, seed_value)
	var log2 := ExpeditionSim.build_log(team, "sage_wood", outcome, seed_value)

	assert(log1.size() > 10, "log too short: %d" % log1.size())
	assert(JSON.stringify(log1) == JSON.stringify(log2), "sim not deterministic!")
	assert(log1[0]["kind"] == "floor", "first event must be a floor")
	assert(log1[-1]["kind"] == "end", "last event must be end")
	assert(log1[-2]["kind"] == "loot", "second-to-last must be loot")
	var floors := 0
	for e in log1:
		if e["kind"] == "floor":
			floors += 1
	assert(floors == 5, "expected 5 floors, got %d" % floors)
	# empty team must not crash
	assert(ExpeditionSim.build_log([], "iron_pits", outcome, 1).is_empty(), "empty team should give empty log")

	print("SIM TEST PASS — %d events, deterministic, 5 floors, loot+end ordered" % log1.size())
	quit(0)
