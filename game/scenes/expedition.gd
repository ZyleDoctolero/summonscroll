extends Control
## Expedition: call run_expedition (authoritative), then play the seeded
## cinematic log and show loot (GAME_PLAN.md v4/v6 scene 4).

const EVENT_DELAY := 0.9

var _team: Array = []
var _exp_type: String = "crossroads"

var _title: Label
var _log: RichTextLabel
var _hp_row: HBoxContainer
var _hp_bars: Array[ProgressBar] = []
var _done: Button


func _ready() -> void:
	var payload: Dictionary = {}
	if get_tree().root.has_meta("expedition_payload"):
		payload = get_tree().root.get_meta("expedition_payload")
	_team = payload.get("team", [])
	_exp_type = str(payload.get("exp_type", "crossroads"))

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 24)
	add_child(margin)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	margin.add_child(box)

	_title = Label.new()
	_title.add_theme_font_size_override("font_size", 22)
	_title.text = "Opening the way…"
	box.add_child(_title)

	_hp_row = HBoxContainer.new()
	_hp_row.add_theme_constant_override("separation", 12)
	box.add_child(_hp_row)
	for member in _team:
		var col := VBoxContainer.new()
		var nm := Label.new()
		nm.text = str(member.get("name", "?"))
		nm.add_theme_color_override(
			"font_color", Config.element_color(str(member.get("element", "arcane")))
		)
		col.add_child(nm)
		var bar := ProgressBar.new()
		bar.min_value = 0.0
		bar.max_value = 1.0
		bar.value = 1.0
		bar.custom_minimum_size = Vector2(180, 14)
		bar.show_percentage = false
		col.add_child(bar)
		_hp_bars.append(bar)
		_hp_row.add_child(col)

	_log = RichTextLabel.new()
	_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_log.scroll_following = true
	box.add_child(_log)

	_done = Button.new()
	_done.text = "Return to Sanctum"
	_done.custom_minimum_size = Vector2(0, 52)
	_done.visible = false
	_done.pressed.connect(func() -> void:
		get_tree().change_scene_to_file("res://scenes/sanctum.tscn")
	)
	box.add_child(_done)

	_run.call_deferred()


func _run() -> void:
	if _team.is_empty():
		_finish_with_error("No team was selected.")
		return

	_title.text = "Petitioning the realm…"
	var res: Dictionary = await Sb.rpc_call("run_expedition", {"p_exp_type": _exp_type})
	if not res.ok:
		_finish_with_error(str(res.get("error", "The expedition could not begin.")))
		return

	var outcome: Dictionary = res.data if res.data is Dictionary else {}
	_title.text = "Expedition — " + _exp_type.replace("_", " ").capitalize()

	var seed_value := ExpeditionSim.seed_from_outcome(Sb.user_id, _exp_type, outcome)
	var events := ExpeditionSim.build_log(_team, _exp_type, outcome, seed_value)

	for event in events:
		await get_tree().create_timer(EVENT_DELAY).timeout
		match str(event.get("kind", "")):
			"floor":
				_log.append_text("\n[b]— Floor %d: %s —[/b]\n" % [int(event["floor"]), str(event["enemy"])])
			"hit":
				_log.append_text("  " + event.text + "\n")
			"hurt":
				_log.append_text("  [color=#e08080]" + event.text + "[/color]\n")
				var i: int = int(event["actor_index"])
				if i >= 0 and i < _hp_bars.size():
					_hp_bars[i].value = float(event["hp_pct"])
			"loot":
				_log.append_text("\n[b]Spoils claimed:[/b]\n")
				var drops: Array = event["drops"]
				if drops.is_empty():
					_log.append_text("  The realm was quiet today — no drops.\n")
				for d in drops:
					_log.append_text("  • %s ×%d\n" % [str(d.get("name", "?")), int(d.get("qty", 1))])
			"end":
				_log.append_text("\n[b]The team returns victorious.[/b]\n")

	if outcome.has("newStamina"):
		_log.append_text("Stamina remaining: %d\n" % int(outcome["newStamina"]))
	_done.visible = true


func _finish_with_error(msg: String) -> void:
	_title.text = "The way is barred."
	_log.append_text(msg + "\n\nNothing was spent. Return and try again.")
	_done.visible = true
