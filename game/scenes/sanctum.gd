extends Control
## Sanctum: profile header + roster + team pick + launch (GAME_PLAN.md v6 scene 3).
## All data is fetched fresh from Supabase; nothing is cached to disk.

const MAX_TEAM := 4

var _profile: Dictionary = {}
var _roster: Array = []            # derived stat dicts
var _selected: Array[String] = []  # um_ids

var _header: Label
var _grid: GridContainer
var _launch: Button
var _status: Label


func _ready() -> void:
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 24)
	add_child(margin)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	margin.add_child(box)

	_header = Label.new()
	_header.text = "Loading your Sanctum…"
	_header.add_theme_font_size_override("font_size", 20)
	box.add_child(_header)

	_status = Label.new()
	_status.modulate = Color(1, 1, 1, 0.75)
	box.add_child(_status)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	box.add_child(scroll)

	_grid = GridContainer.new()
	_grid.columns = 4
	_grid.add_theme_constant_override("h_separation", 12)
	_grid.add_theme_constant_override("v_separation", 12)
	_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_grid)

	var bottom := HBoxContainer.new()
	bottom.add_theme_constant_override("separation", 12)
	box.add_child(bottom)

	_launch = Button.new()
	_launch.text = "Begin Expedition (pick a team)"
	_launch.custom_minimum_size = Vector2(0, 52)
	_launch.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_launch.disabled = true
	_launch.pressed.connect(_on_launch)
	bottom.add_child(_launch)

	var logout := Button.new()
	logout.text = "Sign Out"
	logout.custom_minimum_size = Vector2(120, 52)
	logout.pressed.connect(func() -> void:
		Sb.sign_out()
		get_tree().change_scene_to_file("res://scenes/login.tscn")
	)
	bottom.add_child(logout)

	_load.call_deferred()


func _load() -> void:
	var prof_res: Dictionary = await Sb.rest_get(
		"profiles?id=eq." + Sb.user_id
		+ "&select=display_name,level,hp,max_hp,gold,crystals,stamina,stamina_max"
	)
	if not prof_res.ok or not (prof_res.data is Array) or (prof_res.data as Array).is_empty():
		_fail("Could not load your profile: " + str(prof_res.get("error", "unknown")))
		return
	_profile = prof_res.data[0]

	var mon_res: Dictionary = await Sb.rest_get(
		"user_monsters?user_id=eq." + Sb.user_id
		+ "&select=id,level,bond_percent,ascension_level,is_on_team,"
		+ "monster:monsters(name,element,rarity,role,art_url,base_hp,base_atk,base_def,base_spd)"
		+ "&order=level.desc&limit=24"
	)
	if not mon_res.ok:
		_fail("Could not load your monsters: " + str(mon_res.get("error", "unknown")))
		return

	_roster.clear()
	_selected.clear()
	for um in (mon_res.data as Array):
		var stats := Sb.derive_stats(um)
		_roster.append(stats)
		# Pre-select the web app's island team.
		if bool(um.get("is_on_team", false)) and _selected.size() < MAX_TEAM:
			_selected.append(str(stats["um_id"]))

	_render()


func _fail(msg: String) -> void:
	_header.text = "The Sanctum doors are stuck."
	_status.text = msg + "  (Check your connection, then reopen the game.)"


func _render() -> void:
	_header.text = "%s — Lv.%d   HP %d/%d   ✦%d gold   ◆%d crystals   ⚡%d/%d stamina" % [
		str(_profile.get("display_name", "Summoner")),
		int(_profile.get("level", 1)),
		int(_profile.get("hp", 0)), int(_profile.get("max_hp", 0)),
		int(_profile.get("gold", 0)), int(_profile.get("crystals", 0)),
		int(_profile.get("stamina", 0)), int(_profile.get("stamina_max", 0)),
	]
	for child in _grid.get_children():
		child.queue_free()
	if _roster.is_empty():
		_status.text = "No monsters yet — summon your first at the web app's Altar."
		return
	_status.text = "Pick up to %d souls for today's expedition." % MAX_TEAM
	for stats in _roster:
		_grid.add_child(_make_card(stats))
	_update_launch()


func _make_card(stats: Dictionary) -> Button:
	var card := Button.new()
	card.toggle_mode = true
	card.button_pressed = _selected.has(str(stats["um_id"]))
	card.custom_minimum_size = Vector2(260, 110)
	card.text = "%s  (Lv.%d %s)\nHP %d  ATK %d  DEF %d\nBond %d%%" % [
		str(stats["name"]), int(stats["level"]), str(stats["rarity"]),
		int(stats["hp"]), int(stats["atk"]), int(stats["def"]), int(stats["bond"]),
	]
	card.add_theme_color_override("font_color", Config.element_color(str(stats["element"])))
	card.toggled.connect(func(on: bool) -> void: _on_card_toggled(str(stats["um_id"]), on, card))
	return card


func _on_card_toggled(um_id: String, on: bool, card: Button) -> void:
	if on:
		if _selected.size() >= MAX_TEAM:
			card.button_pressed = false
			_status.text = "A team carries at most %d souls." % MAX_TEAM
			return
		_selected.append(um_id)
	else:
		_selected.erase(um_id)
	_update_launch()


func _update_launch() -> void:
	_launch.disabled = _selected.is_empty()
	_launch.text = (
		"Begin Expedition (%d/%d)" % [_selected.size(), MAX_TEAM]
		if not _selected.is_empty()
		else "Begin Expedition (pick a team)"
	)


func _on_launch() -> void:
	var team: Array = []
	for stats in _roster:
		if _selected.has(str(stats["um_id"])):
			team.append(stats)
	# Expedition type follows the web app's day-of-week rotation.
	var types := ["crossroads", "iron_pits", "sage_wood", "stone_heights",
		"iron_pits", "sage_wood", "crossroads"]
	var exp_type: String = types[Time.get_datetime_dict_from_system().weekday]
	var payload := {"team": team, "exp_type": exp_type}
	get_tree().root.set_meta("expedition_payload", payload)
	get_tree().change_scene_to_file("res://scenes/expedition.tscn")
